"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ParsedRow = {
  product: string;
  customerName: string;
  rating: string;
  title: string;
  body: string;
  createdAt: string;
};

const COLUMNS = ["product", "customerName", "rating", "title", "body", "createdAt"] as const;

const EXAMPLE = [
  "ASTA-PEN-SET-027\tAyesha K.\t5\tExactly as pictured\tWore it to my cousin's mehndi and three people asked where it's from. Still shiny after a month.\t2026-07-14",
  "midnight-clover-trinity-jewelry-set\tSana M.\t4\t\tDelivery took 4 days to Karachi. Packaging was lovely. Ring is slightly loose but adjustable.\t",
].join("\n");

/**
 * Paste rows straight out of a spreadsheet. Tabs are the default separator
 * because that's what you get copying from Excel or Google Sheets; commas
 * work too, but tabs survive review text containing commas.
 */
function parse(raw: string): ParsedRow[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cells = line.includes("\t") ? line.split("\t") : line.split(",");
      const row = {} as ParsedRow;
      COLUMNS.forEach((c, i) => {
        row[c] = (cells[i] ?? "").trim();
      });
      return row;
    })
    // Tolerate a pasted header row.
    .filter((r) => r.product.toLowerCase() !== "product");
}

export function ReviewImporter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = parse(raw);

  async function submit() {
    if (rows.length === 0) {
      toast.error("Nothing to import");
      return;
    }
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
      }
      if (data.skipped > 0) {
        const first = data.errors
          .slice(0, 3)
          .map((e: any) => `Row ${e.row}: ${e.reason}`)
          .join(" · ");
        toast.error(`Skipped ${data.skipped}. ${first}`);
      }
      if (data.imported > 0) {
        setRaw("");
        router.refresh();
      }
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-card border rounded-xl mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <div>
          <h2 className="font-semibold">Import reviews</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste real reviews from a spreadsheet, Instagram or WhatsApp — several at a time.
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t pt-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              One review per line, columns separated by <strong>tabs</strong> (paste
              straight from Excel or Google Sheets) or commas:
            </p>
            <code className="block bg-secondary rounded-lg p-2.5 font-mono text-[11px] leading-relaxed">
              product · name · rating · title · review text · date
            </code>
            <p>
              <strong>product</strong> can be the SKU, the URL slug, or the exact product
              name. <strong>rating</strong> is 1–5. <strong>title</strong> and{" "}
              <strong>date</strong> can be left blank. Imported reviews go live
              immediately as approved.
            </p>
          </div>

          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={EXAMPLE}
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {rows.length === 0
                ? "Nothing pasted yet"
                : `${rows.length} row${rows.length === 1 ? "" : "s"} ready`}
            </p>
            <Button onClick={submit} disabled={busy || rows.length === 0} variant="gold">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import {rows.length > 0 ? rows.length : ""}
            </Button>
          </div>

          {rows.length > 0 && (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Product</th>
                    <th className="text-left px-3 py-2 font-semibold">Name</th>
                    <th className="text-left px-3 py-2 font-semibold">★</th>
                    <th className="text-left px-3 py-2 font-semibold">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 font-mono">{r.product || "—"}</td>
                      <td className="px-3 py-2">{r.customerName || "—"}</td>
                      <td className="px-3 py-2">{r.rating || "—"}</td>
                      <td className="px-3 py-2 max-w-md truncate">{r.body || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 10 && (
                <p className="text-xs text-muted-foreground px-3 py-2 border-t">
                  …and {rows.length - 10} more
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
