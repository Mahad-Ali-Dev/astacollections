import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
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

    // Replace images
    const product = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...data,
          images: { create: images.map((url, sortOrder) => ({ url, sortOrder })) },
        },
        include: { images: true },
      });
    });
    return NextResponse.json({ product });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "SKU or slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
