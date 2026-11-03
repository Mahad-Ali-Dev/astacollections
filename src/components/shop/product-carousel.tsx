"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "./product-card";

/**
 * Swipe carousel: native scroll-snap (momentum on phones), a peek of the
 * next card, dots on phones, arrow buttons on desktop.
 */
export function ProductCarousel({ products }: { products: ProductCardData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const step = () => {
    const el = ref.current;
    const card = el?.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + 16 : 280;
  };
  const scroll = (dir: -1 | 1) => ref.current?.scrollBy({ left: step() * dir, behavior: "smooth" });
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setActive(Math.min(products.length - 1, Math.round(el.scrollLeft / step())));
  };
  const dots = Math.min(products.length, 10);

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 md:mx-0 md:gap-6 md:scroll-px-0 md:px-0"
      >
        {products.map((p) => (
          <div key={p.id} className="w-[64vw] max-w-[300px] shrink-0 snap-start sm:w-[42vw] md:w-[31%] md:max-w-none lg:w-[23.5%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <div className="mt-5 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === Math.min(active, dots - 1) ? "w-5 bg-foreground" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute -left-4 top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-background shadow-lg transition hover:border-accent hover:bg-accent hover:text-accent-foreground md:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute -right-4 top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border bg-background shadow-lg transition hover:border-accent hover:bg-accent hover:text-accent-foreground md:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
