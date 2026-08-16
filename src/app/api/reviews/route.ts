import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(10, "Tell us a bit more (at least 10 characters)").max(2000),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  const status = url.searchParams.get("status");
  const admin = await getAdminFromRequest(req);

  // Public can only see APPROVED, admin can see all
  const where: any = {};
  if (productId) where.productId = productId;
  if (admin) {
    if (status) where.status = status;
  } else {
    where.status = "APPROVED";
  }

  // Paged so a product page can keep loading past the first batch. `total`
  // travels with the response so the client knows when to stop asking.
  const MAX_TAKE = admin ? 200 : 50;
  const take = Math.min(MAX_TAKE, Math.max(1, Number(url.searchParams.get("take")) || MAX_TAKE));
  const skip = Math.max(0, Number(url.searchParams.get("skip")) || 0);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      // Site-wide listings need the product named on each card, otherwise a
      // shopper can't tell which piece a review is about.
      include:
        admin || !productId
          ? { product: { select: { name: true, slug: true } } }
          : undefined,
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json({ reviews, total, skip, take });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await getCustomerFromRequest(req);

    // If logged in, prefill name/email; otherwise expect them in payload
    const payload = customer
      ? { ...body, customerName: customer.name, customerEmail: customer.email }
      : body;

    const parsed = reviewSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        productId: parsed.data.productId,
        rating: parsed.data.rating,
        title: parsed.data.title || null,
        body: parsed.data.body,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      review: { id: review.id, status: review.status },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to submit review" }, { status: 500 });
  }
}
