"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { ShoppingBag, Heart, PlayCircle } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  sku: string;
  stock: number;
  image?: string;
  /** Optional product video URL (mp4/webm). Plays muted on hover, falls back to image. */
  video?: string | null;
  /** Optional poster image for the video (defaults to `image`). */
  videoPoster?: string | null;
  isFeatured?: boolean;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const add = useCart((s) => s.add);
  const [wishlisted, setWishlisted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const discount = getDiscountPercent(product.price, product.comparePrice);
  const outOfStock = product.stock <= 0;
  const hasVideo = !!product.video;

  // Hover-to-play (desktop). Mobile users tap through to the detail page where
  // the video plays in the gallery.
  const handleMouseEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    // play() returns a promise on modern browsers; swallow autoplay rejections silently
    v.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <article className="group flex flex-col">
      <Link href={`/products/${product.slug}`} className="block">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary/60 card-soft card-hover"
          onMouseEnter={hasVideo ? handleMouseEnter : undefined}
          onMouseLeave={hasVideo ? handleMouseLeave : undefined}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
              No image
            </div>
          )}

          {/* Hover video — fades over the image on desktop hover */}
          {hasVideo && (
            <video
              ref={videoRef}
              src={product.video!}
              poster={product.videoPoster ?? product.image}
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedData={() => setVideoReady(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
                videoReady ? "opacity-0 group-hover:opacity-100" : "opacity-0"
              }`}
              aria-hidden="true"
            />
          )}

          {/* Small "Video" badge so customers know there's a clip available */}
          {hasVideo && !outOfStock && (
            <span className="absolute bottom-3 left-3 bg-foreground/85 text-background text-[10px] uppercase tracking-[0.18em] font-semibold px-2.5 py-1 rounded-full backdrop-blur flex items-center gap-1 group-hover:opacity-0 transition-opacity">
              <PlayCircle className="h-3 w-3" strokeWidth={2} />
              Video
            </span>
          )}

          {/* Top-left badge */}
          {discount > 0 && !outOfStock && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] uppercase tracking-[0.18em] font-bold px-3 py-1.5 rounded-full">
              −{discount}%
            </span>
          )}
          {product.isFeatured && !discount && !outOfStock && (
            <span className="absolute top-3 left-3 bg-foreground text-background text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5 rounded-full">
              Bestseller
            </span>
          )}

          {/* Wishlist heart */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setWishlisted(!wishlisted);
              toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
            }}
            aria-label="Wishlist"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                wishlisted ? "fill-accent text-accent" : "text-foreground"
              }`}
              strokeWidth={1.6}
            />
          </button>

          {outOfStock && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[11px] uppercase tracking-[0.32em] text-foreground bg-white px-4 py-2 rounded-full shadow-sm">
                Sold Out
              </span>
            </div>
          )}

          {/* Quick add — slides up */}
          {!outOfStock && (
            <button
              onClick={(e) => {
                e.preventDefault();
                add({
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  image: product.image,
                  sku: product.sku,
                  stock: product.stock,
                });
                toast.success("Added to bag");
              }}
              className="absolute bottom-3 left-3 right-3 bg-foreground text-background py-3 text-[11px] uppercase tracking-[0.2em] font-semibold rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 ease-out flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Quick Add
            </button>
          )}
        </div>
      </Link>

      <div className="mt-4 px-1 space-y-1.5">
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm md:text-[15px] font-medium line-clamp-1 hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-sm md:text-[15px] font-semibold tabular-nums">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
