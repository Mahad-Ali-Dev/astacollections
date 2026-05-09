"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ReviewModerator({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (newStatus: string) => {
    setBusy(newStatus);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Marked as ${newStatus.toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Update failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this review permanently?")) return;
    setBusy("delete");
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Review deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t">
      {status !== "APPROVED" && (
        <button
          onClick={() => setStatus("APPROVED")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {busy === "APPROVED" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button
          onClick={() => setStatus("REJECTED")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {busy === "REJECTED" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Reject
        </button>
      )}
      {status !== "PENDING" && (
        <button
          onClick={() => setStatus("PENDING")}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium transition-colors disabled:opacity-50"
        >
          Mark pending
        </button>
      )}
      <button
        onClick={remove}
        disabled={busy !== null}
        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {busy === "delete" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        Delete
      </button>
    </div>
  );
}
