import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validators";
import { calculateDiscount, generateOrderNumber } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { checkoutFields, computeCheckoutTotals, resolvePaymentConfig } from "@/lib/payment";
import { getAdminFromRequest, getCustomerFromRequest } from "@/lib/auth";
import { sendOrderConfirmation } from "@/lib/email";
import { NextRequest } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Fetch settings first — they are the source of truth for which payment
    // methods are live and how much (if any) advance a COD order collects.
    const settings = await getSettings();
    const payCfg = resolvePaymentConfig(settings);
    const fields = checkoutFields(settings);

    // Reject a method the admin has switched off — never trust the client.
    if (!payCfg.enabled.includes(data.paymentMethod)) {
      return NextResponse.json(
        { error: "That payment method isn't available. Please refresh and try again." },
        { status: 400 }
      );
    }

    // Field rules come from the checkout designer. Hidden fields are dropped
    // even if a stale page still sends them.
    const customerEmail =
      fields.email === "hidden" ? "" : (data.customerEmail ?? "").trim().toLowerCase();
    const shippingArea = fields.area === "hidden" ? null : data.shippingArea?.trim() || null;
    const notes = fields.notes === "hidden" ? null : data.notes?.trim() || null;
    if (fields.email === "required" && !customerEmail) {
      return NextResponse.json({ error: "Please enter your email" }, { status: 400 });
    }
    if (fields.area === "required" && !shippingArea) {
      return NextResponse.json({ error: "Please enter your area / postal code" }, { status: 400 });
    }
    if (fields.notes === "required" && !notes) {
      return NextResponse.json({ error: "Please add your order notes" }, { status: 400 });
    }

    // Fetch products with attributes — server-side source of truth for price
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        attributes: { include: { options: true } },
      },
    });

    if (products.length < new Set(productIds).size) {
      return NextResponse.json(
        { error: "Some items are no longer available" },
        { status: 400 }
      );
    }

    // Build order items + check stock + recompute variant prices server-side.
    // We also collect (optionId, qty) pairs so we can decrement per-variant stock
    // inside the transaction below.
    let subtotal = 0;
    const variantStockDecrements: { optionId: string; quantity: number }[] = [];
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        throw new Error(`${product.name} has only ${product.stock} in stock`);
      }
      // Validate required attribute selections + compute price modifier + check variant stock.
      const selection = item.selectedAttributes ?? {};
      let priceMod = 0;
      for (const attr of product.attributes) {
        const chosen = selection[attr.name];
        if (attr.required && !chosen) {
          throw new Error(`${product.name}: please select ${attr.name}`);
        }
        if (chosen) {
          const opt = attr.options.find((o) => o.value === chosen);
          if (!opt) throw new Error(`${product.name}: invalid ${attr.name}`);
          if (opt.priceModifier) priceMod += opt.priceModifier;
          // Variant stock: if set, must cover the requested quantity.
          if (typeof opt.stock === "number") {
            if (opt.stock < item.quantity) {
              throw new Error(
                `${product.name} (${attr.name}: ${chosen}) has only ${opt.stock} left`
              );
            }
            variantStockDecrements.push({ optionId: opt.id, quantity: item.quantity });
          }
        }
      }
      const unitPrice = product.price + priceMod;
      subtotal += unitPrice * item.quantity;
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        image: product.images[0]?.url ?? null,
        price: unitPrice,
        quantity: item.quantity,
        selectedAttributes:
          Object.keys(selection).length > 0 ? (selection as any) : null,
      };
    });

    // Apply coupon
    let coupon = null;
    let discountAmount = 0;
    let couponCode: string | null = null;
    if (data.couponCode && fields.coupon) {
      coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive) {
        const now = new Date();
        const valid =
          (!coupon.startsAt || now >= coupon.startsAt) &&
          (!coupon.expiresAt || now <= coupon.expiresAt) &&
          (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) &&
          (!coupon.minOrder || subtotal >= coupon.minOrder);
        if (valid) {
          discountAmount = calculateDiscount(subtotal, coupon);
          couponCode = coupon.code;
        } else {
          coupon = null;
        }
      } else {
        coupon = null;
      }
    }

    // Same calculation the checkout page showed — shipping, the payment
    // method's fee/discount, and how much is due now vs. on delivery.
    const totals = computeCheckoutTotals(settings, {
      subtotal,
      discount: discountAmount,
      method: data.paymentMethod,
    });

    // Screenshot rules: anything collected before dispatch (a bank transfer,
    // or a COD advance) needs proof. Pure COD collects nothing up front.
    if (totals.needsProof && !data.paymentProof) {
      return NextResponse.json(
        {
          error:
            data.paymentMethod === "COD"
              ? "Advance payment screenshot is required for COD"
              : "Payment screenshot is required",
        },
        { status: 400 }
      );
    }

    const orderNumber = generateOrderNumber();

    // Capture logged-in customer if any (links order back to customer)
    const loggedInCustomer = await getCustomerFromRequest(req as any);

    // Transaction: create order + decrement stock + bump coupon usage +
    // record OrderEvent, InventoryLog, CouponRedemption
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingArea,
          notes,
          subtotal,
          discountAmount: totals.discount,
          shippingFee: totals.shipping,
          paymentAdjustment: totals.adjustment,
          paymentAdjustmentLabel: totals.adjustmentLabel || null,
          total: totals.total,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          paymentProof: totals.needsProof ? data.paymentProof : null,
          advancePaid: totals.payNow,
          status: "PENDING",
          couponId: coupon?.id ?? null,
          couponCode,
          customerId: loggedInCustomer?.id ?? null,
          items: { create: orderItems },
        },
      });

      // Initial OrderEvent
      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          status: "PENDING",
          actorType: "CUSTOMER",
          note: `Order placed via ${data.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}`,
        },
      });

      // Decrement stock + log inventory movement per line item
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            change: -item.quantity,
            reason: "ORDER_PLACED",
            orderId: created.id,
          },
        });
      }

      // Decrement per-variant stock for selected options that have it set.
      // (Options without a stock value defer to product.stock, already decremented above.)
      for (const v of variantStockDecrements) {
        await tx.productAttributeOption.update({
          where: { id: v.optionId },
          data: { stock: { decrement: v.quantity } },
        });
      }

      // Coupon usage + per-customer redemption ledger
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            orderId: created.id,
            customerId: loggedInCustomer?.id ?? null,
            customerEmail,
            amountSaved: totals.discount,
          },
        });
      }

      return created;
    });

    // Fire-and-forget order confirmation email (don't block on this). No
    // address, no email — the store reaches these customers by phone.
    if (order.customerEmail) sendOrderConfirmation({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingArea: order.shippingArea,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      paymentAdjustment: order.paymentAdjustment,
      paymentAdjustmentLabel: order.paymentAdjustmentLabel,
      total: order.total,
      advancePaid: order.advancePaid,
      couponCode: order.couponCode,
      createdAt: order.createdAt,
      items: orderItems.map((i) => ({
        name: i.name,
        sku: i.sku,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        selectedAttributes: i.selectedAttributes as Record<string, string> | null,
      })),
    }).catch((err) => console.error("[orders] email send failed:", err));

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (e: any) {
    console.error("order error", e);
    return NextResponse.json(
      { error: e.message ?? "Failed to place order" },
      { status: 500 }
    );
  }
}

// Admin GET: list orders
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status ? { status: status as any } : {};

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ orders });
}
