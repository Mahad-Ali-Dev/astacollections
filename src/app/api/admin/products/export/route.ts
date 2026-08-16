import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

/**
 * Export the catalogue as CSV.
 *
 * The first two columns are name and SKU because the usual reason to pull
 * this is to build a review import file, and the importer matches on SKU.
 * Pass ?all=1 to include inactive products.
 */
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const includeInactive = req.nextUrl.searchParams.get("all") === "1";

  const products = await prisma.product.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  const csv = toCsv(
    ["name", "sku", "slug", "price", "comparePrice", "stock", "category", "active"],
    products.map((p) => [
      p.name,
      p.sku,
      p.slug,
      p.price,
      p.comparePrice ?? "",
      p.stock,
      p.category?.name ?? "",
      p.isActive ? "yes" : "no",
    ])
  );

  // Leading BOM so Excel reads product names as UTF-8 instead of mangling
  // the accented and curly-quoted ones.
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asta-products.csv"`,
    },
  });
}
