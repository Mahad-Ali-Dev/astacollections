import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();
    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).toUpperCase() },
    });
    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or inactive coupon" }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return NextResponse.json({ error: "Coupon not yet active" }, { status: 400 });
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      return NextResponse.json(
        { error: `Minimum order of Rs. ${coupon.minOrder} required` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrder: coupon.minOrder,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
