import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

/**
 * Bulk-create reviews from the admin panel.
 *
 * Products are matched by SKU first, then slug, then exact name, so pasted
 * rows work with whichever identifier is easiest to copy out of a spreadsheet.
 * Rows that don't resolve are reported back rather than silently dropped —
 * a partial import you don't know about is worse than a loud failure.
 */

/** Ceiling on one import. createMany handles this comfortably in a single
 *  round trip; the limit exists to keep a runaway paste from timing out. */
const MAX_ROWS = 1000;

type IncomingRow = {
  product?: string;
  customerName?: string;
  customerEmail?: string;
  rating?: number | string;
  title?: string;
  body?: string;
  verified?: boolean;
  createdAt?: string;
};

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rows } = (await req.json()) as { rows?: IncomingRow[] };
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows supplied" }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Import at most ${MAX_ROWS} rows at a time` },
        { status: 400 }
      );
    }

    // One lookup for the whole batch instead of a query per row.
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, slug: true, name: true },
    });
    const byKey = new Map<string, string>();
    for (const p of products) {
      if (p.sku) byKey.set(p.sku.trim().toLowerCase(), p.id);
      byKey.set(p.slug.trim().toLowerCase(), p.id);
      byKey.set(p.name.trim().toLowerCase(), p.id);
    }

    const toCreate: {
      productId: string;
      customerName: string;
      customerEmail: string;
      rating: number;
      title: string | null;
      body: string;
      verified: boolean;
      status: "APPROVED";
      createdAt?: Date;
    }[] = [];
    const errors: { row: number; reason: string }[] = [];

    rows.forEach((r, i) => {
      const line = i + 1;
      const key = (r.product ?? "").trim().toLowerCase();
      const productId = byKey.get(key);
      if (!productId) {
        errors.push({ row: line, reason: `No product matches "${r.product ?? ""}"` });
        return;
      }

      const rating = Number(r.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push({ row: line, reason: `Rating must be a whole number 1-5` });
        return;
      }

      const name = (r.customerName ?? "").trim();
      const body = (r.body ?? "").trim();
      if (!name) {
        errors.push({ row: line, reason: "Customer name is required" });
        return;
      }
      if (body.length < 3) {
        errors.push({ row: line, reason: "Review text is required" });
        return;
      }

      let createdAt: Date | undefined;
      if (r.createdAt) {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) createdAt = d;
      }

      toCreate.push({
        productId,
        customerName: name,
        customerEmail: (r.customerEmail ?? "").trim(),
        rating,
        title: (r.title ?? "").trim() || null,
        body,
        verified: r.verified === true,
        status: "APPROVED",
        ...(createdAt ? { createdAt } : {}),
      });
    });

    let imported = 0;
    if (toCreate.length > 0) {
      const result = await prisma.review.createMany({ data: toCreate });
      imported = result.count;
    }

    return NextResponse.json({ imported, skipped: errors.length, errors });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Import failed" }, { status: 500 });
  }
}

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/**
 * Delete reviews in bulk — all of them, or just one status.
 *
 * There is no undo, so the caller must echo back the exact count it expects
 * to delete. If the number has moved since the confirmation screen was
 * rendered (a customer left a review in the meantime), the request is
 * rejected rather than deleting more than the admin agreed to.
 */
export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const statusParam = req.nextUrl.searchParams.get("status") ?? "ALL";
    const expected = Number(req.nextUrl.searchParams.get("expected"));

    if (statusParam !== "ALL" && !STATUSES.includes(statusParam as any)) {
      return NextResponse.json({ error: "Unknown status filter" }, { status: 400 });
    }
    if (!Number.isInteger(expected) || expected < 0) {
      return NextResponse.json(
        { error: "Confirmation count missing" },
        { status: 400 }
      );
    }

    const where = statusParam === "ALL" ? {} : { status: statusParam as any };

    const actual = await prisma.review.count({ where });
    if (actual !== expected) {
      return NextResponse.json(
        {
          error: `Count changed — ${actual} reviews now match, not ${expected}. Reload and try again.`,
        },
        { status: 409 }
      );
    }

    const { count } = await prisma.review.deleteMany({ where });
    return NextResponse.json({ deleted: count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Delete failed" }, { status: 500 });
  }
}
