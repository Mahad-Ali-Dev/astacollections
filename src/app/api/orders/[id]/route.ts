import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { sendShippingUpdate } from "@/lib/email";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, coupon: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();
  const allowed = ["status", "paymentStatus", "trackingNumber", "trackingUrl", "courierName"];
  const data: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key] === "" ? null : body[key];
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  // Detect "shipped" transition: tracking added or status set to SHIPPED
  const before = await prisma.order.findUnique({ where: { id } });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const justShipped =
    (data.status === "SHIPPED" && before.status !== "SHIPPED") ||
    (data.trackingNumber && !before.trackingNumber);

  if (justShipped) {
    data.shippedAt = data.shippedAt ?? new Date();
    if (!data.status && before.status !== "SHIPPED") data.status = "SHIPPED";
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
    include: { items: true },
  });

  // Send tracking email if just shipped (don't block the API on it)
  if (justShipped) {
    sendShippingUpdate({
      orderNumber: updated.orderNumber,
      customerName: updated.customerName,
      customerEmail: updated.customerEmail,
      trackingNumber: updated.trackingNumber,
      trackingUrl: updated.trackingUrl,
      courierName: updated.courierName,
    }).catch((err) => console.error("[orders] shipping email failed:", err));
  }

  return NextResponse.json({ order: updated });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    if (order.couponId) {
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { usageCount: { decrement: 1 } },
      });
    }
    await tx.order.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
