import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const coupon = await prisma.coupon.create({
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
    return NextResponse.json({ error: e.message ?? "Create failed" }, { status: 500 });
  }
}
