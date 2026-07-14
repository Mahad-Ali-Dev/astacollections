"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoreSettings } from "@/lib/settings";
import { toast } from "sonner";

export function SettingsClient({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState<StoreSettings>(initial);
  const [saving, setSaving] = useState(false);

  const upd = (k: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setS({ ...s, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Settings saved");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Settings</h1>
          <p className="text-sm text-muted-foreground">Store info, payment & shipping</p>
        </div>
        <Button onClick={save} disabled={saving} variant="gold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Store Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Store Name</Label>
            <Input value={s.storeName} onChange={upd("storeName")} />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={s.storeTagline} onChange={upd("storeTagline")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={s.storeEmail} onChange={upd("storeEmail")} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={s.storePhone} onChange={upd("storePhone")} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Textarea value={s.storeAddress} onChange={upd("storeAddress")} rows={2} />
          </div>
        </div>
      </section>

      <section className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">Shipping</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Shipping Fee (Rs.)</Label>
            <Input type="number" value={s.shippingFee} onChange={upd("shippingFee")} />
            <p className="text-xs text-muted-foreground mt-1">
              Set to 0 for free shipping always.
            </p>
          </div>
          <div>
            <Label>Free Shipping Above (Rs.)</Label>
            <Input
              type="number"
              value={s.freeShippingThreshold}
              onChange={upd("freeShippingThreshold")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Orders above this get free shipping.
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Payment methods, COD advance and bank account details are configured under{" "}
          <a href="/admin/checkout" className="underline hover:text-foreground">
            Checkout
          </a>
          .
        </p>
      </section>
    </div>
  );
}
