import { Resend } from "resend";
import { formatPrice, formatDateTime } from "./utils";
import { prisma } from "./prisma";

const FROM = process.env.RESEND_FROM ?? "Asta Collections <orders@astacollections.com>";
const KEY = process.env.RESEND_API_KEY;

const resend = KEY ? new Resend(KEY) : null;

/** Record an email send attempt to the EmailLog table. */
async function logEmail(args: {
  to: string;
  subject: string;
  kind: "ORDER_CONFIRMATION" | "SHIPPING_UPDATE" | "PASSWORD_RESET" | "NEWSLETTER" | "REVIEW_REMINDER" | "OTHER";
  status: "QUEUED" | "SENT" | "FAILED" | "BOUNCED";
  resendId?: string | null;
  errorMessage?: string | null;
  orderId?: string | null;
  customerId?: string | null;
}) {
  try {
    await prisma.emailLog.create({ data: args as any });
  } catch (e) {
    console.error("[email] failed to log email:", e);
  }
}

type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingArea?: string | null;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  advancePaid: number;
  couponCode?: string | null;
  createdAt: Date;
  items: { name: string; sku: string; price: number; quantity: number; image?: string | null }[];
};

type ShippingEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  courierName?: string | null;
};

export async function sendShippingUpdate(
  data: ShippingEmailData & { orderId?: string }
): Promise<{ ok: boolean; reason?: string }> {
  const subject = `Your order ${data.orderNumber} has shipped!`;
  if (!resend) {
    console.log("[email] Skipping shipping update — no RESEND_API_KEY configured");
    await logEmail({
      to: data.customerEmail, subject, kind: "SHIPPING_UPDATE",
      status: "FAILED", errorMessage: "Resend not configured", orderId: data.orderId ?? null,
    });
    return { ok: false, reason: "Resend not configured" };
  }
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM,
      to: data.customerEmail,
      subject,
      html: shippingUpdateHtml(data),
    });
    if (error) {
      console.error("[email] Resend shipping error:", error);
      const msg = typeof error === "string" ? error : (error as any).message;
      await logEmail({
        to: data.customerEmail, subject, kind: "SHIPPING_UPDATE",
        status: "FAILED", errorMessage: msg, orderId: data.orderId ?? null,
      });
      return { ok: false, reason: msg };
    }
    console.log("[email] sent shipping update:", result?.id);
    await logEmail({
      to: data.customerEmail, subject, kind: "SHIPPING_UPDATE",
      status: "SENT", resendId: result?.id, orderId: data.orderId ?? null,
    });
    return { ok: true };
  } catch (e: any) {
    console.error("[email] sendShippingUpdate failed:", e);
    await logEmail({
      to: data.customerEmail, subject, kind: "SHIPPING_UPDATE",
      status: "FAILED", errorMessage: e?.message ?? "send failed", orderId: data.orderId ?? null,
    });
    return { ok: false, reason: e?.message ?? "send failed" };
  }
}

