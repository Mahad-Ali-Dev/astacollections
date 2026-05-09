"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

type Props = {
  endsAt: string | Date;
  title?: string;
  cta?: { label: string; href: string };
  variant?: "banner" | "compact";
};

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms / 3_600_000) % 24);
  const minutes = Math.floor((ms / 60_000) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds, expired: ms === 0 };
}

export function OfferTimer({
  endsAt,
  title = "Use code WELCOME10 for 10% off",
  cta = { label: "Shop Now", href: "/products" },
  variant = "banner",
}: Props) {
  const target = typeof endsAt === "string" ? new Date(endsAt).getTime() : endsAt.getTime();
  const [time, setTime] = useState(() => diff(target));

  useEffect(() => {
    const i = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(i);
  }, [target]);

  if (time.expired) return null;

  if (variant === "compact") {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-accent font-medium">
        <Clock className="h-3.5 w-3.5" />
        Sale ends in
        <span className="font-mono tabular-nums font-semibold">
          {String(time.days).padStart(2, "0")}d {String(time.hours).padStart(2, "0")}h {String(time.minutes).padStart(2, "0")}m {String(time.seconds).padStart(2, "0")}s
        </span>
      </span>
    );
  }

  return (
    <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50 border border-accent/30 rounded-2xl px-6 md:px-10 py-7 md:py-8 card-soft">
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-1">
            <Sparkles className="h-5 w-5" strokeWidth={1.6} />
          </div>
          <div>
            <p className="eyebrow-accent mb-1">Limited time offer</p>
            <p className="font-serif text-lg md:text-2xl text-balance leading-tight">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-5">
          <div className="flex items-center gap-2 md:gap-3">
            <TimeBox value={time.days} label="days" />
            <span className="text-accent text-xl">:</span>
            <TimeBox value={time.hours} label="hrs" />
            <span className="text-accent text-xl">:</span>
            <TimeBox value={time.minutes} label="min" />
            <span className="text-accent text-xl hidden md:inline">:</span>
            <TimeBox value={time.seconds} label="sec" hideOnMobile />
          </div>
          <Link
            href={cta.href}
            className="group hidden md:inline-flex items-center gap-2 bg-foreground text-background px-6 h-11 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors"
          >
            {cta.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function TimeBox({
  value,
  label,
  hideOnMobile,
}: {
  value: number;
  label: string;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={`bg-white border border-accent/20 rounded-xl px-2.5 md:px-4 py-2 md:py-3 min-w-[52px] md:min-w-[68px] text-center ${
        hideOnMobile ? "hidden md:block" : ""
      }`}
    >
      <div className="text-lg md:text-2xl font-serif font-semibold tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] mt-1 text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
