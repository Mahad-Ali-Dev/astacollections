"use client";

import { Check } from "lucide-react";

export type AttributeOption = {
  id: string;
  value: string;
  colorHex?: string | null;
  priceModifier?: number | null;
};

export type ProductAttribute = {
  id: string;
  name: string;
  type: "OPTION" | "COLOR" | "SIZE";
  required: boolean;
  options: AttributeOption[];
};

type Props = {
  attributes: ProductAttribute[];
  selected: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
};

export function ProductAttributePicker({ attributes, selected, onChange }: Props) {
  if (attributes.length === 0) return null;

  const pickOption = (attrName: string, value: string) => {
    onChange({ ...selected, [attrName]: value });
  };

  return (
    <div className="space-y-5">
      {attributes.map((attr) => {
        const current = selected[attr.name];
        return (
          <div key={attr.id}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                {attr.name}
                {attr.required && <span className="text-accent ml-1">*</span>}
              </label>
              {current && (
                <span className="text-sm font-medium text-foreground">{current}</span>
              )}
            </div>

            {attr.type === "COLOR" ? (
              <div className="flex flex-wrap gap-2.5">
                {attr.options.map((o) => {
                  const isActive = current === o.value;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pickOption(attr.name, o.value)}
                      aria-label={o.value}
                      title={o.value}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        isActive
                          ? "border-foreground scale-105"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      style={{ backgroundColor: o.colorHex ?? "#cccccc" }}
                    >
                      {isActive && (
                        <Check
                          className="absolute inset-0 m-auto h-4 w-4"
                          color={isLightColor(o.colorHex) ? "#000" : "#fff"}
                          strokeWidth={3}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : attr.type === "SIZE" ? (
              <div className="flex flex-wrap gap-2">
                {attr.options.map((o) => {
                  const isActive = current === o.value;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pickOption(attr.name, o.value)}
                      className={`min-w-[3rem] h-11 px-3 rounded-full text-sm font-semibold tabular-nums transition-all border-2 ${
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {o.value}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {attr.options.map((o) => {
                  const isActive = current === o.value;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => pickOption(attr.name, o.value)}
                      className={`px-4 h-10 rounded-full text-sm font-medium transition-all border-2 ${
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {o.value}
                      {o.priceModifier ? (
                        <span className="text-xs opacity-70 ml-1.5">
                          ({o.priceModifier > 0 ? "+" : ""}Rs.{Math.abs(o.priceModifier)})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isLightColor(hex?: string | null): boolean {
  if (!hex) return false;
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // YIQ formula for perceived brightness
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

/** Compute the total price for the current selection (sum of priceModifiers). */
export function computeAttributesPriceModifier(
  attributes: ProductAttribute[],
  selected: Record<string, string>
): number {
  let total = 0;
  for (const attr of attributes) {
    const value = selected[attr.name];
    if (!value) continue;
    const opt = attr.options.find((o) => o.value === value);
    if (opt?.priceModifier) total += opt.priceModifier;
  }
  return total;
}

/** Returns the list of required attributes that haven't been selected. */
export function missingRequiredSelections(
  attributes: ProductAttribute[],
  selected: Record<string, string>
): string[] {
  return attributes.filter((a) => a.required && !selected[a.name]).map((a) => a.name);
}
