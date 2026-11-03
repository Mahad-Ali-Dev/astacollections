"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCcw,
  ZoomIn,
  X,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  Check,
  Award,
  Sparkles,
  Package,
  Play,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BundleSection, type BundleData } from "./bundle-section";
import {
  ProductAttributePicker,
  computeAttributesPriceModifier,
  missingRequiredSelections,
  selectedVariantStock,
  type ProductAttribute,
} from "./product-attribute-picker";
import { useCart } from "@/lib/cart-store";
import { track } from "@/lib/fbpixel";
import { formatPrice, getDiscountPercent } from "@/lib/utils";
import { SITE } from "@/lib/seo";
import { prettyTag } from "@/lib/tags";
import { toast } from "sonner";
import { OPEN_WHATSAPP_EVENT } from "./whatsapp-widget";
import { Stars } from "./reviews-section";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc?: string | null;
  sku: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  material?: string | null;
  weight?: number | null;
  isFeatured: boolean;
  images: { url: string; alt?: string | null }[];
  videoUrl?: string | null;
  videoPoster?: string | null;
  category: { name: string; slug: string };
  tagsList: string[];
  attributes?: ProductAttribute[];
};

export function ProductDetail({
  product,
  bundle,
  shippingFee = 0,
  freeShippingThreshold = 0,
  avgRating = 0,
  reviewCount = 0,
  codAdvance = 0,
  categoryLabel,
}: {
  product: Product;
  bundle?: BundleData | null;
  /** Flat delivery charge applied below the free-shipping threshold. */
  shippingFee?: number;
  /** Order value at or above which delivery is free. 0 disables the threshold. */
  freeShippingThreshold?: number;
  /** Mean of this product's approved review ratings. */
  avgRating?: number;
  /** Number of approved reviews. The rating block is hidden when this is 0. */
  reviewCount?: number;
  /** Advance collected before dispatch. 0 means pure cash on delivery. */
  codAdvance?: number;
  /** Display name for the collection (DB names can be slugs like "couple-rings"). */
  categoryLabel?: string;
}) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "details" | "shipping" | "care">(
    "description"
  );
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const add = useCart((s) => s.add);
  const open = useCart((s) => s.open);

  const discount = getDiscountPercent(product.price, product.comparePrice);
  // outOfStock is recomputed further down once we know the selected variant's stock.

  // Unified gallery: optional video first, then images. activeImg indexes here.
  type MediaItem =
    | { type: "video"; url: string; poster?: string | null }
    | { type: "image"; url: string; alt?: string | null };
  const media: MediaItem[] = [
    ...(product.videoUrl
      ? ([
          {
            type: "video" as const,
            url: product.videoUrl,
            poster: product.videoPoster ?? product.images[0]?.url,
          },
        ] as MediaItem[])
      : []),
    ...product.images.map((i) => ({
      type: "image" as const,
      url: i.url,
      alt: i.alt,
    })),
  ];
  const hasMultiple = media.length > 1;
  const currentMedia = media[activeImg] ?? media[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  const attrs = product.attributes ?? [];
  const priceMod = computeAttributesPriceModifier(attrs, selectedAttrs);
  const effectivePrice = product.price + priceMod;

  // Per-variant stock: if the selected option has a stock value, it caps the order.
  // Otherwise we defer to the product-level stock.
  const variantStock = selectedVariantStock(attrs, selectedAttrs);
  const effectiveStock =
    variantStock === null ? product.stock : Math.min(product.stock, variantStock);
  const variantSoldOut = variantStock !== null && variantStock <= 0;
  const outOfStock = effectiveStock <= 0;

  // If the user changes variant such that current qty > new stock, clamp down.
  useEffect(() => {
    if (effectiveStock > 0 && qty > effectiveStock) {
      setQty(effectiveStock);
    }
  }, [effectiveStock, qty]);

  // Meta Pixel: ViewContent when a product page is opened.
  useEffect(() => {
    track("ViewContent", {
      content_type: "product",
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category.name,
      value: product.price,
      currency: "PKR",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleAdd = () => {
    const missing = missingRequiredSelections(attrs, selectedAttrs);
    if (missing.length > 0) {
      toast.error(`Please select: ${missing.join(", ")}`);
      return;
    }
    if (variantSoldOut) {
      toast.error("That variant is out of stock. Please pick another option.");
      return;
    }
    if (variantStock !== null && qty > variantStock) {
      toast.error(`Only ${variantStock} of that variant available.`);
      return;
    }
    add(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: effectivePrice,
        image: product.images[0]?.url,
        sku: product.sku,
        stock: effectiveStock,
      },
      qty,
      Object.keys(selectedAttrs).length > 0 ? selectedAttrs : undefined
    );
    // AddToCart is tracked centrally in the cart store (useCart.add).
    toast.success(`${qty} × ${product.name} added`);
    open();
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.shortDesc ?? "", url });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const goImg = (dir: -1 | 1) => {
    if (media.length === 0) return;
    // Pause the inline video when navigating away from it
    if (currentMedia?.type === "video") videoRef.current?.pause();
    setActiveImg((i) => (i + dir + media.length) % media.length);
  };

  // Delivery window: dispatch in 1-2 business days + 3-5 days in transit
  // (the terms on /shipping), shown as calendar dates. Approximate on purpose.
  const fmtDay = (d: Date) => d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" });
  const arriveFrom = new Date();
  arriveFrom.setDate(arriveFrom.getDate() + 4);
  const arriveTo = new Date();
  arriveTo.setDate(arriveTo.getDate() + 7);

  // Delivery is free either when no fee is configured, or when this line's
  // value already clears the threshold. Recomputed as qty changes so the
  // badge never promises free delivery the customer won't actually get.
  const lineTotal = product.price * qty;
  const qualifiesForFreeShipping =
    shippingFee <= 0 || (freeShippingThreshold > 0 && lineTotal >= freeShippingThreshold);
  const saving = product.comparePrice && product.comparePrice > product.price ? product.comparePrice - product.price : 0;

  // Gallery: swipe track on phones keeps `activeImg` in sync with the dots.
  const trackRef = useRef<HTMLDivElement>(null);
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== activeImg) setActiveImg(i);
  };
  const showMedia = (i: number) => {
    if (currentMedia?.type === "video") videoRef.current?.pause();
    setActiveImg(i);
    const el = trackRef.current;
    if (el && el.offsetParent !== null) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  // Desktop hover zoom follows the cursor.
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null);

  const whatsappHref = `${SITE.social.whatsapp}?text=${encodeURIComponent(
    `Hi! I'd like to order: ${product.name} (${formatPrice(effectivePrice)}) ${SITE.url}/products/${product.slug}`
  )}`;
  const shownTags = product.tagsList.slice(0, 4);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        {/* GALLERY: sticky on desktop */}
        <div className="min-w-0 lg:col-span-7 lg:sticky lg:top-28 lg:self-start">
          {/* Phones: swipeable track with dots */}
          <div className="md:hidden">
            <div className="relative -mx-4">
              <div
                ref={trackRef}
                onScroll={onTrackScroll}
                className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
                aria-label={`${product.name} photos`}
              >
                {media.map((m, i) => (
                  <div key={i} className="relative aspect-square w-full shrink-0 snap-center bg-secondary/60">
                    <div className="absolute inset-0 shimmer" aria-hidden="true" />
                    {m.type === "video" ? (
                      <video
                        ref={i === activeImg ? videoRef : undefined}
                        src={m.url}
                        poster={m.poster ?? undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 h-full w-full object-cover bg-black"
                      />
                    ) : (
                      <button type="button" onClick={() => { setActiveImg(i); setZoomOpen(true); }} className="absolute inset-0" aria-label="Open full-screen photo">
                        <Image
                          src={m.url}
                          alt={m.alt || product.name}
                          fill
                          sizes="100vw"
                          priority={i === 0}
                          className="object-cover"
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <GalleryBadges discount={discount} featured={product.isFeatured} />
            </div>
            {hasMultiple && (
              <>
                <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                  {media.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-5 bg-foreground" : "w-1.5 bg-border"}`} />
                  ))}
                </div>
                <Thumbs media={media} active={activeImg} onPick={showMedia} className="mt-3 grid grid-cols-5 gap-2" />
              </>
            )}
          </div>

          {/* Tablets / desktop: thumbnails + large main image with hover zoom */}
          <div className="hidden gap-4 md:grid md:grid-cols-[76px_1fr]">
            {hasMultiple ? (
              <Thumbs media={media} active={activeImg} onPick={showMedia} className="no-scrollbar flex max-h-[680px] flex-col gap-2.5 overflow-y-auto" />
            ) : (
              <span />
            )}
            <div
              className={`group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-secondary/60 ${!hasMultiple ? "col-start-1 col-span-2" : ""}`}
              onMouseMove={(e) => {
                if (currentMedia?.type !== "image") return;
                const r = e.currentTarget.getBoundingClientRect();
                setZoomOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              }}
              onMouseLeave={() => setZoomOrigin(null)}
            >
              <div className="absolute inset-0 shimmer" aria-hidden="true" />
              {currentMedia ? (
                currentMedia.type === "video" ? (
                  <video
                    ref={videoRef}
                    key={currentMedia.url}
                    src={currentMedia.url}
                    poster={currentMedia.poster ?? undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 h-full w-full object-cover bg-black"
                  />
                ) : (
                  <button type="button" onClick={() => setZoomOpen(true)} className="absolute inset-0 cursor-zoom-in" aria-label="Open full-screen photo">
                    <Image
                      src={currentMedia.url}
                      alt={currentMedia.alt || product.name}
                      fill
                      sizes="(max-width: 1024px) 90vw, 55vw"
                      priority
                      className="object-cover transition-transform duration-300 ease-out motion-reduce:transition-none"
                      style={zoomOrigin ? { transform: "scale(1.8)", transformOrigin: zoomOrigin } : undefined}
                    />
                  </button>
                )
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
              )}
              <GalleryBadges discount={discount} featured={product.isFeatured} />
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={() => goImg(-1)}
                    aria-label="Previous photo"
                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2.5 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goImg(1)}
                    aria-label="Next photo"
                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2.5 opacity-0 shadow transition group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {currentMedia?.type === "image" && (
                <span className="pointer-events-none absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium shadow-sm transition-opacity group-hover:opacity-0">
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" /> Hover to zoom
                </span>
              )}
            </div>
          </div>
        </div>

        {/* INFO */}
        <div className="min-w-0 pb-28 md:pb-0 lg:col-span-5">
          <Link
            href={`/category/${product.category.slug}`}
            className="eyebrow-accent inline-flex items-center gap-2 hover:underline"
          >
            <span className="h-px w-6 bg-accent" aria-hidden="true" />
            {categoryLabel ?? product.category.name}
          </Link>
          <h1 className="mt-3 font-serif text-[2rem] leading-[1.08] tracking-tight text-balance md:text-[2.6rem]">
            {product.name}
          </h1>

          {/* This product's own rating only (never the store total) */}
          {reviewCount > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm hover:text-accent">
              <Stars rating={avgRating} className="h-4 w-4" />
              <span className="underline-offset-4 hover:underline">
                {avgRating.toFixed(1)} · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </a>
          )}

          {/* PRICE */}
          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className="text-3xl font-semibold tabular-nums md:text-4xl">{formatPrice(effectivePrice)}</span>
            {saving > 0 && (
              <>
                <span className="text-lg tabular-nums text-muted-foreground line-through">{formatPrice(product.comparePrice)}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  You save {formatPrice(saving)} ({discount}%)
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          {/* Stock: from the real stock count */}
          <p className="mt-4 flex items-center gap-2 text-sm">
            {outOfStock ? (
              <>
                <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
                <span className="font-medium text-destructive">{variantSoldOut ? "Selected option is sold out" : "Sold out"}</span>
              </>
            ) : effectiveStock < 5 ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-600" aria-hidden="true" />
                <span className="font-medium text-amber-800">Only {effectiveStock} left in stock</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                <span className="font-medium text-emerald-800">In stock, ready to ship</span>
              </>
            )}
          </p>

          {product.shortDesc && (
            <p className="mt-5 leading-relaxed text-muted-foreground text-pretty">{product.shortDesc}</p>
          )}

          <div className="mt-7 space-y-5 border-t border-border/70 pt-7">
            {attrs.length > 0 && (
              <ProductAttributePicker attributes={attrs} selected={selectedAttrs} onChange={setSelectedAttrs} />
            )}

            {!outOfStock ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 shrink-0 items-center rounded-full border border-border bg-card">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="h-full px-4 transition-colors hover:text-accent disabled:opacity-30"
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2.5rem] text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(Math.min(effectiveStock, qty + 1))}
                      className="h-full px-4 transition-colors hover:text-accent disabled:opacity-30"
                      disabled={qty >= effectiveStock}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWishlisted(!wishlisted)}
                    aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                    aria-pressed={wishlisted}
                    className="ml-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border transition hover:border-accent"
                  >
                    <Heart className={`h-5 w-5 transition-colors ${wishlisted ? "fill-accent text-accent" : ""}`} strokeWidth={1.6} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground text-xs font-semibold uppercase tracking-[0.2em] text-background transition-all hover:bg-accent gold-button-glow"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Add to bag · {formatPrice(effectivePrice * qty)}
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald-700/30 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 transition-colors hover:bg-emerald-50"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Order on WhatsApp
                </a>
              </>
            ) : (
              <Button size="xl" disabled className="h-14 w-full rounded-full">
                Sold out
              </Button>
            )}

            {/* Delivery estimate + compact trust row */}
            <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
              <p className="flex items-start gap-2.5">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span>
                  Order today, usually arrives <strong className="font-semibold">{fmtDay(arriveFrom)} – {fmtDay(arriveTo)}</strong>.{" "}
                  <span className="text-muted-foreground">
                    {qualifiesForFreeShipping
                      ? "Free delivery."
                      : `${formatPrice(shippingFee)} delivery, free over ${formatPrice(freeShippingThreshold)}.`}
                  </span>
                </span>
              </p>
              <ul className="mt-3 grid grid-cols-3 divide-x divide-border/80 border-t border-border/70 pt-3 text-center text-[11px] leading-tight">
                <li className="px-1">
                  <Package className="mx-auto mb-1 h-4 w-4 text-accent" aria-hidden="true" />
                  {codAdvance > 0 ? `COD (${formatPrice(codAdvance)} advance)` : "Cash on delivery"}
                </li>
                <li className="px-1">
                  <RefreshCcw className="mx-auto mb-1 h-4 w-4 text-accent" aria-hidden="true" />
                  7-day returns
                </li>
                <li className="px-1">
                  <MessageCircle className="mx-auto mb-1 h-4 w-4 text-accent" aria-hidden="true" />
                  WhatsApp help
                </li>
              </ul>
            </div>

            {bundle && bundle.items.length >= 2 && <BundleSection bundle={bundle} currentProductId={product.id} />}

            {/* ACCORDIONS */}
            <div className="divide-y divide-border/70 border-y border-border/70">
              <Accordion title="Description" defaultOpen>
                <p className="whitespace-pre-line text-pretty">{product.description}</p>
              </Accordion>
              <Accordion title="Details">
                <ul className="space-y-2.5">
                  {product.material && <DetailLine label="Material" value={product.material} />}
                  {product.weight ? <DetailLine label="Weight" value={`${product.weight} g`} /> : null}
                  <DetailLine label="Collection" value={categoryLabel ?? product.category.name} />
                  <DetailLine label="SKU" value={product.sku} mono />
                </ul>
                {shownTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {shownTags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/products?q=${encodeURIComponent(tag)}`}
                        className="rounded-full border border-border/70 px-3 py-1 text-xs transition-colors hover:border-accent hover:text-accent"
                      >
                        {prettyTag(tag)}
                      </Link>
                    ))}
                  </div>
                )}
              </Accordion>
              <Accordion title="Shipping & payment">
                <div className="space-y-3">
                  <p>
                    <strong className="text-foreground">Delivery:</strong>{" "}
                    {shippingFee > 0 ? (
                      <>
                        {formatPrice(shippingFee)} per order, free on orders of {formatPrice(freeShippingThreshold)} or more.
                      </>
                    ) : (
                      <>Free on every order.</>
                    )}{" "}
                    Dispatched in 1–2 business days, delivered in 3–5 business days across Pakistan.
                  </p>
                  <p>
                    <strong className="text-foreground">Cash on delivery:</strong>{" "}
                    {codAdvance > 0
                      ? `${formatPrice(codAdvance)} advance via bank transfer; balance on delivery.`
                      : "Pay the full amount to the courier on delivery."}
                  </p>
                  <p>
                    <strong className="text-foreground">Returns:</strong> 7 days from delivery for unworn pieces in their
                    original packaging. <Link href="/shipping" className="underline underline-offset-2">Full policy</Link>
                  </p>
                </div>
              </Accordion>
              <Accordion title="Care">
                <ul className="space-y-2">
                  {[
                    "Put perfume and lotion on before your jewellery, and take it off for showering and swimming.",
                    "Store pieces separately in a soft pouch so they don't scratch.",
                    "Wipe with a soft, dry cloth after wearing.",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/guides/how-to-clean-stainless-steel-jewellery" className="mt-3 inline-block underline underline-offset-2">
                  How to clean stainless steel jewellery
                </Link>
              </Accordion>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <button type="button" onClick={handleShare} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      {!outOfStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border/70 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex items-center gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <p className="font-semibold tabular-nums">{formatPrice(effectivePrice * qty)}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
          </div>
          {/* WhatsApp lives here on phones instead of floating over the page */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_WHATSAPP_EVENT))}
            aria-label="Ask about this piece on WhatsApp"
            className="h-12 w-12 shrink-0 rounded-full border border-green-600/40 text-green-700 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7 0-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.4-1.8-1.6-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.5l.3-.5c.1-.2 0-.4-.1-.5-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5 2.5 1 2.9.7 3.4.7.5 0 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4Zm-5.5 7.5c-1.7 0-3.4-.5-4.9-1.4l-.3-.2-3.6.9.9-3.5-.2-.4c-1-1.5-1.5-3.3-1.5-5.1 0-5.4 4.4-9.7 9.7-9.7 2.6 0 5 1 6.9 2.8 1.8 1.8 2.9 4.3 2.9 6.9-.1 5.3-4.5 9.7-9.9 9.7Zm8.2-17.9C18 1.9 15 .8 12 .8 5.5.8.2 6 .2 12.5c0 2.1.5 4.1 1.6 5.9L.1 24l5.7-1.5c1.7.9 3.6 1.4 5.5 1.4 6.5 0 11.8-5.3 11.8-11.8.1-3.1-1.1-6.1-3.4-8.3Z" />
            </svg>
          </button>
          <button
            onClick={handleAdd}
            className="bg-foreground text-background px-6 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors flex items-center gap-2 shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            Add to Bag
          </button>
        </div>
      )}

      {/* Zoom modal — only for images */}
      {zoomOpen && currentMedia?.type === "image" && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
          onClick={() => setZoomOpen(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 backdrop-blur p-2 rounded-full text-white hover:bg-white/20 z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goImg(-1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur p-3 rounded-full text-white hover:bg-white/20 z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goImg(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur p-3 rounded-full text-white hover:bg-white/20 z-10"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
            <Image
              src={currentMedia.url}
              alt={currentMedia.alt || product.name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

function Promise({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5 flex items-start gap-3">
      <div className="bg-white rounded-full w-9 h-9 flex items-center justify-center text-accent shrink-0">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function DetailLine({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <li className="grid grid-cols-3 gap-2">
      <span className="text-foreground font-medium">{label}</span>
      <span className={`col-span-2 ${mono ? "font-mono" : ""}`}>{value}</span>
    </li>
  );
}

type GalleryMedia =
  | { type: "video"; url: string; poster?: string | null }
  | { type: "image"; url: string; alt?: string | null };

function GalleryBadges({ discount, featured }: { discount: number; featured: boolean }) {
  if (discount <= 0 && !featured) return null;
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-1.5">
      {discount > 0 && (
        <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent shadow-sm">
          −{discount}%
        </span>
      )}
      {featured && (
        <span className="rounded-full bg-foreground px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-background">
          Bestseller
        </span>
      )}
    </div>
  );
}

function Thumbs({
  media,
  active,
  onPick,
  className,
}: {
  media: GalleryMedia[];
  active: number;
  onPick: (i: number) => void;
  className: string;
}) {
  return (
    <div className={className}>
      {media.map((m, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={m.type === "video" ? "Show product video" : `Show photo ${i + 1}`}
          aria-current={active === i ? "true" : undefined}
          className={`relative aspect-square shrink-0 overflow-hidden rounded-xl bg-secondary/60 transition ${
            active === i ? "ring-2 ring-foreground ring-offset-2" : "opacity-70 hover:opacity-100"
          }`}
        >
          {m.type === "video" ? (
            <>
              {m.poster ? (
                <Image src={m.poster} alt="" fill sizes="80px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 bg-black" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-4 w-4 fill-white text-white" strokeWidth={1.5} aria-hidden="true" />
              </span>
            </>
          ) : (
            <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
          )}
        </button>
      ))}
    </div>
  );
}

/** Native <details> accordion: works without JS and is keyboard accessible. */
function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group py-1" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold uppercase tracking-[0.16em]">
        {title}
        <Plus className="h-4 w-4 shrink-0 transition-transform group-open:rotate-45" aria-hidden="true" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}
