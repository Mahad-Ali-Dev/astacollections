"use client";

import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/api/customer/logout", { method: "POST" });
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-border text-xs uppercase tracking-[0.2em] font-semibold hover:border-destructive hover:text-destructive transition-colors"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      Sign out
    </button>
  );
}
