import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    return NextResponse.json({ coupon });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
