"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CONFIRM_WORD = "DELETE";

/**
 * Bulk delete with a type-to-confirm gate. Reviews have no soft-delete or
 * undo, so a misplaced click here is unrecoverable — the extra friction is
 * deliberate. The count is sent along and re-checked server-side so nothing
 * that arrived after this screen rendered gets caught in the sweep.
 */
export function ReviewBulkDelete({
  status,
  count,
}: {
  status: string;
  count: number;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const label = status === "ALL" ? "all reviews" : `all ${status.toLowerCase()} reviews`;

  async function run() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/reviews/bulk?status=${status}&expected=${count}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Deleted ${data.deleted} review${data.deleted === 1 ? "" : "s"}`);
      setArmed(false);
      setTyped("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (count === 0) return null;

  if (!armed) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/40 hover:bg-destructive/10"
        onClick={() => setArmed(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete {label}
      </Button>
    );
  }

  return (
    <div className="border border-destructive/50 bg-destructive/5 rounded-xl p-4 space-y-3 max-w-md">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-destructive">
            Permanently delete {count} review{count === 1 ? "" : "s"}?
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            This removes {label} and cannot be undone. Product star ratings will
            drop to zero for anything left without reviews.
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">
          Type <strong className="font-mono text-foreground">{CONFIRM_WORD}</strong> to
          confirm
        </label>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="mt-1 font-mono"
          autoFocus
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={typed !== CONFIRM_WORD || busy}
          onClick={run}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete {count}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => {
            setArmed(false);
            setTyped("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
