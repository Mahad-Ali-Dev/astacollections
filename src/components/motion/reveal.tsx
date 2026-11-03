"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Extra delay before the first child, in seconds. */
  delay?: number;
  /** Rise distance in px (capped at 16 so motion stays subtle). */
  y?: number;
  /** Kept for call-site compatibility; timing is fixed in CSS (450ms). */
  duration?: number;
  /** Seconds between children (capped by CSS after the 5th child). */
  stagger?: number;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Reveal: children fade in and rise ~14px when the block scrolls into view.
 *
 * Replaces a GSAP + ScrollTrigger version, so GSAP is no longer shipped to the
 * browser. How it stays safe:
 *  - The server HTML has no hidden state, so nothing above the fold waits on
 *    JavaScript (no flash, no LCP delay) and content shows if JS fails.
 *  - After mount, only blocks still BELOW the viewport switch to "out"
 *    (invisible until an IntersectionObserver flips them to "in").
 *  - Only opacity and the `translate` property animate (no layout shift, and
 *    `translate` composes with any Tailwind transform on the children).
 *  - prefers-reduced-motion: never hidden, never animated (globals.css).
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 14,
  stagger = 0.06,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "out" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already on screen
    setState("out");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = {
    "--reveal-y": `${Math.min(Math.abs(y), 16)}px`,
    "--reveal-delay": `${delay}s`,
    "--reveal-stagger": `${Math.min(stagger, 0.07)}s`,
  } as React.CSSProperties;

  return (
    // @ts-expect-error - generic dynamic tag
    <Tag ref={ref} className={className} data-reveal={state} style={style}>
      {children}
    </Tag>
  );
}
