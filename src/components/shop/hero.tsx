"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  cta: { label: string; href: string };
  image: string;
};

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    eyebrow: "Spring 2026 · The Pearl Edit",
    title: "Pearls,",
    titleAccent: "reimagined.",
    description:
      "Lustrous freshwater pearls hand-set on contemporary forms — from minimal studs to statement chokers.",
    cta: { label: "Shop Pearls", href: "/products?q=pearl" },
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1800&auto=format&fit=crop&q=85",
  },
];

export function Hero({ slides: slidesProp }: { slides?: HeroSlide[] }) {
  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : FALLBACK_SLIDES;
  const [active, setActive] = useState(0);
  const root = useRef<HTMLElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActive((a) => (a + 1) % slides.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  const goTo = (i: number) => {
    setActive(((i % slides.length) + slides.length) % slides.length);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setActive((a) => (a + 1) % slides.length);
      }, 6000);
    }
  };

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        ".hero-slide-eyebrow",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6 }
      )
        .fromTo(
          ".hero-slide-title-line",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.95, stagger: 0.1 },
          "-=0.3"
        )
        .fromTo(
          ".hero-slide-sub",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.5"
        )
        .fromTo(
          ".hero-slide-cta",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
          "-=0.4"
        );
    },
    { scope: root, dependencies: [active] }
  );

  const slide = slides[active];

  return (
    <section ref={root} className="relative overflow-hidden bg-foreground">
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.image}
              alt={s.title}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-foreground/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-foreground/20" />
      </div>

      <div className="container relative min-h-[560px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[820px] flex items-center py-16 sm:py-20 md:py-24">
        <div className="max-w-2xl text-background space-y-5 sm:space-y-7 w-full">
          <p className="hero-slide-eyebrow inline-flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.32em] text-rose-200 font-medium">
            <span className="h-px w-6 sm:w-8 bg-rose-300" />
            {slide.eyebrow}
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[7.5rem] leading-[0.98] text-balance">
            <span className="block overflow-hidden">
              <span className="hero-slide-title-line inline-block">{slide.title}</span>
            </span>
            <span className="block overflow-hidden">
              <span className="hero-slide-title-line inline-block italic font-light text-rose-200">
                {slide.titleAccent}
              </span>
            </span>
          </h1>

          <p className="hero-slide-sub text-base md:text-lg text-background/85 max-w-md leading-relaxed">
            {slide.description}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={slide.cta.href}
              className="hero-slide-cta group inline-flex items-center gap-2 bg-white text-foreground px-7 h-13 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent hover:text-accent-foreground transition-all"
            >
              {slide.cta.label}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/products"
              className="hero-slide-cta inline-flex items-center gap-2 px-6 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold border border-background/40 text-background hover:bg-background/10 transition-colors"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 md:bottom-10 left-0 right-0 z-10">
          <div className="container flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-px transition-all duration-500 ${
                    i === active ? "w-12 md:w-16 bg-rose-300" : "w-6 md:w-9 bg-background/40 hover:bg-background/70"
                  }`}
                />
              ))}
              <span className="ml-3 text-[11px] uppercase tracking-[0.3em] text-background/70 font-mono">
                {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => goTo(active - 1)}
                aria-label="Previous slide"
                className="w-11 h-11 rounded-full border border-background/40 text-background hover:bg-white hover:text-foreground hover:border-white transition-all flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => goTo(active + 1)}
                aria-label="Next slide"
                className="w-11 h-11 rounded-full border border-background/40 text-background hover:bg-white hover:text-foreground hover:border-white transition-all flex items-center justify-center"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
