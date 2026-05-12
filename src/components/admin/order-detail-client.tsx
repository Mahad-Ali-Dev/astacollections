"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingArea: string | null;
  notes: string | null;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentProof: string | null;
  advancePaid: number;
  status: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  courierName: string | null;
  couponCode: string | null;
  createdAt: Date;
  items: {
    id: string;
    name: string;
    sku: string;
    image: string | null;
    price: number;
    quantity: number;
    selectedAttributes?: Record<string, string> | null;
  }[];
};

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];

export function OrderDetailClient({ order: initial }: { order: Order }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);

  const update = async (data: Record<string, string | null>, label: string) => {
    setSaving(label);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setOrder({ ...order, ...result.order });
      toast.success("Updated");
    } catch (e: any) {
      toast.error(e.message ?? "Update failed");
    } finally {
      setSaving(null);
    }
  };

  const [tracking, setTracking] = useState({
    trackingNumber: initial.trackingNumber ?? "",
    trackingUrl: initial.trackingUrl ?? "",
    courierName: initial.courierName ?? "",
  });

  const saveTracking = async () => {
    setSaving("tracking");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: tracking.trackingNumber.trim() || null,
          trackingUrl: tracking.trackingUrl.trim() || null,
          courierName: tracking.courierName.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setOrder({ ...order, ...result.order });
      toast.success(
        result.order.trackingNumber
          ? "Tracking saved — customer notified by email"
          : "Tracking saved"
      );
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this order? Stock will be restored. This cannot be undone.")) return;
    setSaving("delete");
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Order deleted");
      router.push("/admin/orders");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-serif">Order {order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={remove} disabled={saving === "delete"}>
          {saving === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items
            </h2>
            <div className="space-y-3">
              {order.items.map((i) => (
                <div key={i.id} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded bg-muted overflow-hidden shrink-0">
                    {i.image && (
                      <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{i.name}</p>
                    {i.selectedAttributes && Object.keys(i.selectedAttributes).length > 0 && (
                      <p className="text-[11px] text-accent mt-0.5">
                        {Object.entries(i.selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {i.sku} · {i.quantity} × {formatPrice(i.price)}
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(i.price * i.quantity)}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discountAmount > 0 && (
                <Row
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={`- ${formatPrice(order.discountAmount)}`}
                />
              )}
              <Row label="Shipping" value={order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)} />
              <Separator />
              <Row label="Total" value={formatPrice(order.total)} bold />
              <Row label="Advance Paid" value={formatPrice(order.advancePaid)} className="text-green-700" />
              {order.paymentMethod === "COD" && (
                <Row
                  label="Balance on Delivery"
                  value={formatPrice(order.total - order.advancePaid)}
                  className="text-amber-700"
                />
              )}
            </div>
          </section>

          {/* Customer & Shipping */}
          <section className="bg-card border rounded-lg p-6 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Customer
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <a href={`tel:${order.customerPhone}`} className="font-medium hover:text-accent flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {order.customerPhone}
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <a href={`mailto:${order.customerEmail}`} className="font-medium hover:text-accent flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {order.customerEmail}
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Shipping Address</p>
                <p className="font-medium">{order.shippingAddress}</p>
                <p className="text-sm">
                  {order.shippingCity}
                  {order.shippingArea && `, ${order.shippingArea}`}
                </p>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Customer Notes</p>
                  <p className="text-sm bg-muted/50 p-2 rounded">{order.notes}</p>
                </div>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="font-medium">
                  {order.paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Advance Paid</p>
                <p className="font-medium text-green-700">{formatPrice(order.advancePaid)}</p>
              </div>
            </div>

            {order.paymentProof && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                <button
                  type="button"
                  onClick={() => setProofOpen(true)}
                  className="border rounded-lg overflow-hidden hover:opacity-90 block max-w-xs"
                >
                  <img src={order.paymentProof} alt="Payment proof" className="w-full" />
                </button>
                <a
                  href={order.paymentProof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent inline-flex items-center gap-1 mt-2 hover:underline"
                >
                  Open full size <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {proofOpen && order.paymentProof && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
                onClick={() => setProofOpen(false)}
              >
                <img
                  src={order.paymentProof}
                  alt="Payment proof"
                  className="max-w-full max-h-full"
                />
              </div>
            )}
          </section>
        </div>

        {/* Actions panel */}
        <aside className="space-y-4">
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Status</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Order Status</label>
              <Select
                value={order.status}
                onValueChange={(v) => update({ status: v }, "status")}
                disabled={saving === "status"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Payment Status</label>
              <Select
                value={order.paymentStatus}
                onValueChange={(v) => update({ paymentStatus: v }, "paymentStatus")}
                disabled={saving === "paymentStatus"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* TRACKING EDITOR */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Shipping & Tracking</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer is notified by email when tracking is added.
              </p>
            </div>
            <div>
              <Label>Courier Name</Label>
              <Input
                value={tracking.courierName}
                onChange={(e) => setTracking({ ...tracking, courierName: e.target.value })}
                placeholder="e.g. TCS, Leopards Courier, M&P"
              />
            </div>
            <div>
              <Label>Tracking Number</Label>
              <Input
                value={tracking.trackingNumber}
                onChange={(e) => setTracking({ ...tracking, trackingNumber: e.target.value })}
                placeholder="e.g. TCS123456789"
                className="font-mono"
              />
            </div>
            <div>
              <Label>Tracking URL (optional)</Label>
              <Input
                value={tracking.trackingUrl}
                onChange={(e) => setTracking({ ...tracking, trackingUrl: e.target.value })}
                placeholder="https://courier.com/track/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link to the courier&apos;s tracking page. Customer can view from their order page.
              </p>
            </div>
            <Button
              onClick={saveTracking}
              disabled={saving === "tracking"}
              variant="gold"
              className="w-full"
            >
              {saving === "tracking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Tracking"}
            </Button>
            {order.trackingNumber && (
              <p className="text-xs text-green-700 flex items-center gap-1.5 pt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                Customer was notified · Last updated when tracking was added
              </p>
            )}
          </section>

          <section className="bg-card border rounded-lg p-6 space-y-3 text-sm">
            <h2 className="font-semibold">Quick Actions</h2>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => update({ paymentStatus: "PAID" }, "paymentStatus")}
              disabled={order.paymentStatus === "PAID"}
            >
              Mark payment as PAID
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => update({ status: "CONFIRMED" }, "status")}
              disabled={order.status !== "PENDING"}
            >
              Confirm order
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => update({ status: "SHIPPED" }, "status")}
              disabled={!["CONFIRMED", "PROCESSING"].includes(order.status)}
            >
              Mark as shipped
            </Button>
          </section>
        </aside>
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