function shippingUpdateHtml(d: ShippingEmailData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Order ${d.orderNumber} shipped</title>
</head>
<body style="margin:0;padding:0;background:#fbf6f4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf6f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(40,20,15,0.06);">
          <tr>
            <td style="padding:32px 40px;text-align:center;background:linear-gradient(135deg,#fbf6f4 0%,#ffffff 100%);border-bottom:1px solid #ece6e0;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;letter-spacing:6px;font-weight:500;text-transform:uppercase;">
                Asta <span style="font-style:italic;font-weight:300;">Collections</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 24px;text-align:center;">
              <div style="width:64px;height:64px;border-radius:50%;background:#fbf6f4;display:inline-block;line-height:64px;font-size:30px;margin-bottom:18px;">📦</div>
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#c08775;font-weight:600;">On its way</p>
              <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;font-weight:500;line-height:1.1;">Your order has shipped!</h2>
              <p style="margin:0;font-size:15px;color:#7b6f66;line-height:1.6;">
                Great news, ${d.customerName.split(" ")[0]} — your order is on its way.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf6f4;border-radius:12px;padding:20px;">
                <tr>
                  <td style="padding:14px;">
                    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7b6f66;">Order #</p>
                    <p style="margin:0;font-family:monospace;font-size:14px;font-weight:600;">${d.orderNumber}</p>
                  </td>
                  ${
                    d.courierName
                      ? `<td style="padding:14px;text-align:right;">
                          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7b6f66;">Courier</p>
                          <p style="margin:0;font-size:14px;font-weight:600;">${d.courierName}</p>
                        </td>`
                      : ""
                  }
                </tr>
                ${
                  d.trackingNumber
                    ? `<tr><td colspan="2" style="padding:14px;border-top:1px solid #ece6e0;">
                        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7b6f66;">Tracking number</p>
                        <p style="margin:0;font-family:monospace;font-size:16px;font-weight:600;">${d.trackingNumber}</p>
                      </td></tr>`
                    : ""
                }
              </table>
            </td>
          </tr>
          ${
            d.trackingUrl
              ? `<tr>
                  <td style="padding:0 40px 32px;text-align:center;">
                    <a href="${d.trackingUrl}" style="display:inline-block;padding:14px 32px;background:#1a1a1a;color:#fff;border-radius:9999px;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:600;text-decoration:none;">
                      Track Your Package
                    </a>
                  </td>
                </tr>`
              : ""
          }
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#7b6f66;line-height:1.6;">
                Or track your order anytime at<br/>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://astacollections.com"}/track-order" style="color:#c08775;font-weight:500;">astacollections.com/track-order</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;background:#1a1a1a;color:#fbf6f4;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;">Questions? Reach us at</p>
              <p style="margin:0;font-size:13px;font-weight:500;">contact@astacollections.com · WhatsApp +92 326 4348024</p>
              <p style="margin:18px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#c08775;">Crafted with care · Made in Pakistan</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendOrderConfirmation(
  order: OrderEmailData & { orderId?: string }
): Promise<{ ok: boolean; reason?: string }> {
  const subject = `Order ${order.orderNumber} — confirmed at Asta Collections`;
  if (!resend) {
    console.log("[email] Skipping order confirmation — no RESEND_API_KEY configured");
    await logEmail({
      to: order.customerEmail, subject, kind: "ORDER_CONFIRMATION",
      status: "FAILED", errorMessage: "Resend not configured", orderId: order.orderId ?? null,
    });
    return { ok: false, reason: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject,
      html: orderConfirmationHtml(order),
    });
    if (error) {
      console.error("[email] Resend error:", error);
      const msg = typeof error === "string" ? error : (error as any).message;
      await logEmail({
        to: order.customerEmail, subject, kind: "ORDER_CONFIRMATION",
        status: "FAILED", errorMessage: msg, orderId: order.orderId ?? null,
      });
      return { ok: false, reason: msg };
    }
    console.log("[email] sent confirmation:", data?.id);
    await logEmail({
      to: order.customerEmail, subject, kind: "ORDER_CONFIRMATION",
      status: "SENT", resendId: data?.id, orderId: order.orderId ?? null,
    });
    return { ok: true };
  } catch (e: any) {
    console.error("[email] sendOrderConfirmation failed:", e);
    await logEmail({
      to: order.customerEmail, subject, kind: "ORDER_CONFIRMATION",
      status: "FAILED", errorMessage: e?.message ?? "send failed", orderId: order.orderId ?? null,
    });
    return { ok: false, reason: e?.message ?? "send failed" };
  }
}

