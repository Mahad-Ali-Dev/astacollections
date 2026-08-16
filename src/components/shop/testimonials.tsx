"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

export type Testimonial = {
  name: string;
  role: string;
  quote: string;
  product: string;
};

export function Testimonials({ reviews = [] }: { reviews?: Testimonial[] }) {
  const [i, setI] = useState(0);
  const count = reviews.length;

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  const prev = () => setI((x) => (x - 1 + count) % count);
  const next = () => setI((x) => (x + 1) % count);

  // Nothing to show is better than placeholder people — an invented
  // testimonial next to a real review section reads as fake.
  if (count === 0) return null;

  const r = reviews[Math.min(i, count - 1)];

  return (
    <section className="container py-24 md:py-32 max-w-4xl">
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, k) => (
              <Star key={k} className="h-3.5 w-3.5 fill-accent text-accent" />
            ))}
          </div>
          <p className="eyebrow">4.9 from 1,200+ reviews</p>
        </div>

        <blockquote className="relative min-h-[180px] md:min-h-[160px]">
          <p
            key={i}
            className="font-serif italic text-2xl md:text-4xl text-balance leading-tight md:leading-[1.15] animate-in fade-in slide-in-from-bottom-3 duration-700"
          >
            &ldquo;{r.quote}&rdquo;
          </p>
        </blockquote>

        <div
          key={`meta-${i}`}
          className="space-y-1 animate-in fade-in duration-1000 delay-300"
        >
          <p className="font-medium text-sm">
            {r.name} <span className="text-muted-foreground">— {r.role}</span>
          </p>
          <p className="eyebrow">{r.product}</p>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={prev}
            aria-label="Previous review"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            {reviews.map((_, k) => (
              <button
                key={k}
                onClick={() => setI(k)}
                aria-label={`Go to review ${k + 1}`}
                className={`h-px transition-all duration-500 ${
                  i === k ? "w-10 bg-foreground" : "w-5 bg-border"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Next review"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
