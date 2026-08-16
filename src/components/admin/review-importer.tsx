"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ChevronDown, ChevronUp, Plus, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Product = { id: string; name: string; sku: string };

type Row = {
  product: string;
  customerName: string;
  rating: string;
  title: string;
  body: string;
  createdAt: string;
};

const EMPTY: Row = {
  product: "",
  customerName: "",
  rating: "5",
  title: "",
  body: "",
  createdAt: "",
};

const COLUMNS = ["product", "customerName", "rating", "title", "body", "createdAt"] as const;

/**
 * Parse pasted spreadsheet rows. Tabs are the default separator because
 * that's what copying from Excel or Sheets produces, and unlike commas it
 * survives review text containing punctuation.
 */
function parsePasted(raw: string): Row[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.includes("\t") ? line.split("\t") : line.split(",");
      const row = { ...EMPTY };
      COLUMNS.forEach((c, i) => {
        if (cells[i] !== undefined) row[c] = cells[i].trim();
      });
      return row;
    })
    .filter((r) => r.product.toLowerCase() !== "product");
}

export function ReviewImporter({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"form" | "paste">("form");
  const [draft, setDraft] = useState<Row>(EMPTY);
  const [queue, setQueue] = useState<Row[]>([]);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const pasted = mode === "paste" ? parsePasted(raw) : [];
  const rows = mode === "paste" ? pasted : queue;

  function addToQueue() {
    if (!draft.product) return toast.error("Choose a product");
    if (!draft.customerName.trim()) return toast.error("Enter the customer's name");
    if (draft.body.trim().length < 3) return toast.error("Enter the review text");
    setQueue([...queue, draft]);
    setDraft({ ...EMPTY, product: draft.product });
    toast.success("Added to the list below");
  }

  async function importAll() {
    if (rows.length === 0) return toast.error("Nothing to import");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviews/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: rows.map((r) => ({
            product: r.product,
            customerName: r.customerName,
            rating: r.rating,
            title: r.title,
            body: r.body,
            createdAt: r.createdAt || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.imported > 0) {
        toast.success(`Imported ${data.imported} review${data.imported === 1 ? "" : "s"}`);
        setQueue([]);
        setRaw("");
        router.refresh();
      }
      if (data.skipped > 0) {
        const first = data.errors
          .slice(0, 3)
          .map((e: any) => `Row ${e.row}: ${e.reason}`)
          .join(" · ");
        toast.error(`Skipped ${data.skipped}. ${first}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const productLabel = (value: string) =>
    products.find((p) => p.sku === value)?.name ?? value;

  return (
    <div className="bg-card border rounded-xl mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div>
          <h2 className="font-semibold">Add reviews</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter real reviews from Instagram or WhatsApp, one at a time or pasted in bulk.
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 border-t pt-5">
          <div className="inline-flex rounded-lg border p-1 bg-secondary/40">
            {(["form", "paste"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 text-sm rounded-md transition ${
                  mode === m
                    ? "bg-background shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "form" ? "One at a time" : "Paste from spreadsheet"}
              </button>
            ))}
          </div>

          {mode === "form" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Product</Label>
                <select
                  value={draft.product}
                  onChange={(e) => setDraft({ ...draft, product: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Choose a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Customer name</Label>
                <Input
                  value={draft.customerName}
                  onChange={(e) => setDraft({ ...draft, customerName: e.target.value })}
                  placeholder="Ayesha K."
                />
              </div>

              <div>
                <Label>Rating</Label>
                <select
                  value={draft.rating}
                  onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"★".repeat(n)}{"☆".repeat(5 - n)}  ({n})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <Label>Title (optional)</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Exactly as pictured"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Review</Label>
                <Textarea
                  rows={3}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="What the customer actually said"
                />
              </div>

              <div>
                <Label>Date (optional)</Label>
                <Input
                  type="date"
                  value={draft.createdAt}
                  onChange={(e) => setDraft({ ...draft, createdAt: e.target.value })}
                />
              </div>

              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={addToQueue} className="w-full">
                  <Plus className="h-4 w-4" />
                  Add to list
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p>
                  One review per line. Columns separated by <strong>tabs</strong> — copy
                  straight from Excel or Google Sheets in this order:
                </p>
                <code className="block bg-secondary rounded-lg p-2.5 font-mono text-[11px]">
                  product · name · rating · title · review text · date
                </code>
                <p>
                  <strong>product</strong> is the SKU, URL slug or exact product name.
                  Type into the box below — the grey text is only an example.
                </p>
              </div>
              <Textarea
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                rows={8}
                className="font-mono text-xs"
                placeholder={"ASTA-PEN-SET-027\tAyesha K.\t5\tLovely\tExactly as pictured.\t2026-07-14"}
              />
            </div>
          )}

          {rows.length > 0 && (
            <div className="border rounded-lg divide-y">
              {rows.map((r, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                  <div className="flex shrink-0 pt-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={
                          j < Number(r.rating)
                            ? "h-3 w-3 fill-accent text-accent"
                            : "h-3 w-3 text-muted-foreground/30"
                        }
                      />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {r.customerName}{" "}
                      <span className="text-muted-foreground font-normal">
                        · {productLabel(r.product)}
                      </span>
                    </p>
                    <p className="text-muted-foreground truncate">{r.body}</p>
                  </div>
                  {mode === "form" && (
                    <button
                      type="button"
                      onClick={() => setQueue(queue.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {rows.length === 0
                ? mode === "form"
                  ? "Fill the form above and click Add to list"
                  : "Paste rows above"
                : `${rows.length} review${rows.length === 1 ? "" : "s"} ready — they go live as approved`}
            </p>
            <Button onClick={importAll} disabled={busy || rows.length === 0} variant="gold">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import {rows.length > 0 ? rows.length : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
