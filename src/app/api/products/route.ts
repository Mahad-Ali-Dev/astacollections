import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  // Hidden products stay hidden here too. The storefront pages already filter
  // on isActive, but this endpoint did not — so anything reading it (a
  // catalogue feed, an ad integration) was still being handed products the
  // shop had deliberately taken down. Admins can ask for everything.
  const admin = await getAdminFromRequest(req);
  const search = q
    ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] }
    : {};
  const where = admin ? search : { ...search, isActive: true };

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
    const { images, extraCategoryIds, ...data } = parsed.data;
    const extras = extraCategoryIds.filter((id) => id !== data.categoryId);

    const product = await prisma.product.create({
      data: {
        ...data,
        images: { create: images.map((url, sortOrder) => ({ url, sortOrder })) },
        extraCategories: { connect: extras.map((id) => ({ id })) },
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
