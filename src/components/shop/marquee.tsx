"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const FALLBACK_PHRASES = [
  "Free shipping above Rs. 5,000",
  "Cash on Delivery",
  "Bank transfer accepted",
  "Handcrafted in Pakistan",
  "7-day easy returns",
  "Hypoallergenic materials",
  "Hand-inspected before shipping",
];

export function Marquee({ phrases }: { phrases?: string[] } = {}) {
  const list = phrases && phrases.length > 0 ? phrases : FALLBACK_PHRASES;
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current?.querySelector(".marquee-track");
      if (!el) return;
      const half = (el as HTMLElement).scrollWidth / 2;
      gsap.to(el, {
        x: -half,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className="bg-foreground text-background py-4 overflow-hidden">
      <div className="marquee-track flex whitespace-nowrap items-center">
        {[...list, ...list].map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-6 px-6 text-[10px] uppercase tracking-[0.32em] font-medium text-background/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}
