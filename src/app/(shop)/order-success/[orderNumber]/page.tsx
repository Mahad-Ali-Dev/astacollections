import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Package, Phone, Mail, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { PurchaseTracker } from "@/components/analytics/purchase-tracker";

export const metadata = { title: "Order Confirmed" };

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="container py-12 max-w-3xl">
      {/* Meta Pixel Purchase event — the conversion your ad campaign optimizes for */}
      <PurchaseTracker
        orderNumber={order.orderNumber}
        value={order.total}
        currency="PKR"
        contentIds={order.items.map((i) => i.productId)}
        contents={order.items.map((i) => ({
          id: i.productId,
          quantity: i.quantity,
          item_price: i.price,
        }))}
        numItems={order.items.reduce((n, i) => n + i.quantity, 0)}
      />
      <div className="text-center mb-8">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl md:text-4xl font-serif">Thank you for your order!</h1>
        <p className="text-muted-foreground mt-2">
          A confirmation has been sent to <strong>{order.customerEmail}</strong>.
        </p>
        <p className="text-sm mt-4">
          Order #{" "}
          <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">
            {order.orderNumber}
          </span>
        </p>
      </div>

      <div className="border rounded-lg bg-card p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Placed on</p>
            <p className="font-medium">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="warning">{order.status}</Badge>
            <Badge variant={order.paymentStatus === "PAID" ? "success" : "outline"}>
              Payment: {order.paymentStatus}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Items */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Items
          </h3>
          {order.items.map((i) => (
            <div key={i.id} className="flex gap-3 items-center">
              <div className="relative w-14 h-14 rounded bg-muted overflow-hidden">
                {i.image && <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{i.name}</p>
                {i.selectedAttributes && typeof i.selectedAttributes === "object" && Object.keys(i.selectedAttributes as Record<string, string>).length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {Object.entries(i.selectedAttributes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {i.quantity} × {formatPrice(i.price)}
                </p>
              </div>
              <p className="font-medium">{formatPrice(i.price * i.quantity)}</p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discountAmount > 0 && (
            <Row
              label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
              value={`- ${formatPrice(order.discountAmount)}`}
              className="text-green-700"
            />
          )}
          <Row label="Shipping" value={order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)} />
          <Separator />
          <Row label="Total" value={formatPrice(order.total)} bold />
          {order.paymentMethod === "COD" && (
            <>
              <Separator />
              <Row label="Advance Paid" value={formatPrice(order.advancePaid)} className="text-green-700" />
              <Row
                label="Balance on Delivery"
                value={formatPrice(order.total - order.advancePaid)}
                className="text-amber-700"
              />
            </>
          )}
        </div>

        <Separator />

        {/* Shipping */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2 text-sm flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Shipping to
            </h3>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>{order.customerName}</p>
              <p>{order.shippingAddress}</p>
              <p>
                {order.shippingCity}
                {order.shippingArea && `, ${order.shippingArea}`}
              </p>
              <p className="flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" /> {order.customerPhone}
              </p>
              <p className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {order.customerEmail}
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-sm">Payment Method</h3>
            <p className="text-sm text-muted-foreground">
              {order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {order.paymentMethod === "COD"
                ? "We have received your advance. Pay the balance to the courier on delivery."
                : "Your transfer screenshot has been received and is being verified."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link href="/track-order">
          <Button variant="gold">Track My Order</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>

      <div className="mt-10 bg-secondary/50 border border-border rounded-2xl p-6 text-center max-w-xl mx-auto">
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a confirmation email to <strong className="text-foreground">{order.customerEmail}</strong> with your order details.
          When your order ships you&apos;ll receive a second email with the tracking number — or you can check status anytime at <Link href="/track-order" className="text-accent hover:underline">/track-order</Link>.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  className,
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base" : ""} ${className ?? ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
