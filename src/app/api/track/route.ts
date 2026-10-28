import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// `email` holds whichever contact the shopper gave — email or phone. Email is
// optional at checkout, so phone has to work too or those orders are untrackable.
const schema = z.object({
  orderNumber: z.string().min(3),
  email: z.string().trim().min(3),
});

/** Last 10 digits, so "+92 300…", "0300…" and "300…" all compare equal. */
const phoneKey = (s: string) => s.replace(/\D/g, "").slice(-10);

function contactMatches(order: { customerEmail: string; customerPhone: string }, contact: string) {
  if (contact.includes("@")) {
    return !!order.customerEmail && order.customerEmail.toLowerCase() === contact.toLowerCase();
  }
  const key = phoneKey(contact);
  return key.length === 10 && phoneKey(order.customerPhone) === key;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { orderNumber, email } = parsed.data;
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
      include: { items: true },
    });

    // Same response whether the number or the contact is wrong, so the form
    // can't be used to discover which order numbers exist.
    if (!order || !contactMatches(order, email)) {
      return NextResponse.json(
        { error: "We couldn't find an order with those details. Check the order number and email or phone." },
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
        paymentAdjustment: order.paymentAdjustment,
        paymentAdjustmentLabel: order.paymentAdjustmentLabel,
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
