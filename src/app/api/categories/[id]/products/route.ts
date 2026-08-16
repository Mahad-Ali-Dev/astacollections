import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

/**
 * Read and set which products appear in a category *in addition* to the ones
 * that have it as their primary category.
 *
 * Primary membership is owned by the product itself (Product.categoryId) and
 * is deliberately not touched here — moving a product's home category changes
 * its breadcrumbs and structured data, which shouldn't happen as a side
 * effect of curating a collection.
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [category, products] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        extraProducts: { select: { id: true } },
      },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        comparePrice: true,
        stock: true,
        isActive: true,
        categoryId: true,
        category: { select: { name: true } },
      },
      orderBy: [{ stock: "desc" }, { price: "desc" }],
    }),
  ]);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({
    categoryName: category.name,
    selected: category.extraProducts.map((p) => p.id),
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      comparePrice: p.comparePrice,
      /// A struck-through compare price above the selling price is what the
      /// storefront renders as a discount, so that's what "on sale" means.
      onSale: p.comparePrice != null && p.comparePrice > p.price,
      stock: p.stock,
      isActive: p.isActive,
      // Products already living here don't need adding again.
      isPrimary: p.categoryId === id,
      categoryName: p.category?.name ?? "",
    })),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const ids: unknown = body?.productIds;

    if (!Array.isArray(ids) || ids.some((v) => typeof v !== "string")) {
      return NextResponse.json({ error: "productIds must be an array of ids" }, { status: 400 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Drop anything whose primary category is already this one — storing it in
    // both relations would list the product twice on the category page.
    const valid = await prisma.product.findMany({
      where: { id: { in: ids as string[] }, categoryId: { not: id } },
      select: { id: true },
    });

    // set() rather than connect() so unticking actually removes.
    await prisma.category.update({
      where: { id },
      data: { extraProducts: { set: valid.map((p) => ({ id: p.id })) } },
    });

    return NextResponse.json({ saved: valid.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Save failed" }, { status: 500 });
  }
}
