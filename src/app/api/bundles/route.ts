import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { z } from "zod";

const bundleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
  discountValue: z.number().min(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .min(2),
});

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const bundles = await prisma.bundle.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { product: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } },
      },
    },
  });
  return NextResponse.json({ bundles });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = bundleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { items, ...data } = parsed.data;
    const bundle = await prisma.bundle.create({
      data: {
        ...data,
        items: {
          create: items.map((it, sortOrder) => ({
            productId: it.productId,
            quantity: it.quantity,
            sortOrder,
          })),
        },
      },
      include: { items: true },
    });
    return NextResponse.json({ bundle });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Create failed" }, { status: 500 });
  }
}
