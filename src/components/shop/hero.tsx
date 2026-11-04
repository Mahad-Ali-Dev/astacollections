"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  cta: { label: string; href: string };
  image: string;
};

// Used only when the admin hasn't set any slides. Describes the real
// catalogue (stainless steel, gold-tone and silver-tone).
const FALLBACK_SLIDES: HeroSlide[] = [
  {
    eyebrow: "Everyday stainless steel",
    title: "Made to wear,",
    titleAccent: "every day.",
    description:
      "Rings, pendant sets, studs and handcuffs in gold-tone and silver-tone stainless steel. Cash on delivery across Pakistan.",
    cta: { label: "Shop Jewellery", href: "/products" },
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1800&auto=format&fit=crop&q=85",
  },
];

export function Hero({ slides: slidesProp }: { slides?: HeroSlide[] }) {
  const slides = slidesProp && slidesProp.length > 0 ? slidesProp : FALLBACK_SLIDES;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const goTo = (i: number) => setActive(((i % slides.length) + slides.length) % slides.length);

  // Slide text enters with CSS keyframes (see tailwind `animate-fade-rise`),
  // restarted per slide by keying the text block. This used to be a GSAP
  // timeline: it hid the text until animation frames ran, so with JS slow to
  // start (or frames throttled) the headline sat invisible.

  const slide = slides[active];
  // Defensive href fallback — if the admin saved a blank CTA href, Next/Link with
  // href="" would just refresh the page. Always send the user somewhere useful.
  const primaryHref =
    slide.cta.href && slide.cta.href.trim().length > 0 ? slide.cta.href : "/products";

  return (
    <section
      className="relative overflow-hidden bg-foreground"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || slides.length <= 1) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) goTo(active + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== active}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Ken Burns: re-applying the animation class restarts the zoom each
                time a slide becomes active. Inactive slides rest at the end
                scale, so the reset happens while they're invisible (no remount,
                no image reload, no jump during the cross-fade). */}
            <Image
              src={s.image}
              alt=""
              fill
              priority={i === 0}
              // On phones the wide photo is cropped to a tall frame, so it renders
              // about 2.5 screen widths wide and needs that many pixels to stay sharp.
              sizes="(max-width:768px) 260vw, 100vw"
              className={`object-cover ${
                i === active ? "animate-kenburns motion-reduce:animate-none" : "scale-[1.08] motion-reduce:scale-100"
              }`}
            />
          </div>
        ))}
        {/* Shade only behind the text (below it on phones, left of it on desktop)
            so the jewellery keeps its true colour. */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 from-10% via-foreground/50 via-55% to-transparent to-80% md:bg-gradient-to-r md:from-foreground/75 md:from-0% md:via-foreground/30 md:via-40% md:to-transparent md:to-70%" />
        <div className="absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-foreground/40 to-transparent md:block" />
      </div>

      <div className="container relative flex min-h-[560px] items-end pb-20 pt-16 md:min-h-[600px] md:items-center md:py-24 lg:min-h-[calc(100svh-11rem)]">
        <div key={active} className="w-full max-w-xl space-y-4 text-background [text-shadow:0_1px_12px_rgba(20,12,8,0.5)] md:space-y-6 md:[text-shadow:none]">
          <p className="animate-fade-rise motion-reduce:animate-none inline-flex items-center gap-2 sm:gap-3 text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.32em] text-white md:text-rose-200 font-medium">
            <span className="h-px w-6 sm:w-8 bg-rose-300" />
            {slide.eyebrow}
          </p>

          {/* h2, not h1: slide titles rotate and are campaign copy. The home
              page carries one stable, descriptive H1 below the hero. */}
          <h2 className="font-serif text-[2.6rem] leading-[1.02] text-balance sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
            {/* No overflow masks: the lines fade and rise whole, so italics and
                descenders are never cut off mid-animation. */}
            <span className="block animate-fade-rise [animation-delay:120ms] motion-reduce:animate-none">{slide.title}</span>
            <span className="block italic font-light text-rose-200 pb-1 animate-fade-rise [animation-delay:240ms] motion-reduce:animate-none">
              {slide.titleAccent}
            </span>
          </h2>

          <p className="animate-fade-rise [animation-delay:380ms] motion-reduce:animate-none max-w-md text-sm leading-relaxed text-background/90 md:text-lg">
            {slide.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={primaryHref}
              className="press animate-fade-rise [animation-delay:500ms] motion-reduce:animate-none group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 [text-shadow:none] text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {slide.cta.label || "Shop Now"}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/products"
              className="press animate-fade-rise [animation-delay:560ms] motion-reduce:animate-none inline-flex h-12 items-center gap-2 rounded-full border border-background/50 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-background/10"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 md:bottom-8">
          <div className="container flex items-center gap-6">
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === active ? "true" : undefined}
                  // The visible bar is thin; the button itself is a 44px-tall
                  // target so it can actually be tapped.
                  className="group/dot flex h-11 items-center"
                >
                  <span
                    className={`block h-0.5 overflow-hidden rounded-full transition-all duration-500 ${
                      i === active ? "w-12 bg-background/35 md:w-16" : "w-6 bg-background/40 group-hover/dot:bg-background/70 md:w-9"
                    }`}
                  >
                    {/* The filling bar is the slide timer: when it ends the next
                        slide shows, so pausing it (hover, focus) pauses the slider
                        and with reduced motion nothing advances on its own. */}
                    {i === active && (
                      <span
                        key={active}
                        className="block h-full origin-left animate-hero-progress bg-rose-300 motion-reduce:animate-none"
                        style={{ animationPlayState: paused ? "paused" : "running" }}
                        onAnimationEnd={() => goTo(active + 1)}
                      />
                    )}
                  </span>
                </button>
              ))}
              <span className="ml-3 text-[11px] uppercase tracking-[0.3em] text-background/80 font-mono">
                {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>

            {/* Beside the counter: the WhatsApp button owns the bottom-right corner.
                Phones swipe instead. */}
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Previous slide"
                className="w-11 h-11 rounded-full border border-background/50 text-background hover:bg-white hover:text-foreground hover:border-white transition-all flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                aria-label="Next slide"
                className="w-11 h-11 rounded-full border border-background/50 text-background hover:bg-white hover:text-foreground hover:border-white transition-all flex items-center justify-center"
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
