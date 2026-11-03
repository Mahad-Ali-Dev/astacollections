import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";
import { toPublicProduct } from "@/lib/public-fields";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  // Hidden products stay hidden here too. The storefront pages already filter
  // on isActive, but this endpoint did not — so anything reading it (a
  // catalogue feed, an ad integration) was still being handed products the
  // shop had deliberately taken down. Admins can ask for everything.
  const admin = await getAdminFromRequest(req);
  // Case-insensitive so the storefront's live search finds "Ring" for "ring".
  const search = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
          { tags: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  // Optional cap (live search asks for a handful); admin lists stay unlimited.
  const takeParam = Number(url.searchParams.get("take"));
  const take = Number.isFinite(takeParam) && takeParam > 0 ? Math.min(50, takeParam) : undefined;
  const where = admin ? search : { ...search, isActive: true };

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    ...(take ? { take } : {}),
  });
  // Cost price (the store's margin) is for admins only.
  return NextResponse.json({ products: admin ? products : products.map(toPublicProduct) });
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
