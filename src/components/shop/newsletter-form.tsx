"use client";

import { useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

/** Footer sign-up. Posts to /api/newsletter (the old footer form did nothing). */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "FOOTER" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-800" role="status">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
        You&apos;re on the list. Watch your inbox for new arrivals.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md" noValidate>
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>
      <div className="flex h-14 items-center overflow-hidden rounded-full border border-border bg-white transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        <input
          id="footer-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder="Your email address"
          className="h-full min-w-0 flex-1 bg-transparent px-5 text-base placeholder:text-muted-foreground focus:outline-none md:text-sm"
          aria-invalid={state === "error"}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="press mr-1.5 flex h-11 items-center gap-1.5 rounded-full bg-foreground px-5 text-xs font-semibold uppercase tracking-[0.18em] text-background transition-colors hover:bg-accent disabled:opacity-60"
        >
          {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Join"}
          {state !== "sending" && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-xs text-destructive">Please enter a valid email address.</p>}
    </form>
  );
}
