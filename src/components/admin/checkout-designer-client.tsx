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
import { resolvePaymentConfig, parseCodAdvance } from "@/lib/payment";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const SAMPLE_SUBTOTAL = 1399; // used only for the pricing preview

export function CheckoutDesignerClient({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState<StoreSettings>(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

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
            Design the payment step — choose which methods customers see, the copy, and how much
            they pay now vs. on delivery.
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

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ─────────────── CONTROLS ─────────────── */}
        <div className="space-y-6 min-w-0">
          {/* PAYMENT METHODS */}
          <section className="bg-card border rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-semibold">Payment Methods</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Turn each method on or off. Keep both for maximum choice, or run a single-method
                checkout.
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
                        placeholder="e.g. Fastest"
                      />
                    </div>
                  </div>
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

          {/* PAGE TEXT */}
          <section className="bg-card border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Checkout Page Text</h2>
              <p className="text-xs text-muted-foreground mt-1">
                The heading shown at the top of the checkout page.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Heading</Label>
                <Input
                  value={s.checkoutHeading}
                  onChange={(e) => set("checkoutHeading", e.target.value)}
                  placeholder="Checkout"
                />
              </div>
              <div>
                <Label>Subheading</Label>
                <Input
                  value={s.checkoutSubheading}
                  onChange={(e) => set("checkoutSubheading", e.target.value)}
                  placeholder="Almost there — just a few details."
                />
              </div>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">
            Store info and shipping fees live under{" "}
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
          <PaymentPreview s={s} />
        </aside>
      </div>
    </div>
  );
}

/** Mirrors the storefront payment cards + shows how the money splits. */
function PaymentPreview({ s }: { s: StoreSettings }) {
  const cfg = resolvePaymentConfig(s);
  const advance = cfg.codAdvance;

  const shippingFee = Number(s.shippingFee) || 0;
  const freeThreshold = Number(s.freeShippingThreshold) || 5000;
  const shipping = SAMPLE_SUBTOTAL >= freeThreshold ? 0 : shippingFee;
  const total = SAMPLE_SUBTOTAL + shipping;

  const Card = ({
    active,
    icon: Icon,
    title,
    subtitle,
    badge,
    tone,
  }: {
    active: boolean;
    icon: React.ElementType;
    title: string;
    subtitle: string;
    badge?: string;
    tone: string;
  }) => (
    <div
      className={`relative border-2 rounded-xl p-4 ${
        active ? "border-accent bg-accent/5 shadow-sm" : "border-border"
      }`}
    >
      {badge && (
        <span className="absolute -top-2 right-3 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
      <div className="flex items-start justify-between mb-2">
        <Icon className={`h-5 w-5 ${tone}`} />
        <span
          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
            active ? "border-accent" : "border-border"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-accent" />}
        </span>
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  );

  return (
    <div className="border rounded-xl bg-card p-5 space-y-4">
      <div className="space-y-2">
        {cfg.codEnabled && (
          <Card
            active={cfg.defaultMethod === "COD"}
            icon={Banknote}
            title={s.codTitle || "Cash on Delivery"}
            subtitle={
              advance > 0
                ? `${formatPrice(advance)} advance · balance on delivery`
                : "Pay in full when it arrives"
            }
            badge={s.codBadge || undefined}
            tone="text-amber-600"
          />
        )}
        {cfg.bankEnabled && (
          <Card
            active={cfg.defaultMethod === "BANK_TRANSFER"}
            icon={Building2}
            title={s.bankTransferTitle || "Bank Transfer"}
            subtitle="Pay full amount now"
            badge={s.bankTransferBadge || undefined}
            tone="text-blue-600"
          />
        )}
      </div>

      {/* Pricing breakdown for a sample order */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          On a sample {formatPrice(total)} order
        </p>

        {cfg.codEnabled && (
          <div className="text-xs space-y-1">
            <p className="font-medium">{s.codTitle || "Cash on Delivery"}</p>
            {advance > 0 ? (
              <>
                <PreviewRow label="Pay now (advance)" value={formatPrice(advance)} accent />
                <PreviewRow label="Pay on delivery" value={formatPrice(total - advance)} />
              </>
            ) : (
              <PreviewRow label="Pay on delivery" value={formatPrice(total)} accent />
            )}
          </div>
        )}

        {cfg.bankEnabled && (
          <div className="text-xs space-y-1">
            <p className="font-medium">{s.bankTransferTitle || "Bank Transfer"}</p>
            <PreviewRow label="Pay now (full)" value={formatPrice(total)} accent />
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${accent ? "text-accent font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
