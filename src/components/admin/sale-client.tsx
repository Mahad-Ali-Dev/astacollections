"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Percent, PlayCircle, StopCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SaleSummary } from "@/lib/store-sale";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Confirm = null | "start" | "end";

export function SaleClient({ initial }: { initial: SaleSummary }) {
  const router = useRouter();
  const [sale, setSale] = useState(initial);
  const [percent, setPercent] = useState(String(initial.active ? initial.percent : 50));
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const pct = Math.round(Number(percent));
  const validPct = pct >= 1 && pct <= 90;
  const example = (price: number) => Math.max(1, Math.round(price * (1 - pct / 100)));

  const call = async (method: "POST" | "DELETE", body?: object) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sale", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSale(data.sale);
      return data;
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
      return null;
    } finally {
      setBusy(false);
      setConfirm(null);
      router.refresh();
    }
  };

  const start = async () => {
    const data = await call("POST", { percent: pct });
    if (data) toast.success(`${pct}% off is live on ${data.sale.discounted} products`);
  };
  const includeNew = async () => {
    const data = await call("POST", { percent: sale.percent });
    if (data) toast.success("New products are now discounted too");
  };
  const end = async () => {
    const data = await call("DELETE");
    if (data) {
      toast.success(`Sale ended: ${data.restored} products back to their original price`);
      if (data.keptManualEdits > 0) {
        toast.message(`${data.keptManualEdits} products kept the price you set by hand during the sale`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif">Store Sale</h1>
        <p className="text-sm text-muted-foreground">
          Take a percentage off every product at once, and switch it off whenever you like.
        </p>
      </div>

      {sale.active ? (
        <section className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                <Percent className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-lg">{sale.percent}% off everything is live</h2>
                <p className="text-sm text-muted-foreground">
                  {sale.startedAt ? `Started ${formatDate(sale.startedAt)} · ` : ""}
                  {sale.discounted} of {sale.totalProducts} products discounted
                </p>
              </div>
            </div>
            <Badge className="bg-green-600 hover:bg-green-600">Live</Badge>
          </div>

          {sale.notYetDiscounted > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm flex items-center justify-between gap-4 flex-wrap">
              <span>
                {sale.notYetDiscounted} product{sale.notYetDiscounted === 1 ? " was" : "s were"} added after the
                sale started and {sale.notYetDiscounted === 1 ? "is" : "are"} still at full price.
              </span>
              <Button size="sm" variant="outline" onClick={includeNew} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                Discount them too
              </Button>
            </div>
          )}

          <Button variant="destructive" onClick={() => setConfirm("end")} disabled={busy}>
            <StopCircle className="h-4 w-4" />
            End sale and restore prices
          </Button>
        </section>
      ) : (
        <section className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold">Start a sale</h2>
          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <Label>Discount (%)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground pb-2">
              {validPct ? (
                <>
                  Example: <s>{formatPrice(1000)}</s> → <strong>{formatPrice(example(1000))}</strong>, shown with a
                  “-{pct}%” badge
                </>
              ) : (
                "Enter a discount between 1% and 90%."
              )}
            </p>
          </div>
          <Button variant="gold" onClick={() => setConfirm("start")} disabled={busy || !validPct}>
            <PlayCircle className="h-4 w-4" />
            Start {validPct ? `${pct}% off` : "sale"} on all {sale.totalProducts} products
          </Button>
        </section>
      )}

      <section className="bg-card border rounded-lg p-6 space-y-2 text-sm text-muted-foreground">
        <h2 className="font-semibold text-foreground">How it works</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Every product’s price drops by the discount, with the original price shown crossed out. Option
            surcharges (e.g. a bigger size) drop by the same percentage.
          </li>
          <li>The shop, cart and checkout update straight away. Orders are charged the sale price.</li>
          <li>
            Ending the sale puts every original price back exactly. If you change a product’s price by hand during
            the sale, your new price is kept.
          </li>
          <li>Coupons and bundle discounts still apply on top of the sale price.</li>
          <li>
            The announcement bar is not changed for you: update it under{" "}
            <a href="/admin/content" className="underline hover:text-foreground">
              Site Content
            </a>{" "}
            to tell shoppers about the sale.
          </li>
        </ul>
      </section>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm === "start" ? `Start ${pct}% off everything?` : "End the sale?"}</DialogTitle>
            <DialogDescription>
              {confirm === "start"
                ? `All ${sale.totalProducts} products drop by ${pct}% on the live shop right away.`
                : "Every product goes back to its original price on the live shop right away."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={confirm === "start" ? "gold" : "destructive"}
              onClick={confirm === "start" ? start : end}
              disabled={busy}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirm === "start" ? "Start sale" : "End sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
