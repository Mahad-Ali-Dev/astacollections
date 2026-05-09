import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomerFromRequest } from "@/lib/auth";

const toggleSchema = z.object({
  productId: z.string().min(1),
});

// GET — list current customer's wishlist (or empty if not logged in)
export async function GET(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return NextResponse.json({ items: [] });

  const items = await prisma.wishlistItem.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      createdAt: i.createdAt,
      product: {
        id: i.product.id,
        name: i.product.name,
        slug: i.product.slug,
        sku: i.product.sku,
        price: i.product.price,
        comparePrice: i.product.comparePrice,
        stock: i.product.stock,
        image: i.product.images[0]?.url,
        isFeatured: i.product.isFeatured,
      },
    })),
  });
}

// POST — toggle a product in the wishlist (idempotent: add if missing, remove if present)
export async function POST(req: NextRequest) {
  const customer = await getCustomerFromRequest(req);
  if (!customer) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      customerId_productId: {
        customerId: customer.id,
        productId: parsed.data.productId,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ added: false });
  }

  await prisma.wishlistItem.create({
    data: { customerId: customer.id, productId: parsed.data.productId },
  });
  return NextResponse.json({ added: true });
}
