"use client";

import { Check } from "lucide-react";

export type AttributeOption = {
  id: string;
  value: string;
  colorHex?: string | null;
  priceModifier?: number | null;
  /** Per-option stock. null/undefined = no per-option limit. */
  stock?: number | null;
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

/** True when this option has a per-option stock and it's zero. */
function isOptionSoldOut(o: AttributeOption): boolean {
  return typeof o.stock === "number" && o.stock <= 0;
}

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
                  const soldOut = isOptionSoldOut(o);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => pickOption(attr.name, o.value)}
                      aria-label={soldOut ? `${o.value} — out of stock` : o.value}
                      title={soldOut ? `${o.value} — out of stock` : o.value}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        soldOut
                          ? "opacity-40 cursor-not-allowed border-border"
                          : isActive
                            ? "border-foreground scale-105"
                            : "border-border hover:border-muted-foreground"
                      }`}
                      style={{ backgroundColor: o.colorHex ?? "#cccccc" }}
                    >
                      {isActive && !soldOut && (
                        <Check
                          className="absolute inset-0 m-auto h-4 w-4"
                          color={isLightColor(o.colorHex) ? "#000" : "#fff"}
                          strokeWidth={3}
                        />
                      )}
                      {soldOut && (
                        <span
                          className="absolute inset-0 m-auto block w-full h-px bg-foreground/70 rotate-45 origin-center"
                          aria-hidden="true"
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
                  const soldOut = isOptionSoldOut(o);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => pickOption(attr.name, o.value)}
                      aria-label={soldOut ? `${o.value} — out of stock` : o.value}
                      className={`relative min-w-[3rem] h-11 px-3 rounded-full text-sm font-semibold tabular-nums transition-all border-2 ${
                        soldOut
                          ? "opacity-40 cursor-not-allowed line-through border-border text-muted-foreground"
                          : isActive
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
                  const soldOut = isOptionSoldOut(o);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() => pickOption(attr.name, o.value)}
                      aria-label={soldOut ? `${o.value} — out of stock` : o.value}
                      className={`px-4 h-10 rounded-full text-sm font-medium transition-all border-2 ${
                        soldOut
                          ? "opacity-40 cursor-not-allowed line-through border-border text-muted-foreground"
                          : isActive
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
                      {soldOut && (
                        <span className="text-[10px] uppercase ml-1.5 tracking-wide">
                          · Out
                        </span>
                      )}
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

/**
 * Effective stock for the currently-selected variant.
 *
 * Logic:
 *  - If no attribute is selected (or none have stock set) → null (no per-variant cap).
 *  - Otherwise → the MIN of any selected option's `stock` (only counting options
 *    that actually have a stock value). This way "Size 7 = 2 in stock" + "Gold (no stock set)"
 *    yields 2.
 *
 * Callers should then take Math.min(product.stock, variantStock ?? Infinity) for the qty cap.
 */
export function selectedVariantStock(
  attributes: ProductAttribute[],
  selected: Record<string, string>
): number | null {
  let min: number | null = null;
  for (const attr of attributes) {
    const value = selected[attr.name];
    if (!value) continue;
    const opt = attr.options.find((o) => o.value === value);
    if (!opt) continue;
    if (typeof opt.stock === "number") {
      min = min === null ? opt.stock : Math.min(min, opt.stock);
    }
  }
  return min;
}
