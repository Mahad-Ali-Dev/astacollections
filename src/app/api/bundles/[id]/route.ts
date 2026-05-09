import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { z } from "zod";

const bundleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .min(2),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

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
    const bundle = await prisma.$transaction(async (tx) => {
      await tx.bundleItem.deleteMany({ where: { bundleId: id } });
      return tx.bundle.update({
        where: { id },
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
    });
    return NextResponse.json({ bundle });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.bundle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
