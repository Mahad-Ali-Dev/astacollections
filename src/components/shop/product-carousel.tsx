"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";

export function ProductCarousel({ products }: { products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const offset = card ? card.offsetWidth + 24 : 320; // card width + gap
    el.scrollBy({ left: offset * dir, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        className="no-scrollbar flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 md:-mx-0 md:px-0"
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="snap-start shrink-0 w-[68vw] sm:w-[44vw] md:w-[33vw] lg:w-[24%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Desktop scroll buttons */}
      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="hidden md:flex absolute -left-4 top-[40%] -translate-y-1/2 bg-background border shadow-lg rounded-full w-10 h-10 items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition z-10"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="hidden md:flex absolute -right-4 top-[40%] -translate-y-1/2 bg-background border shadow-lg rounded-full w-10 h-10 items-center justify-center hover:bg-accent hover:text-accent-foreground hover:border-accent transition z-10"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
