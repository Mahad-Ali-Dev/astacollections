"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
  once?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * Reveal: fades + slides children up when scrolled into view.
 * Supports stagger when multiple children are passed.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  duration = 0.9,
  stagger = 0.07,
  once = true,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = el.children.length > 1 ? gsap.utils.toArray<HTMLElement>(el.children) : el;

      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: once ? "play none none none" : "play none none reverse",
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    // @ts-expect-error - generic dynamic tag
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
};

/** Scrub-based vertical parallax. Speed positive moves up faster, negative slower/reverse. */
export function Parallax({ children, className = "", speed = 0.3 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.to(el, {
        yPercent: -speed * 30,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * RevealLines: split a heading into lines wrapped in spans and reveal each from below.
 * Pass each line as a child element.
 */
export function RevealLines({
  children,
  className = "",
  delay = 0,
  duration = 1,
  stagger = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const lines = gsap.utils.toArray<HTMLElement>(".reveal-line-inner", el);
      gsap.set(lines, { yPercent: 110 });
      gsap.to(lines, {
        yPercent: 0,
        duration,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Wrap each child of a string in line containers — used inside <RevealLines> */
export function Line({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`overflow-hidden block ${className}`}>
      <span className="reveal-line-inner inline-block">{children}</span>
    </span>
  );
}

/**
 * ImageReveal: clip-path mask reveal triggered by scroll.
 */
export function ImageReveal({
  children,
  className = "",
  duration = 1.4,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.fromTo(
        el,
        { clipPath: "inset(0 0 100% 0)" },
        {
          clipPath: "inset(0 0 0% 0)",
          duration,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        }
      );
      const img = el.querySelector("img");
      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.15 },
          {
            scale: 1,
            duration: duration * 1.2,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          }
        );
      }
    },
    { scope: ref }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Animates a number from 0 to value when entering viewport */
export function CountUp({
  value,
  className = "",
  prefix = "",
  suffix = "",
  duration = 1.6,
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const counter = { v: 0 };
      gsap.to(counter, {
        v: value,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(counter.v).toLocaleString()}${suffix}`;
        },
      });
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
