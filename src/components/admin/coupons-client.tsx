"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
};

const empty = {
  id: "",
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrder: "",
  maxDiscount: "",
  usageLimit: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export function CouponsClient({ initial }: { initial: Coupon[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const newCoupon = () => {
    setEditing(empty);
    setOpen(true);
  };

  const editCoupon = (c: Coupon) => {
    setEditing({
      id: c.id,
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrder: c.minOrder ? String(c.minOrder) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 10) : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing.code || !editing.discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const payload = {
        code: editing.code,
        description: editing.description || null,
        discountType: editing.discountType,
        discountValue: Number(editing.discountValue),
        minOrder: editing.minOrder ? Number(editing.minOrder) : null,
        maxDiscount: editing.maxDiscount ? Number(editing.maxDiscount) : null,
        usageLimit: editing.usageLimit ? Number(editing.usageLimit) : null,
        startsAt: editing.startsAt || null,
        expiresAt: editing.expiresAt || null,
        isActive: editing.isActive,
      };
      const res = await fetch(
        isNew ? "/api/coupons" : `/api/coupons/${editing.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isNew ? "Coupon created" : "Coupon updated");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      const res = await fetch(`/api/coupons/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Coupon deleted");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Coupons</h1>
          <p className="text-sm text-muted-foreground">{initial.length} total</p>
        </div>
        <Button onClick={newCoupon} variant="gold">
          <Plus className="h-4 w-4" />
          New Coupon
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {initial.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">No coupons yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Discount</th>
                  <th className="text-left p-3">Min Order</th>
                  <th className="text-left p-3">Usage</th>
                  <th className="text-left p-3">Validity</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initial.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <span className="font-mono font-bold text-accent">{c.code}</span>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      )}
                    </td>
                    <td className="p-3">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}%`
                        : formatPrice(c.discountValue)}
                      {c.maxDiscount && c.discountType === "PERCENTAGE" && (
                        <p className="text-xs text-muted-foreground">
                          Max {formatPrice(c.maxDiscount)}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      {c.minOrder ? formatPrice(c.minOrder) : "—"}
                    </td>
                    <td className="p-3">
                      {c.usageCount} / {c.usageLimit ?? "∞"}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : "No expiry"}
                    </td>
                    <td className="p-3">
                      <Badge variant={c.isActive ? "success" : "outline"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => editCoupon(c)} className="p-2 hover:bg-muted rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Coupon" : "New Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Code *</Label>
              <Input
                value={editing.code}
                onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                className="font-mono uppercase"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="What this coupon is for"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type *</Label>
                <Select
                  value={editing.discountType}
                  onValueChange={(v) => setEditing({ ...editing, discountType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount (Rs.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <Input
                  type="number"
                  value={editing.discountValue}
                  onChange={(e) => setEditing({ ...editing, discountValue: e.target.value })}
                  placeholder={editing.discountType === "PERCENTAGE" ? "10" : "500"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order (Rs.)</Label>
                <Input
                  type="number"
                  value={editing.minOrder}
                  onChange={(e) => setEditing({ ...editing, minOrder: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label>Max Discount (Rs.)</Label>
                <Input
                  type="number"
                  value={editing.maxDiscount}
                  onChange={(e) => setEditing({ ...editing, maxDiscount: e.target.value })}
                  placeholder="For % coupons"
                />
              </div>
            </div>
            <div>
              <Label>Usage Limit</Label>
              <Input
                type="number"
                value={editing.usageLimit}
                onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Starts At</Label>
                <Input
                  type="date"
                  value={editing.startsAt}
                  onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })}
                />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input
                  type="date"
                  value={editing.expiresAt}
                  onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.isActive}
                onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} variant="gold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
