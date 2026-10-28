"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Banknote,
  Building2,
  Info,
  AlertTriangle,
  Eye,
  Lock,
  Tag,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StoreSettings } from "@/lib/settings";
import {
  checkoutFields,
  computeCheckoutTotals,
  describePricing,
  methodPricing,
  methodSubtitle,
  parseCodAdvance,
  resolvePaymentConfig,
  type PaymentMethodKey,
} from "@/lib/payment";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const DEFAULT_SAMPLE_SUBTOTAL = 3500; // starting value for the pricing preview

type SetFn = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => void;

export function CheckoutDesignerClient({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState<StoreSettings>(initial);
  const [saving, setSaving] = useState(false);

  const set: SetFn = (k, v) => setS((prev) => ({ ...prev, [k]: v }));

  const codEnabled = s.codEnabled !== "false";
  const bankEnabled = s.bankTransferEnabled !== "false";
  const bothOff = !codEnabled && !bankEnabled;
  const advance = parseCodAdvance(s.codAdvance); // blank ⇒ default 250; "0" ⇒ pure COD
  const isPureCod = advance <= 0;

  // Options for the "default method" picker — only currently-enabled methods.
  const enabledKeys: { value: string; label: string }[] = [];
  if (codEnabled) enabledKeys.push({ value: "COD", label: s.codTitle || "Cash on Delivery" });
  if (bankEnabled)
    enabledKeys.push({ value: "BANK_TRANSFER", label: s.bankTransferTitle || "Bank Transfer" });
  const resolvedDefault = resolvePaymentConfig(s).defaultMethod;

  const save = async () => {
    if (bothOff) {
      toast.error("Enable at least one payment method before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Checkout saved · changes are live");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Design the whole checkout page — which payment methods customers see, what each one
            costs, which details you ask for, and every heading and button.
          </p>
        </div>
        <Button onClick={save} disabled={saving || bothOff} variant="gold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {bothOff && (
        <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Both payment methods are off. Enable at least one — a store with no way to pay can&apos;t
            take orders.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        {/* ─────────────── CONTROLS ─────────────── */}
        <div className="space-y-6 min-w-0">
          {/* PAYMENT METHODS */}
          <section className="bg-card border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold">Payment Methods &amp; Pricing</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Offer Cash on Delivery, Bank Transfer, or both. Each method can add a fee or give a
                discount — the order total updates when the customer switches method.
              </p>
            </div>

            {/* COD */}
            <div
              className={`rounded-xl border p-4 space-y-4 transition-colors ${
                codEnabled ? "border-accent/40 bg-accent/[0.03]" : "border-border opacity-70"
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => set("codEnabled", e.target.checked ? "true" : "false")}
                  className="h-4 w-4 accent-amber-600"
                />
                <Banknote className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Cash on Delivery</span>
              </label>

              {codEnabled && (
                <div className="space-y-4 pl-1">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={s.codTitle} onChange={(e) => set("codTitle", e.target.value)} />
                    </div>
                    <div>
                      <Label>Badge (optional)</Label>
                      <Input
                        value={s.codBadge}
                        onChange={(e) => set("codBadge", e.target.value)}
                        placeholder="e.g. Most Popular"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Advance to collect now (Rs.)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={s.codAdvance}
                      onChange={(e) => set("codAdvance", e.target.value)}
                      placeholder="250"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isPureCod ? (
                        <>
                          <strong>Pure COD:</strong> the customer pays the full amount to the courier
                          — no upfront transfer or screenshot.
                        </>
                      ) : (
                        <>
                          Customer transfers {formatPrice(advance)} now to confirm; the balance is
                          collected on delivery. Set to <strong>0</strong> for pure COD; leave blank
                          for the default ({formatPrice(250)}).
                        </>
                      )}
                    </p>
                  </div>
                  <MethodPricingFields method="COD" s={s} set={set} />
                  <div>
                    <Label>Extra note (optional)</Label>
                    <Textarea
                      value={s.codNote}
                      onChange={(e) => set("codNote", e.target.value)}
                      rows={2}
                      placeholder="Shown under the COD instructions, e.g. delivery timeframe."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BANK TRANSFER */}
            <div
              className={`rounded-xl border p-4 space-y-4 transition-colors ${
                bankEnabled ? "border-accent/40 bg-accent/[0.03]" : "border-border opacity-70"
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankEnabled}
                  onChange={(e) => set("bankTransferEnabled", e.target.checked ? "true" : "false")}
                  className="h-4 w-4 accent-blue-600"
                />
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Bank Transfer (pay in full)</span>
              </label>

              {bankEnabled && (
                <div className="space-y-4 pl-1">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={s.bankTransferTitle}
                        onChange={(e) => set("bankTransferTitle", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Badge (optional)</Label>
                      <Input
                        value={s.bankTransferBadge}
                        onChange={(e) => set("bankTransferBadge", e.target.value)}
                        placeholder="e.g. Save 5%"
                      />
                    </div>
                  </div>
                  <MethodPricingFields method="BANK_TRANSFER" s={s} set={set} />
                  <div>
                    <Label>Extra note (optional)</Label>
                    <Textarea
                      value={s.bankTransferNote}
                      onChange={(e) => set("bankTransferNote", e.target.value)}
                      rows={2}
                      placeholder="Shown under the bank-transfer instructions."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DEFAULT METHOD */}
            <div className="max-w-xs">
              <Label>Pre-selected method</Label>
              <Select
                value={resolvedDefault}
                onValueChange={(v) => set("defaultPaymentMethod", v)}
                disabled={enabledKeys.length < 2}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enabledKeys.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Highlighted first when the checkout page loads.
              </p>
            </div>
          </section>

          {/* BANK ACCOUNT */}
          {(!isPureCod || bankEnabled) && (
            <section className="bg-card border rounded-xl p-6 space-y-4">
              <div>
                <h2 className="font-semibold">Bank Account Details</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Shown at checkout for the COD advance and full bank transfers. Customers copy these
                  to send payment.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input value={s.bankName} onChange={(e) => set("bankName", e.target.value)} />
                </div>
                <div>
                  <Label>Account Title</Label>
                  <Input
                    value={s.bankAccountTitle}
                    onChange={(e) => set("bankAccountTitle", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={s.bankAccountNumber}
                    onChange={(e) => set("bankAccountNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input value={s.bankIBAN} onChange={(e) => set("bankIBAN", e.target.value)} />
                </div>
              </div>
            </section>
          )}

          {/* CUSTOMER DETAILS */}
          <section className="bg-card border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Customer Details</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Name, phone, street address and city are always required — an order can&apos;t ship
                without them. Choose how to handle the rest. Fewer fields usually means more orders.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <FieldModeSelect
                label="Email"
                value={s.checkoutEmailField}
                fallback="optional"
                onChange={(v) => set("checkoutEmailField", v)}
              />
              <FieldModeSelect
                label="Area / Postal code"
                value={s.checkoutAreaField}
                fallback="optional"
                onChange={(v) => set("checkoutAreaField", v)}
              />
              <FieldModeSelect
                label="Order notes"
                value={s.checkoutNotesField}
                fallback="optional"
                onChange={(v) => set("checkoutNotesField", v)}
              />
            </div>
            {s.checkoutEmailField === "hidden" && (
              <p className="text-xs text-muted-foreground">
                With email hidden, customers get no confirmation email; they track orders with
                their phone number instead.
              </p>
            )}
            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={s.checkoutCouponEnabled !== "false"}
                onChange={(e) =>
                  set("checkoutCouponEnabled", e.target.checked ? "true" : "false")
                }
                className="h-4 w-4 accent-amber-600"
              />
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Show the &ldquo;Have a coupon code?&rdquo; box</span>
            </label>
          </section>

          {/* PAGE TEXT */}
          <section className="bg-card border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Checkout Page Text</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Every heading and button on the page. Leave a field blank to use the default shown
                in grey.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField
                label="Page heading"
                value={s.checkoutHeading}
                placeholder="Checkout"
                onChange={(v) => set("checkoutHeading", v)}
              />
              <TextField
                label="Page subheading"
                value={s.checkoutSubheading}
                placeholder="Almost there — just a few details."
                onChange={(v) => set("checkoutSubheading", v)}
              />
              <TextField
                label="Step 1 title"
                value={s.checkoutContactTitle}
                placeholder="Contact Information"
                onChange={(v) => set("checkoutContactTitle", v)}
              />
              <TextField
                label="Step 2 title"
                value={s.checkoutShippingTitle}
                placeholder="Shipping Address"
                onChange={(v) => set("checkoutShippingTitle", v)}
              />
              <TextField
                label="Step 3 title"
                value={s.checkoutPaymentTitle}
                placeholder="Payment Method"
                onChange={(v) => set("checkoutPaymentTitle", v)}
              />
              <TextField
                label="Summary title"
                value={s.checkoutSummaryTitle}
                placeholder="Order Summary"
                onChange={(v) => set("checkoutSummaryTitle", v)}
              />
              <TextField
                label="Order button"
                value={s.checkoutButtonText}
                placeholder="Place Order"
                onChange={(v) => set("checkoutButtonText", v)}
              />
              <TextField
                label="Line under the button"
                value={s.checkoutSecureText}
                placeholder="(blank hides it)"
                onChange={(v) => set("checkoutSecureText", v)}
              />
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            Store info, the delivery charge and the free-shipping threshold live under{" "}
            <a href="/admin/settings" className="underline hover:text-foreground">
              Settings
            </a>
            .
          </p>
        </div>

        {/* ─────────────── LIVE PREVIEW ─────────────── */}
        <aside className="lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Eye className="h-4 w-4" />
            Customer preview
          </div>
          <CheckoutPreview s={s} />
        </aside>
      </div>
    </div>
  );
}

/** Fee / discount controls for one payment method. */
function MethodPricingFields({
  method,
  s,
  set,
}: {
  method: PaymentMethodKey;
  s: StoreSettings;
  set: SetFn;
}) {
  const cod = method === "COD";
  const typeKey = cod ? "codAdjustType" : "bankTransferAdjustType";
  const modeKey = cod ? "codAdjustMode" : "bankTransferAdjustMode";
  const valueKey = cod ? "codAdjustValue" : "bankTransferAdjustValue";
  const labelKey = cod ? "codAdjustLabel" : "bankTransferAdjustLabel";

  const type = s[typeKey] === "FEE" || s[typeKey] === "DISCOUNT" ? s[typeKey] : "NONE";
  const mode = s[modeKey] === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";
  const pricing = methodPricing(s, method);

  return (
    <div className="rounded-lg border bg-background/60 p-3 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Pricing for this method
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <Label>Price change</Label>
          <Select value={type} onValueChange={(v) => set(typeKey, v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">No change</SelectItem>
              <SelectItem value="FEE">Add a fee</SelectItem>
              <SelectItem value="DISCOUNT">Give a discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type !== "NONE" && (
          <>
            <div>
              <Label>Amount</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={mode === "PERCENTAGE" ? 100 : undefined}
                  value={s[valueKey]}
                  onChange={(e) => set(valueKey, e.target.value)}
                  placeholder="0"
                />
                <Select value={mode} onValueChange={(v) => set(modeKey, v)}>
                  <SelectTrigger className="w-[76px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Rs.</SelectItem>
                    <SelectItem value="PERCENTAGE">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Label on the bill</Label>
              <Input
                value={s[labelKey]}
                onChange={(e) => set(labelKey, e.target.value)}
                placeholder={pricing.label || (type === "FEE" ? "Charges" : "Discount")}
              />
            </div>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {pricing.kind === "NONE"
          ? "Customers pay the same total as with any other method."
          : `Customers see "${describePricing(pricing)}". ${
              pricing.mode === "PERCENTAGE"
                ? "Percentages apply to the items after any coupon, not to delivery."
                : ""
            }`}
      </p>
    </div>
  );
}

function FieldModeSelect({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value || fallback} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="required">Required</SelectItem>
          <SelectItem value="optional">Optional</SelectItem>
          <SelectItem value="hidden">Hidden</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/**
 * A scaled-down checkout page built from the unsaved settings, plus the bill
 * for a sample order under each enabled method. Totals come from the same
 * calculator the storefront and order API use.
 */
function CheckoutPreview({ s }: { s: StoreSettings }) {
  const cfg = resolvePaymentConfig(s);
  const fields = checkoutFields(s);
  const [sample, setSample] = useState(String(DEFAULT_SAMPLE_SUBTOTAL));
  const [method, setMethod] = useState<PaymentMethodKey>(cfg.defaultMethod);
  const active: PaymentMethodKey = cfg.enabled.includes(method) ? method : cfg.defaultMethod;

  const subtotal = Math.max(0, Number(sample) || 0);
  const t = computeCheckoutTotals(s, { subtotal, discount: 0, method: active });
  const buttonText = s.checkoutButtonText || "Place Order";

  const fieldList = [
    "Full name *",
    "Phone *",
    fields.email !== "hidden" && `Email${fields.email === "required" ? " *" : " (optional)"}`,
  ].filter(Boolean) as string[];
  const addressList = [
    "Street address *",
    "City *",
    fields.area !== "hidden" && `Area / Postal code${fields.area === "required" ? " *" : ""}`,
    fields.notes !== "hidden" && `Order notes${fields.notes === "required" ? " *" : " (optional)"}`,
  ].filter(Boolean) as string[];

  return (
    <div className="border rounded-xl bg-card overflow-hidden text-sm">
      <div className="bg-gradient-to-br from-secondary via-background to-secondary/40 border-b px-5 py-4">
        <p className="font-serif text-xl leading-tight">{s.checkoutHeading || "Checkout"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {s.checkoutSubheading || "Almost there — just a few details."}
        </p>
      </div>

      <div className="p-5 space-y-4">
        <PreviewStep n={1} icon={User} title={s.checkoutContactTitle || "Contact Information"}>
          <FieldChips items={fieldList} />
        </PreviewStep>
        <PreviewStep n={2} icon={MapPin} title={s.checkoutShippingTitle || "Shipping Address"}>
          <FieldChips items={addressList} />
        </PreviewStep>
        <PreviewStep n={3} icon={CreditCard} title={s.checkoutPaymentTitle || "Payment Method"}>
          <div className="space-y-2">
            {cfg.enabled.map((m) => (
              <MethodCard
                key={m}
                active={active === m}
                onClick={() => setMethod(m)}
                icon={m === "COD" ? Banknote : Building2}
                tone={m === "COD" ? "text-amber-600" : "text-blue-600"}
                title={
                  m === "COD"
                    ? s.codTitle || "Cash on Delivery"
                    : s.bankTransferTitle || "Bank Transfer"
                }
                subtitle={methodSubtitle(s, m)}
                badge={(m === "COD" ? s.codBadge : s.bankTransferBadge) || undefined}
              />
            ))}
          </div>
          {cfg.enabled.length > 1 && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Click a method to see its bill below.
            </p>
          )}
        </PreviewStep>

        {/* Summary */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-serif text-base">{s.checkoutSummaryTitle || "Order Summary"}</p>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Info className="h-3 w-3" />
                Sample items
                <Input
                  type="number"
                  min={0}
                  value={sample}
                  onChange={(e) => setSample(e.target.value)}
                  className="h-7 w-24 text-xs"
                  aria-label="Sample order value"
                />
              </label>
            </div>
            {fields.coupon && (
              <p className="text-xs text-accent flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                Have a coupon code?
              </p>
            )}
            <div className="space-y-1 text-xs pt-1">
              <PreviewRow label="Subtotal" value={formatPrice(t.subtotal)} />
              <PreviewRow
                label="Shipping"
                value={t.shipping === 0 ? "Free" : formatPrice(t.shipping)}
              />
              {t.adjustment !== 0 && (
                <PreviewRow
                  label={t.adjustmentLabel}
                  value={
                    t.adjustment > 0
                      ? formatPrice(t.adjustment)
                      : `- ${formatPrice(-t.adjustment)}`
                  }
                  className={t.adjustment < 0 ? "text-green-700" : ""}
                />
              )}
              <div className="border-t pt-1.5 mt-1.5">
                <PreviewRow label="Total" value={formatPrice(t.total)} bold />
              </div>
              {active === "COD" && (
                <>
                  {t.payNow > 0 && (
                    <PreviewRow
                      label="Pay now (advance)"
                      value={formatPrice(t.payNow)}
                      className="text-accent"
                    />
                  )}
                  <PreviewRow label="Pay on delivery" value={formatPrice(t.balanceOnDelivery)} />
                </>
              )}
            </div>
          </div>
          <div className="bg-muted/40 border-t p-3 space-y-1.5">
            <div className="w-full rounded-md bg-accent text-accent-foreground text-center text-xs font-semibold py-2.5">
              {t.payNow > 0 ? `${buttonText} · ${formatPrice(t.payNow)}` : buttonText}
            </div>
            {s.checkoutSecureText && (
              <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                {s.checkoutSecureText}
              </p>
            )}
          </div>
        </div>

        {/* Side-by-side totals so the admin sees the price gap between methods */}
        {cfg.enabled.length > 1 && (
          <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
            <p className="font-medium mb-1">Total by method on this order</p>
            {cfg.enabled.map((m) => {
              const mt = computeCheckoutTotals(s, { subtotal, discount: 0, method: m });
              return (
                <PreviewRow
                  key={m}
                  label={
                    m === "COD"
                      ? s.codTitle || "Cash on Delivery"
                      : s.bankTransferTitle || "Bank Transfer"
                  }
                  value={formatPrice(mt.total)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewStep({
  n,
  icon: Icon,
  title,
  children,
}: {
  n: number;
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="bg-accent/10 text-accent w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold">
          {n}
        </span>
        <p className="font-serif text-sm flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function FieldChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((f) => (
        <span key={f} className="text-[11px] border rounded px-2 py-1 bg-background text-muted-foreground">
          {f}
        </span>
      ))}
    </div>
  );
}

function MethodCard({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
  badge,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: string;
  tone: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left border-2 rounded-xl p-3 transition ${
        active ? "border-accent bg-accent/5 shadow-sm" : "border-border hover:border-foreground/30"
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-3 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
      <div className="flex items-start justify-between mb-1.5">
        <Icon className={`h-4 w-4 ${tone}`} />
        <span
          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
            active ? "border-accent" : "border-border"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-accent" />}
        </span>
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
    </button>
  );
}

function PreviewRow({
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
    <div className={`flex justify-between ${bold ? "font-semibold text-sm" : ""} ${className ?? ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
