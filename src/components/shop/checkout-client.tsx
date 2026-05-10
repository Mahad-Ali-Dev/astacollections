"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Copy,
  Loader2,
  ShoppingBag,
  Upload,
  X,
  User,
  MapPin,
  CreditCard,
  Tag,
  Lock,
  Info,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { toast } from "sonner";
import type { StoreSettings } from "@/lib/settings";

type AppliedCoupon = {
  code: string;
  description?: string | null;
  discountType: string;
  discountValue: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
};

export function CheckoutClient({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingArea: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER">("COD");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const sub = subtotal();
  const codAdvance = Number(settings.codAdvance) || 250;
  const freeThreshold = Number(settings.freeShippingThreshold) || 5000;
  const baseShipping = Number(settings.shippingFee) || 0;

  const discount = appliedCoupon ? calculateDiscount(sub, appliedCoupon) : 0;
  const afterDiscount = sub - discount;
  const shippingFee = afterDiscount >= freeThreshold ? 0 : baseShipping;
  const total = afterDiscount + shippingFee;
  const payNow = paymentMethod === "COD" ? codAdvance : total;
  const balanceOnDelivery = paymentMethod === "COD" ? Math.max(0, total - codAdvance) : 0;

  useEffect(() => {
    if (!proofFile) {
      setProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const updateField =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim(), subtotal: sub }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Invalid coupon");
        return;
      }
      setAppliedCoupon(data.coupon);
      toast.success(`Coupon applied: ${data.coupon.code}`);
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCoupon("");
  };

  const uploadProof = async (file: File) => {
    setProofUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setProofUrl(data.url);
      toast.success("Screenshot uploaded");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
      setProofFile(null);
    } finally {
      setProofUploading(false);
    }
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setProofFile(f);
    uploadProof(f);
  };

  const submit = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (
      !form.customerName ||
      !form.customerEmail ||
      !form.customerPhone ||
      !form.shippingAddress ||
      !form.shippingCity
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!proofUrl) {
      toast.error(
        paymentMethod === "BANK_TRANSFER"
          ? "Please upload the bank transfer screenshot"
          : "Please upload the advance payment screenshot"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod,
          paymentProof: proofUrl,
          couponCode: appliedCoupon?.code,
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to place order");
        return;
      }
      clear();
      router.push(`/order-success/${data.orderNumber}`);
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-serif mb-3">Your bag is empty</h2>
        <p className="text-muted-foreground mb-6">
          Add some pieces to your bag before checking out.
        </p>
        <Link href="/products">
          <Button variant="gold" size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-only quick summary header — links to summary section below */}
      <a
        href="#order-summary"
        className="lg:hidden flex items-center justify-between w-full bg-card border rounded-xl p-4 mb-6 text-sm hover:border-accent transition-colors"
      >
        <span className="flex items-center gap-2 font-medium">
          <ShoppingBag className="h-4 w-4" />
          Order Summary
          <span className="text-muted-foreground">
            ({items.reduce((n, i) => n + i.quantity, 0)} items)
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
          <ChevronDown className="h-4 w-4" />
        </span>
      </a>

      <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12">
        <div className="space-y-6">
          {/* CONTACT */}
          <CheckoutSection number={1} title="Contact Information" icon={User}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={form.customerName}
                  onChange={updateField("customerName")}
                  placeholder="As on your ID"
                  required
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  type="tel"
                  value={form.customerPhone}
                  onChange={updateField("customerPhone")}
                  placeholder="03xx-xxxxxxx"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.customerEmail}
                  onChange={updateField("customerEmail")}
                  placeholder="you@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Order confirmation will be sent here
                </p>
              </div>
            </div>
          </CheckoutSection>

          {/* SHIPPING */}
          <CheckoutSection number={2} title="Shipping Address" icon={MapPin}>
            <div className="space-y-4">
              <div>
                <Label>Street Address *</Label>
                <Textarea
                  value={form.shippingAddress}
                  onChange={updateField("shippingAddress")}
                  placeholder="House #, Street, Block / Sector"
                  rows={3}
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input
                    value={form.shippingCity}
                    onChange={updateField("shippingCity")}
                    placeholder="Karachi, Lahore, Islamabad..."
                    required
                  />
                </div>
                <div>
                  <Label>Area / Postal Code</Label>
                  <Input value={form.shippingArea} onChange={updateField("shippingArea")} />
                </div>
              </div>
              <div>
                <Label>Order Notes (optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={updateField("notes")}
                  placeholder="Gift message, delivery instructions, etc."
                  rows={2}
                />
              </div>
            </div>
          </CheckoutSection>

          {/* PAYMENT */}
          <CheckoutSection number={3} title="Payment Method" icon={CreditCard}>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <PaymentOption
                selected={paymentMethod === "COD"}
                onClick={() => setPaymentMethod("COD")}
                icon={Banknote}
                title="Cash on Delivery"
                subtitle={`Rs. ${codAdvance} advance · balance on delivery`}
                badge="Most Popular"
              />
              <PaymentOption
                selected={paymentMethod === "BANK_TRANSFER"}
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                icon={Building2}
                title="Bank Transfer"
                subtitle="Pay full amount now"
              />
            </div>

            {paymentMethod === "COD" && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-amber-900">
                    <p className="font-semibold">How Cash on Delivery works</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>
                        Pay <strong>{formatPrice(codAdvance)}</strong> advance now via bank transfer
                        (this confirms your order).
                      </li>
                      <li>
                        Balance of <strong>{formatPrice(balanceOnDelivery)}</strong> is collected
                        when the courier delivers.
                      </li>
                      <li>Upload the screenshot of the {formatPrice(codAdvance)} transfer below.</li>
                    </ol>
                  </div>
                </div>
                <BankDetailsBlock settings={settings} amount={codAdvance} />
                <ProofUpload
                  file={proofFile}
                  preview={proofPreview}
                  uploading={proofUploading}
                  url={proofUrl}
                  onChange={handleProofChange}
                  onClear={() => {
                    setProofFile(null);
                    setProofUrl(null);
                  }}
                  label={`Upload screenshot of ${formatPrice(codAdvance)} advance transfer`}
                />
              </div>
            )}

            {paymentMethod === "BANK_TRANSFER" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-blue-900">
                    <p className="font-semibold">How Bank Transfer works</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>
                        Transfer <strong>{formatPrice(total)}</strong> to the account below.
                      </li>
                      <li>
                        Upload the payment screenshot. We&apos;ll verify within a few hours and
                        ship.
                      </li>
                    </ol>
                  </div>
                </div>
                <BankDetailsBlock settings={settings} amount={total} />
                <ProofUpload
                  file={proofFile}
                  preview={proofPreview}
                  uploading={proofUploading}
                  url={proofUrl}
                  onChange={handleProofChange}
                  onClear={() => {
                    setProofFile(null);
                    setProofUrl(null);
                  }}
                  label={`Upload screenshot of ${formatPrice(total)} transfer`}
                />
              </div>
            )}
          </CheckoutSection>
        </div>

        {/* SUMMARY */}
        <aside id="order-summary" className="lg:sticky lg:top-24 h-fit space-y-4 scroll-mt-28">
          <div className="border rounded-xl bg-card overflow-hidden">
            <div className="p-6 space-y-4">
              <h2 className="font-serif text-xl">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {items.map((i) => (
                  <div key={i.id} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-lg bg-muted shrink-0 overflow-hidden border">
                      {i.image && (
                        <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />
                      )}
                      <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                        {i.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{i.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatPrice(i.price)}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums">
                      {formatPrice(i.price * i.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* COUPON */}
              {!appliedCoupon ? (
                <div>
                  <button
                    onClick={() => setCouponOpen(!couponOpen)}
                    className="text-sm flex items-center gap-2 text-accent hover:underline mb-2"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Have a coupon code?
                  </button>
                  {couponOpen && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                      />
                      <Button
                        onClick={applyCoupon}
                        disabled={!coupon || couponLoading}
                        variant="outline"
                      >
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="success" className="font-mono">{appliedCoupon.code}</Badge>
                    <span className="text-xs text-green-800 truncate">
                      {appliedCoupon.description}
                    </span>
                  </div>
                  <button onClick={removeCoupon} aria-label="Remove coupon" className="ml-2 shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <Separator />

              {/* TOTALS */}
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatPrice(sub)} />
                {discount > 0 && (
                  <Row
                    label="Discount"
                    value={`- ${formatPrice(discount)}`}
                    className="text-green-700"
                  />
                )}
                <Row
                  label="Shipping"
                  value={shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                />
              </div>

              <Separator />

              <Row label="Total" value={formatPrice(total)} bold />

              {paymentMethod === "COD" && (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <Row
                      label="Pay now (advance)"
                      value={formatPrice(codAdvance)}
                      className="text-accent font-medium"
                    />
                    <Row
                      label="Pay on delivery"
                      value={formatPrice(balanceOnDelivery)}
                      className="text-muted-foreground"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="bg-muted/40 p-6 border-t space-y-3">
              <Button
                onClick={submit}
                disabled={submitting}
                variant="gold"
                size="xl"
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Placing order...
                  </>
                ) : (
                  `Place Order · ${formatPrice(payNow)}`
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" />
                Your information is secure
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By placing your order you agree to our{" "}
            <Link href="/shipping" className="underline hover:text-foreground">
              shipping policy
            </Link>
            .
          </p>
        </aside>
      </div>
    </>
  );
}

function CheckoutSection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: number;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="border rounded-xl p-6 md:p-7 bg-card">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-accent/10 text-accent w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
          {number}
        </div>
        <h2 className="font-serif text-xl flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function PaymentOption({
  selected,
  onClick,
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative border-2 rounded-xl p-5 text-left transition ${
        selected
          ? "border-accent bg-accent/5 shadow-sm"
          : "border-border hover:border-foreground/30"
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-4 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
      <div className="flex items-start justify-between mb-3">
        <Icon className="h-6 w-6 text-accent" />
        <span
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition ${
            selected ? "border-accent" : "border-border"
          }`}
        >
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
        </span>
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </button>
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
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function BankDetailsBlock({ settings, amount }: { settings: StoreSettings; amount: number }) {
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };
  const Detail = ({
    label,
    value,
    highlight,
  }: {
    label: string;
    value: string;
    highlight?: boolean;
  }) => (
    <div
      className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
        highlight ? "bg-amber-100/80 border border-amber-300" : "bg-background/70 border"
      }`}
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </p>
        <p className={`text-sm truncate ${highlight ? "font-bold tabular-nums" : "font-mono"}`}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => copy(value, label)}
        aria-label={`Copy ${label}`}
        className="shrink-0 ml-2 p-1.5 hover:bg-foreground/5 rounded transition"
      >
        <Copy className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
  return (
    <div className="space-y-2">
      <Detail label="Bank" value={settings.bankName} />
      <Detail label="Account Title" value={settings.bankAccountTitle} />
      <Detail label="Account Number" value={settings.bankAccountNumber} />
      <Detail label="IBAN" value={settings.bankIBAN} />
      <Detail label="Amount to transfer" value={formatPrice(amount)} highlight />
    </div>
  );
}

function ProofUpload({
  file,
  preview,
  uploading,
  url,
  onChange,
  onClear,
  label,
}: {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  url: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  label: string;
}) {
  return (
    <div>
      {!file && (
        <label className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition block bg-background/50">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
      )}
      {file && preview && (
        <div className="relative border-2 border-accent rounded-xl overflow-hidden">
          <img src={preview} alt="Payment proof" className="w-full max-h-64 object-contain bg-muted" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-background/90 backdrop-blur p-1.5 rounded-full hover:bg-background"
            aria-label="Remove screenshot"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-2">
            {uploading ? (
              <Badge variant="warning" className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Uploading...
              </Badge>
            ) : url ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Uploaded
              </Badge>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
