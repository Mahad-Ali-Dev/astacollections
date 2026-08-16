"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import type { VideoCarouselItem } from "@/lib/settings";

/**
 * Horizontally scrolling strip of short product clips.
 *
 * Autoplay only works when muted, so every clip starts muted and the viewer
 * can unmute one at a time (unmuting a clip mutes the others — two videos
 * talking over each other is worse than none). Clips only play while on
 * screen, so a strip of ten videos doesn't saturate a mobile connection.
 */
export function VideoCarousel({
  items,
  title,
  subtitle,
}: {
  items: VideoCarouselItem[];
  title?: string;
  subtitle?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [unmutedIndex, setUnmutedIndex] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    syncArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    return () => {
      el.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [syncArrows]);

  // Play only what's visible. Saves bandwidth and stops ten clips decoding at once.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {
              /* autoplay refused — poster stays, nothing to do */
            });
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.5 }
    );
    for (const v of videoRefs.current) if (v) observer.observe(v);
    return () => observer.disconnect();
  }, [items.length]);

  function scrollByCard(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-video-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  function toggleSound(index: number) {
    setUnmutedIndex((current) => (current === index ? null : index));
  }

  if (items.length === 0) return null;

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {title && (
              <h2 className="font-serif text-3xl md:text-4xl text-foreground">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous videos"
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-border/60 items-center justify-center hover:bg-secondary transition"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="More videos"
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border border-border/60 items-center justify-center hover:bg-secondary transition"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, i) => {
              const muted = unmutedIndex !== i;
              const card = (
                <>
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    src={item.url}
                    poster={item.poster || undefined}
                    muted={muted}
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSound(i);
                    }}
                    aria-label={muted ? "Unmute video" : "Mute video"}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition"
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pr-14">
                      <p className="text-white text-sm leading-snug line-clamp-2">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </>
              );

              const cardClass =
                "relative shrink-0 snap-start w-[230px] md:w-[270px] aspect-[9/16] rounded-2xl overflow-hidden bg-secondary border border-border/60";

              return item.href ? (
                <Link key={i} href={item.href} data-video-card className={cardClass}>
                  {card}
                </Link>
              ) : (
                <div key={i} data-video-card className={cardClass}>
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
