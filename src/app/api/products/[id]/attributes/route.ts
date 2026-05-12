import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const optionSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1),
  colorHex: z.string().optional().nullable(),
  priceModifier: z.number().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const attributeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(["OPTION", "COLOR", "SIZE"]).default("OPTION"),
  required: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
  options: z.array(optionSchema).default([]),
});

const replaceSchema = z.object({
  attributes: z.array(attributeSchema),
});

// GET — list attributes for a product (public, used by product page)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const attributes = await prisma.productAttribute.findMany({
    where: { productId: id },
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  return NextResponse.json({ attributes });
}

// PUT — replace all attributes + options for a product (admin only)
// Uses a transaction: delete existing, recreate from payload.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: productId } = await ctx.params;

  try {
    const body = await req.json();
    const parsed = replaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Nuke and recreate — simpler than diffing
      await tx.productAttribute.deleteMany({ where: { productId } });
      for (let i = 0; i < parsed.data.attributes.length; i++) {
        const attr = parsed.data.attributes[i];
        await tx.productAttribute.create({
          data: {
            productId,
            name: attr.name,
            type: attr.type,
            required: attr.required,
            sortOrder: attr.sortOrder ?? i,
            options: {
              create: attr.options.map((o, j) => ({
                value: o.value,
                colorHex: o.colorHex || null,
                priceModifier: o.priceModifier ?? null,
                sortOrder: o.sortOrder ?? j,
              })),
            },
          },
        });
      }
    });

    const attributes = await prisma.productAttribute.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ attributes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Save failed" }, { status: 500 });
  }
}
