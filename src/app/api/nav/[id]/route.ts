import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const updateSchema = z.object({
  label: z.string().min(1).optional(),
  href: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
});

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Prevent setting itself as a parent (would create a cycle)
    if (parsed.data.parentId === id) {
      return NextResponse.json({ error: "An item cannot be its own parent" }, { status: 400 });
    }

    const item = await prisma.navItem.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  // Children cascade-delete via schema FK
  await prisma.navItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
