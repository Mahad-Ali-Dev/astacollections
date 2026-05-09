import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const where = q
    ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] }
    : {};

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { images, ...data } = parsed.data;

    const product = await prisma.product.create({
      data: {
        ...data,
        images: { create: images.map((url, sortOrder) => ({ url, sortOrder })) },
      },
      include: { images: true },
    });
    return NextResponse.json({ product });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "SKU or slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Create failed" }, { status: 500 });
  }
}
