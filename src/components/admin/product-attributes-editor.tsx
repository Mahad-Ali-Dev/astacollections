"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Palette, Ruler, Tag, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type AttributeType = "OPTION" | "COLOR" | "SIZE";

type Option = {
  id?: string;
  value: string;
  colorHex?: string | null;
  priceModifier?: number | null;
};

type Attribute = {
  id?: string;
  name: string;
  type: AttributeType;
  required: boolean;
  options: Option[];
};

const TYPE_OPTIONS: { value: AttributeType; label: string; icon: React.ElementType; hint: string }[] = [
  { value: "OPTION", label: "Generic", icon: Tag, hint: "Buttons / dropdown" },
  { value: "SIZE", label: "Size", icon: Ruler, hint: "Numeric size selector" },
  { value: "COLOR", label: "Color", icon: Palette, hint: "Color swatches" },
];

const PRESETS: Record<string, () => Attribute> = {
  "Ring Size": () => ({
    name: "Ring Size",
    type: "SIZE",
    required: true,
    options: ["5", "6", "7", "8", "9", "10", "11", "12"].map((v) => ({ value: v })),
  }),
  Color: () => ({
    name: "Color",
    type: "COLOR",
    required: true,
    options: [
      { value: "Gold", colorHex: "#d4af37" },
      { value: "Rose Gold", colorHex: "#b76e79" },
      { value: "Silver", colorHex: "#c0c0c0" },
    ],
  }),
  "Chain Length": () => ({
    name: "Chain Length",
    type: "OPTION",
    required: true,
    options: ['16"', '18"', '20"', '24"'].map((v) => ({ value: v })),
  }),
};

export function ProductAttributesEditor({ productId }: { productId: string | null }) {
  const [attrs, setAttrs] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/products/${productId}/attributes`)
      .then((r) => r.json())
      .then((d) =>
        setAttrs(
          (d.attributes ?? []).map((a: any) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            required: a.required,
            options: a.options.map((o: any) => ({
              id: o.id,
              value: o.value,
              colorHex: o.colorHex,
              priceModifier: o.priceModifier,
            })),
          }))
        )
      )
      .catch(() => toast.error("Failed to load attributes"))
      .finally(() => setLoading(false));
  }, [productId]);

  const addAttr = (preset?: keyof typeof PRESETS) => {
    if (preset) {
      setAttrs([...attrs, PRESETS[preset]()]);
    } else {
      setAttrs([...attrs, { name: "", type: "OPTION", required: true, options: [{ value: "" }] }]);
    }
  };

  const removeAttr = (i: number) => setAttrs(attrs.filter((_, idx) => idx !== i));

  const updateAttr = (i: number, patch: Partial<Attribute>) =>
    setAttrs(attrs.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  const updateOption = (ai: number, oi: number, patch: Partial<Option>) =>
    setAttrs(
      attrs.map((a, i) =>
        i === ai
          ? { ...a, options: a.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) }
          : a
      )
    );

  const addOption = (ai: number) =>
    setAttrs(attrs.map((a, i) => (i === ai ? { ...a, options: [...a.options, { value: "" }] } : a)));

  const removeOption = (ai: number, oi: number) =>
    setAttrs(
      attrs.map((a, i) =>
        i === ai ? { ...a, options: a.options.filter((_, j) => j !== oi) } : a
      )
    );

  const save = async () => {
    if (!productId) {
      toast.error("Save the product first, then add attributes");
      return;
    }
    // Validation
    for (const [i, a] of attrs.entries()) {
      if (!a.name.trim()) {
        toast.error(`Attribute #${i + 1} needs a name`);
        return;
      }
      if (a.options.length === 0) {
        toast.error(`"${a.name}" needs at least one option`);
        return;
      }
      for (const o of a.options) {
        if (!o.value.trim()) {
          toast.error(`Empty option value in "${a.name}"`);
          return;
        }
      }
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}/attributes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: attrs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Attributes saved");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!productId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Save the product first, then come back here to add size / color attributes.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attrs.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            No attributes yet. Add Size, Color, Length etc. so customers can pick a variant.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Object.keys(PRESETS).map((key) => (
              <button
                key={key}
                onClick={() => addAttr(key as keyof typeof PRESETS)}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary border hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                + {key}
              </button>
            ))}
            <button
              onClick={() => addAttr()}
              className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
            >
              + Custom
            </button>
          </div>
        </div>
      )}

      {attrs.map((attr, ai) => (
        <div key={ai} className="bg-card border rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3">
            <GripVertical className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />
            <div className="flex-1 grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div>
                <Label>Attribute name</Label>
                <Input
                  value={attr.name}
                  onChange={(e) => updateAttr(ai, { name: e.target.value })}
                  placeholder="Ring Size, Color, Length…"
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  value={attr.type}
                  onChange={(e) =>
                    updateAttr(ai, { type: e.target.value as AttributeType })
                  }
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer h-10">
                <input
                  type="checkbox"
                  checked={attr.required}
                  onChange={(e) => updateAttr(ai, { required: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-xs">Required</span>
              </label>
            </div>
            <button
              onClick={() => removeAttr(ai)}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove attribute"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="pl-7 space-y-2">
            <Label>Options</Label>
            {attr.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2 flex-wrap">
                <Input
                  value={opt.value}
                  onChange={(e) => updateOption(ai, oi, { value: e.target.value })}
                  placeholder={attr.type === "SIZE" ? "e.g. 7" : attr.type === "COLOR" ? "e.g. Gold" : "Option value"}
                  className="flex-1 min-w-[160px]"
                />
                {attr.type === "COLOR" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={opt.colorHex || "#cccccc"}
                      onChange={(e) => updateOption(ai, oi, { colorHex: e.target.value })}
                      className="h-10 w-12 border rounded-md cursor-pointer"
                      aria-label="Color"
                    />
                    <Input
                      value={opt.colorHex ?? ""}
                      onChange={(e) => updateOption(ai, oi, { colorHex: e.target.value })}
                      placeholder="#FFD700"
                      className="w-28 font-mono text-xs"
                    />
                  </div>
                )}
                <Input
                  type="number"
                  value={opt.priceModifier ?? ""}
                  onChange={(e) =>
                    updateOption(ai, oi, {
                      priceModifier: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="+/- Rs."
                  className="w-24"
                />
                <button
                  onClick={() => removeOption(ai, oi)}
                  className="p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Remove option"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption(ai)}
              className="text-xs flex items-center gap-1 text-accent hover:underline"
            >
              <Plus className="h-3 w-3" />
              Add option
            </button>
          </div>
        </div>
      ))}

      {attrs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => addAttr()}>
            <Plus className="h-4 w-4" />
            Add another attribute
          </Button>
          <Button onClick={save} disabled={saving} variant="gold" className="ml-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save attributes"}
          </Button>
        </div>
      )}
    </div>
  );
}
