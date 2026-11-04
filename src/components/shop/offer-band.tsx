"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";

/**
 * Full-width offer band for an active coupon. The countdown renders only when
 * the coupon has a real expiry set in Admin → Coupons; there is no rolling
 * "ends in 2 days" timer (the old one reset itself on every visit).
 */
export function OfferBand({
  code,
  headline,
  terms,
  expiresAt,
}: {
  code: string;
  headline: string;
  terms: string;
  /** ISO date from the coupon record, or null when the coupon has no expiry. */
  expiresAt: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked: the code is still readable on the chip.
    }
  };

  return (
    <section className="container">
      <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#3a2420_0%,#5f3b34_45%,#8a5a48_100%)] px-5 py-10 text-background sm:px-6 md:px-14 md:py-14">
        {/* gold-tone glow + hairline ring for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(233,190,150,0.45),transparent)]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.6rem] border border-white/10" />

        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[1.2fr_auto] md:gap-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-200">Welcome offer</p>
            <h2 className="mt-3 font-serif text-4xl leading-[1.05] text-balance md:text-6xl">{headline}</h2>
            <p className="mt-3 max-w-md text-sm text-background/75 md:text-base">{terms}</p>
            {expiresAt && <Countdown to={expiresAt} />}
          </div>

          <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row md:flex-col md:items-end">
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? `Code ${code} copied` : `Copy code ${code}`}
              className="group flex min-h-[64px] flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-rose-200/60 bg-white/10 px-4 py-3 backdrop-blur transition-colors hover:bg-white/15 sm:gap-4 sm:px-5 md:min-w-[280px]"
            >
              <span className="text-left">
                <span className="block text-[11px] uppercase tracking-[0.28em] text-background/60">Your code</span>
                <span className="block font-mono text-xl font-semibold tracking-[0.08em] min-[360px]:text-2xl sm:tracking-[0.14em]">{code}</span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                  copied ? "bg-emerald-400 text-emerald-950" : "bg-white text-foreground"
                }`}
                aria-live="polite"
              >
                {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
            <Link
              href="/products"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-rose-100"
            >
              Shop now
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Countdown({ to }: { to: string }) {
  const end = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // Server render and first paint show nothing, so there's no hydration mismatch.
  if (now === null || end <= now) return null;
  const s = Math.floor((end - now) / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: "Days" },
    { v: Math.floor((s % 86400) / 3600), l: "Hrs" },
    { v: Math.floor((s % 3600) / 60), l: "Min" },
    { v: s % 60, l: "Sec" },
  ];
  return (
    <div className="mt-6 flex items-end gap-2" aria-label="Offer ends in">
      {parts.map((p) => (
        <span key={p.l} className="min-w-[60px] rounded-xl bg-white/10 px-3 py-2 text-center">
          <span className="block font-serif text-3xl tabular-nums leading-none">{String(p.v).padStart(2, "0")}</span>
          <span className="mt-1 block text-[11px] uppercase tracking-[0.22em] text-background/60">{p.l}</span>
        </span>
      ))}
    </div>
  );
}