function orderConfirmationHtml(o: OrderEmailData) {
  const balanceOnDelivery = Math.max(0, o.total - o.advancePaid);
  const itemsRows = o.items
    .map(
      (i) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #ece6e0;">
            <div style="display:flex;gap:14px;align-items:flex-start;">
              ${
                i.image
                  ? `<img src="${i.image}" alt="" width="56" height="56" style="border-radius:8px;object-fit:cover;background:#f3e6e0;" />`
                  : ""
              }
              <div>
                <p style="margin:0;font-size:14px;font-weight:500;color:#1a1a1a;">${i.name}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#7b6f66;">${i.quantity} × ${formatPrice(i.price)}</p>
              </div>
            </div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #ece6e0;text-align:right;font-size:14px;font-weight:600;color:#1a1a1a;white-space:nowrap;">
            ${formatPrice(i.price * i.quantity)}
          </td>
        </tr>
      `
    )
    .join("");

  const totalRow = (label: string, value: string, opts: { bold?: boolean; color?: string } = {}) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:${opts.color ?? "#7b6f66"};${opts.bold ? "font-weight:600;color:#1a1a1a;" : ""}">${label}</td>
      <td style="padding:6px 0;font-size:14px;text-align:right;${opts.bold ? "font-weight:600;color:#1a1a1a;" : "color:#1a1a1a;"}">${value}</td>
    </tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order ${o.orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#fbf6f4;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf6f4;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(40,20,15,0.06);">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px;text-align:center;background:linear-gradient(135deg,#fbf6f4 0%,#ffffff 100%);border-bottom:1px solid #ece6e0;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;letter-spacing:6px;font-weight:500;text-transform:uppercase;">
                Asta <span style="font-style:italic;font-weight:300;">Collections</span>
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:40px 40px 20px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#c08775;font-weight:600;">Order confirmed</p>
              <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:36px;font-weight:500;line-height:1.1;">Thank you, ${o.customerName.split(" ")[0]}!</h2>
              <p style="margin:0;font-size:15px;color:#7b6f66;line-height:1.6;">
                Your order is in the works. We'll send tracking once it ships.
              </p>
            </td>
          </tr>

          <!-- Order details -->
          <tr>
            <td style="padding:0 40px 20px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf6f4;border-radius:12px;padding:16px;">
                <tr>
                  <td style="padding:14px;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7b6f66;">Order #</p>
                    <p style="margin:4px 0 0;font-family:monospace;font-size:14px;font-weight:600;">${o.orderNumber}</p>
                  </td>
                  <td style="padding:14px;text-align:right;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#7b6f66;">Placed on</p>
                    <p style="margin:4px 0 0;font-size:14px;font-weight:600;">${formatDateTime(o.createdAt)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:20px 40px 0;">
              <p style="margin:0 0 12px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#c08775;font-weight:600;">Items</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${totalRow("Subtotal", formatPrice(o.subtotal))}
                ${o.discountAmount > 0 ? totalRow(`Discount${o.couponCode ? ` (${o.couponCode})` : ""}`, `- ${formatPrice(o.discountAmount)}`, { color: "#15803d" }) : ""}
                ${totalRow("Shipping", o.shippingFee === 0 ? "Free" : formatPrice(o.shippingFee))}
                <tr><td colspan="2" style="padding:8px 0;border-top:1px solid #ece6e0;"></td></tr>
                ${totalRow("Total", formatPrice(o.total), { bold: true })}
                ${
                  o.paymentMethod === "COD"
                    ? `
                      <tr><td colspan="2" style="padding:6px 0;"></td></tr>
                      ${totalRow("Advance paid", formatPrice(o.advancePaid), { color: "#15803d" })}
                      ${totalRow("Balance on delivery", formatPrice(balanceOnDelivery), { color: "#b45309" })}
                    `
                    : ""
                }
              </table>
            </td>
          </tr>

          <!-- Shipping -->
          <tr>
            <td style="padding:20px 40px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#c08775;font-weight:600;">Shipping to</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#1a1a1a;">
                <strong>${o.customerName}</strong><br/>
                ${o.shippingAddress}<br/>
                ${o.shippingCity}${o.shippingArea ? `, ${o.shippingArea}` : ""}<br/>
                ${o.customerPhone}
              </p>
            </td>
          </tr>

          <!-- Payment summary -->
          <tr>
            <td style="padding:20px 40px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#c08775;font-weight:600;">Payment</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;">
                ${o.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#7b6f66;line-height:1.6;">
                ${
                  o.paymentMethod === "COD"
                    ? "We've received your advance. Please pay the balance to the courier on delivery."
                    : "Your transfer screenshot has been received and is being verified."
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;background:#1a1a1a;color:#fbf6f4;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.6;">Need help? Reply to this email or reach us at</p>
              <p style="margin:0;font-size:13px;font-weight:500;">contact@astacollections.com · WhatsApp +92 326 4348024</p>
              <p style="margin:18px 0 0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#c08775;">Crafted with care · Made in Pakistan</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
