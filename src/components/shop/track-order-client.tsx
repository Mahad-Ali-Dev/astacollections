"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Loader2,
  Search,
  CheckCircle2,
  Circle,
  Package,
  Truck,
  MapPin,
  ExternalLink,
  Copy,
  Mail,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type OrderTrackData = {
  id: string;
  orderNumber: string;
  customerName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingArea: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  courierName: string | null;
  shippedAt: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  advancePaid: number;
  couponCode: string | null;
  createdAt: string;
  items: { name: string; sku: string; image: string | null; price: number; quantity: number }[];
};

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderTrackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not find order");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Lookup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyTracking = async () => {
    if (!order?.trackingNumber) return;
    await navigator.clipboard.writeText(order.trackingNumber);
    toast.success("Tracking number copied");
  };

  return (
    <>
      <form
        onSubmit={submit}
        className="bg-white border border-border rounded-3xl p-6 md:p-8 card-soft space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
              Order Number
            </span>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              placeholder="ASTA-XXXXXXXX-XXXX"
              className="w-full h-12 px-4 rounded-full border border-border bg-white text-sm font-mono uppercase focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Looking up...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Track Order
            </>
          )}
        </button>
        <p className="text-[11px] text-center text-muted-foreground/80">
          Order number was sent to your email when you placed the order.
        </p>
      </form>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="font-medium">⚠</span>
          <p>{error}</p>
        </div>
      )}

      {order && (
        <div className="mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Header card */}
          <section className="bg-gradient-to-br from-secondary via-rose-50 to-white border border-border rounded-3xl p-7 md:p-9 card-soft">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="eyebrow-accent">Order</p>
                <p className="font-mono font-bold text-lg md:text-2xl mt-1">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed {formatDateTime(new Date(order.createdAt))}
                </p>
              </div>
              <Badge
                variant={
                  order.status === "DELIVERED"
                    ? "success"
                    : order.status === "CANCELLED"
                      ? "danger"
                      : order.status === "SHIPPED"
                        ? "default"
                        : "warning"
                }
                className="text-xs px-3 py-1.5"
              >
                {order.status}
              </Badge>
            </div>

            {/* Status timeline */}
            <div className="mt-8">
              <StatusTimeline current={order.status} />
            </div>
          </section>

          {/* Tracking card */}
          {order.trackingNumber || order.courierName ? (
            <section className="bg-white border-2 border-accent/40 rounded-3xl p-7 md:p-9">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-accent/10 w-11 h-11 rounded-full flex items-center justify-center">
                  <Truck className="h-5 w-5 text-accent" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="eyebrow-accent">Shipping</p>
                  <h3 className="font-serif text-xl">Your order is on its way</h3>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {order.courierName && (
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="eyebrow mb-1">Courier</p>
                    <p className="font-medium">{order.courierName}</p>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="eyebrow mb-1">Tracking number</p>
                    <button
                      onClick={copyTracking}
                      className="font-mono font-medium flex items-center gap-2 hover:text-accent transition-colors"
                    >
                      {order.trackingNumber}
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="bg-secondary/50 rounded-xl p-4 sm:col-span-2">
                    <p className="eyebrow mb-1">Shipped on</p>
                    <p className="font-medium text-sm">
                      {formatDateTime(new Date(order.shippedAt))}
                    </p>
                  </div>
                )}
              </div>

              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 bg-foreground text-background px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow"
                >
                  Track on courier site
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </section>
          ) : (
            <section className="bg-white border border-border rounded-3xl p-7 md:p-9 text-center">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.4} />
              <h3 className="font-serif text-xl mb-2">Tracking not available yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Tracking details will be added once your order ships. We&apos;ll email you the
                moment it&apos;s on its way.
              </p>
            </section>
          )}

          {/* Items + summary */}
          <section className="bg-white border border-border rounded-3xl p-7 md:p-9">
            <h3 className="font-serif text-xl mb-5">Order items</h3>
            <div className="divide-y divide-border/60">
              {order.items.map((i) => (
                <div key={i.sku} className="flex gap-4 py-4">
                  <div className="relative w-16 h-16 rounded-xl bg-secondary shrink-0 overflow-hidden">
                    {i.image && (
                      <Image src={i.image} alt={i.name} fill sizes="64px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-2">{i.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {i.quantity} × {formatPrice(i.price)}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums shrink-0">
                    {formatPrice(i.price * i.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-border space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="tabular-nums">- {formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
              {order.paymentMethod === "COD" && (
                <>
                  <div className="flex justify-between text-green-700">
                    <span>Advance paid</span>
                    <span className="tabular-nums">{formatPrice(order.advancePaid)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Balance on delivery</span>
                    <span className="tabular-nums">
                      {formatPrice(order.total - order.advancePaid)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Shipping address + contact */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-2xl p-5">
              <p className="eyebrow-accent mb-2 flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Shipping to
              </p>
              <p className="font-medium text-sm">{order.customerName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {order.shippingAddress}, {order.shippingCity}
                {order.shippingArea && `, ${order.shippingArea}`}
              </p>
            </div>
            <div className="bg-white border border-border rounded-2xl p-5">
              <p className="eyebrow-accent mb-2 flex items-center gap-2">
                <Mail className="h-3 w-3" />
                Need help?
              </p>
              <a
                href="mailto:contact@astacollections.com"
                className="text-sm text-foreground hover:text-accent inline-flex items-center gap-1.5 transition-colors"
              >
                contact@astacollections.com <ArrowRight className="h-3 w-3" />
              </a>
              <a
                href="https://wa.me/923264348024"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground hover:text-accent block mt-1 inline-flex items-center gap-1.5 transition-colors"
              >
                WhatsApp +92 326 4348024
              </a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function StatusTimeline({ current }: { current: string }) {
  const currentIdx = STATUS_FLOW.indexOf(current);
  const isCancelled = current === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-center font-medium">
        This order has been cancelled
      </div>
    );
  }

  const steps = [
    { key: "PENDING", label: "Placed", icon: Circle },
    { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
    { key: "PROCESSING", label: "Processing", icon: Package },
    { key: "SHIPPED", label: "Shipped", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: MapPin },
  ];

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-1 sm:gap-2 relative">
        {/* Background line */}
        <div className="absolute top-[18px] sm:top-5 left-[10%] right-[10%] h-0.5 bg-border" />
        {/* Progress line */}
        <div
          className="absolute top-[18px] sm:top-5 left-[10%] h-0.5 bg-accent transition-all duration-700 ease-out"
          style={{
            width: `${currentIdx >= 0 ? (currentIdx / (steps.length - 1)) * 80 : 0}%`,
          }}
        />

        {steps.map((s, i) => {
          const reached = currentIdx >= i;
          const isCurrent = currentIdx === i;
          const StepIcon = s.icon;
          return (
            <div key={s.key} className="relative flex flex-col items-center text-center min-w-0">
              <div
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                  reached
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30"
                    : "bg-secondary text-muted-foreground"
                } ${isCurrent ? "scale-110 ring-4 ring-accent/20" : ""}`}
              >
                <StepIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
                )}
              </div>
              <p
                className={`mt-2 text-[9px] sm:text-[10px] uppercase tracking-[0.16em] sm:tracking-[0.2em] font-medium leading-tight ${
                  reached ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
