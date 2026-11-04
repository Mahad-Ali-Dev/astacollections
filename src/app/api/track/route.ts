import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { orderContactMatches } from "@/lib/order-contact";

const schema = z.object({
  orderNumber: z.string().min(3),
  contact: z.string().trim().min(3), // the email or phone used at checkout
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { orderNumber, contact } = parsed.data;
    const order = await prisma.order.findFirst({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
      include: { items: true },
    });

    if (!order || !orderContactMatches(order, contact)) {
      return NextResponse.json(
        { error: "We couldn't find an order with those details. Check the order number and the email or phone." },
        { status: 404 }
      );
    }

    // Public-safe order shape — strip email-related sensitive fields
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingArea: order.shippingArea,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        courierName: order.courierName,
        shippedAt: order.shippedAt,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingFee: order.shippingFee,
        total: order.total,
        advancePaid: order.advancePaid,
        couponCode: order.couponCode,
        createdAt: order.createdAt,
        items: order.items.map((i) => ({
          name: i.name,
          sku: i.sku,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
          selectedAttributes: i.selectedAttributes as Record<string, string> | null,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
