import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const category = await prisma.category.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ category });
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
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${count} product(s) use this category` },
      { status: 400 }
    );
  }
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
