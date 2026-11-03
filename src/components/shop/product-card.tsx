"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Heart, PlayCircle, Plus } from "lucide-react";
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
  /** Second photo, cross-faded in on hover (desktop). */
  hoverImage?: string | null;
  /** True when the product has options (e.g. ring size) that must be picked
   *  on the product page; quick-add then links there instead of adding a
   *  line the order route would reject for the missing option. */
  hasOptions?: boolean;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const discount = getDiscountPercent(product.price, product.comparePrice);
  const outOfStock = product.stock <= 0;
  const hasVideo = !!product.video;
  // Video takes the hover slot when there is one; otherwise the second photo.
  const hoverImage = !hasVideo ? product.hoverImage : null;
  const href = `/products/${product.slug}`;

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

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.hasOptions) {
      router.push(href);
      return;
    }
    add({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      sku: product.sku,
      stock: product.stock,
    });
    toast.success("Added to bag", { description: product.name });
  };

  return (
    <article className="group flex flex-col">
      <Link href={href} className="block">
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
              className={`object-cover transition-all duration-700 ease-out group-hover:scale-[1.06] ${
                hoverImage ? "[@media(hover:hover)]:group-hover:opacity-0" : ""
              }`}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
              No image
            </div>
          )}

          {/* Second photo: cross-fades in on hover-capable devices only */}
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              fill
              loading="lazy"
              sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
              className="hidden [@media(hover:hover)]:block object-cover opacity-0 scale-[1.03] transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100"
            />
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
            <span className="absolute top-3 left-3 bg-white/95 text-accent text-[10px] uppercase tracking-[0.16em] font-bold px-2.5 py-1.5 rounded-full shadow-sm">
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
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setWishlisted(!wishlisted);
              toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
            }}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            aria-pressed={wishlisted}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 active:scale-95 transition-all"
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

          {!outOfStock && (
            <>
              {/* Hover devices: slide-up bar. On touch screens an invisible bar
                  used to sit over the photo and add the item by accident. */}
              <button
                type="button"
                onClick={quickAdd}
                aria-label={product.hasOptions ? `Choose options for ${product.name}` : `Quick add ${product.name} to bag`}
                className="absolute bottom-3 left-3 right-3 bg-foreground text-background py-3 text-[11px] uppercase tracking-[0.2em] font-semibold rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 transition-all duration-400 ease-out hidden [@media(hover:hover)]:flex items-center justify-center gap-2 shadow-lg"
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                {product.hasOptions ? "Choose Size" : "Quick Add"}
              </button>
              {/* Touch screens: a visible round button, clearly separate from the photo tap. */}
              <button
                type="button"
                onClick={quickAdd}
                aria-label={product.hasOptions ? `Choose options for ${product.name}` : `Add ${product.name} to bag`}
                className="[@media(hover:hover)]:hidden absolute bottom-2.5 right-2.5 h-10 w-10 rounded-full bg-white/95 text-foreground shadow-md flex items-center justify-center active:scale-90 transition-transform"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
                {!product.hasOptions && (
                  <Plus className="absolute top-1.5 right-1.5 h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                )}
              </button>
            </>
          )}
        </div>
      </Link>

      <div className="mt-3.5 px-1 space-y-1.5">
        <Link href={href}>
          <h3 className="text-sm md:text-[15px] font-medium leading-snug line-clamp-2 hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline flex-wrap gap-x-2">
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
