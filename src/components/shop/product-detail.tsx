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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BundleSection, type BundleData } from "./bundle-section";
import { OfferTimer } from "./offer-timer";
import {
  ProductAttributePicker,
  computeAttributesPriceModifier,
  missingRequiredSelections,
  selectedVariantStock,
  type ProductAttribute,
} from "./product-attribute-picker";
import { useCart } from "@/lib/cart-store";
import { track } from "@/lib/fbpixel";
import { formatPrice, getDiscountPercent, defaultOfferEndsAt } from "@/lib/utils";
import { prettyTag } from "@/lib/tags";
import { toast } from "sonner";

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
}: {
  product: Product;
  bundle?: BundleData | null;
  /** Flat delivery charge applied below the free-shipping threshold. */
  shippingFee?: number;
  /** Order value at or above which delivery is free. 0 disables the threshold. */
  freeShippingThreshold?: number;
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

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const deliveryStr = deliveryDate.toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  // Delivery is free either when no fee is configured, or when this line's
  // value already clears the threshold. Recomputed as qty changes so the
  // badge never promises free delivery the customer won't actually get.
  const lineTotal = product.price * qty;
  const qualifiesForFreeShipping =
    shippingFee <= 0 || (freeShippingThreshold > 0 && lineTotal >= freeShippingThreshold);

  return (
    <>
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* GALLERY — left, sticky */}
        <div className="lg:col-span-7 lg:sticky lg:top-28 lg:self-start space-y-4 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-[88px_1fr] gap-3">
            {/* Vertical thumbnails on desktop */}
            {hasMultiple && (
              <div className="hidden md:flex flex-col gap-2 max-h-[640px] overflow-y-auto no-scrollbar">
                {media.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-secondary/60 transition ${
                      activeImg === i
                        ? "ring-2 ring-accent ring-offset-2"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    aria-label={m.type === "video" ? "View product video" : `View image ${i + 1}`}
                  >
                    {m.type === "video" ? (
                      <>
                        {m.poster ? (
                          <Image src={m.poster} alt="Video" fill sizes="88px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-black" />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-5 w-5 text-white fill-white" strokeWidth={1.5} />
                        </span>
                      </>
                    ) : (
                      <Image src={m.url} alt={m.alt ?? ""} fill sizes="88px" className="object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Main image or video */}
            <div className="relative aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden bg-secondary/60 group card-soft">
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
                    className="absolute inset-0 w-full h-full object-cover bg-black"
                  />
                ) : (
                  <>
                    <Image
                      src={currentMedia.url}
                      alt={currentMedia.alt ?? product.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      priority
                    />
                    <button
                      type="button"
                      onClick={() => setZoomOpen(true)}
                      className="absolute top-4 right-4 bg-white/95 backdrop-blur p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow"
                      aria-label="Zoom"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No image
                </div>
              )}

              {/* Prev / next arrows work across video + images */}
              {hasMultiple && (
                <>
                  <button
                    onClick={() => goImg(-1)}
                    aria-label="Previous"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow z-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => goImg(1)}
                    aria-label="Next"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow z-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {discount > 0 && (
                  <span className="bg-accent text-accent-foreground text-[10px] uppercase tracking-[0.18em] font-bold px-3 py-1.5 rounded-full">
                    −{discount}% OFF
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-foreground text-background text-[10px] uppercase tracking-[0.18em] font-semibold px-3 py-1.5 rounded-full">
                    Bestseller
                  </span>
                )}
              </div>

              {hasMultiple && (
                <div className="absolute bottom-4 right-4 bg-foreground/85 text-background text-xs px-3 py-1.5 rounded-full backdrop-blur z-10">
                  {activeImg + 1} / {media.length}
                </div>
              )}
            </div>
          </div>

          {/* Mobile thumbnail strip */}
          {hasMultiple && (
            <div className="md:hidden grid grid-cols-5 gap-2">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-secondary/60 transition ${
                    activeImg === i ? "ring-2 ring-accent ring-offset-1" : "opacity-70"
                  }`}
                  aria-label={m.type === "video" ? "View product video" : `View image ${i + 1}`}
                >
                  {m.type === "video" ? (
                    <>
                      {m.poster ? (
                        <Image src={m.poster} alt="Video" fill sizes="100px" className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-black" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-4 w-4 text-white fill-white" strokeWidth={1.5} />
                      </span>
                    </>
                  ) : (
                    <Image src={m.url} alt={m.alt ?? ""} fill sizes="100px" className="object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO — right column */}
        <div className="lg:col-span-5 space-y-7 pb-32 md:pb-0 min-w-0">
          <div className="space-y-3">
            <Link
              href={`/category/${product.category.slug}`}
              className="eyebrow-accent hover:underline inline-flex items-center gap-2"
            >
              <span className="h-px w-6 bg-accent" />
              {product.category.name}
            </Link>
            <h1 className="display-2">{product.name}</h1>
            {product.shortDesc && (
              <p className="text-muted-foreground text-pretty leading-relaxed">
                {product.shortDesc}
              </p>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-muted-foreground">4.9 · 1,200+ reviews</span>
          </div>

          {/* PRICE */}
          <div className="space-y-2 pb-6 border-b border-border/70">
            <div className="flex items-baseline gap-x-3 gap-y-2 flex-wrap">
              <span className="text-2xl sm:text-3xl md:text-4xl font-semibold tabular-nums">
                {formatPrice(effectivePrice)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-base sm:text-lg text-muted-foreground line-through tabular-nums">
                    {formatPrice(product.comparePrice)}
                  </span>
                  <Badge variant="success" className="rounded-full px-3 py-1 whitespace-nowrap">
                    Save {formatPrice(product.comparePrice - product.price)}
                  </Badge>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
            {discount > 0 && <OfferTimer endsAt={defaultOfferEndsAt()} variant="compact" />}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            {outOfStock ? (
              <>
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span className="text-destructive font-medium">
                  {variantSoldOut ? "Selected variant out of stock" : "Out of stock"}
                </span>
              </>
            ) : effectiveStock < 5 ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                <span className="text-amber-700 font-medium">
                  Only {effectiveStock} left — order soon
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-green-700 font-medium">In stock — ready to ship</span>
              </>
            )}
          </div>

          {/* VARIANT PICKER (size / color / etc) */}
          {attrs.length > 0 && (
            <div className="space-y-4">
              <ProductAttributePicker
                attributes={attrs}
                selected={selectedAttrs}
                onChange={setSelectedAttrs}
              />
            </div>
          )}

          {/* QUANTITY + ADD */}
          {!outOfStock && (
            <div className="flex flex-row flex-wrap items-center gap-3">
              <div className="flex items-center border border-border rounded-full h-14 bg-card shrink-0">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-5 h-full hover:text-accent disabled:opacity-30 transition-colors"
                  disabled={qty <= 1}
                  aria-label="Decrease"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 tabular-nums font-semibold min-w-[3rem] text-center">{qty}</span>
                <button
                  onClick={() => setQty(Math.min(effectiveStock, qty + 1))}
                  className="px-5 h-full hover:text-accent disabled:opacity-30 transition-colors"
                  disabled={qty >= effectiveStock}
                  aria-label="Increase"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Inline ADD TO BAG — hidden on mobile (sticky bottom bar handles it) */}
              <button
                onClick={handleAdd}
                className="group hidden sm:flex flex-1 h-14 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-all gold-button-glow items-center justify-center gap-2 min-w-[200px]"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Bag · {formatPrice(effectivePrice * qty)}
              </button>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                aria-label="Wishlist"
                className="border border-border rounded-full w-14 h-14 flex items-center justify-center hover:border-accent transition shrink-0 ml-auto sm:ml-0"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    wishlisted ? "fill-accent text-accent" : ""
                  }`}
                  strokeWidth={1.6}
                />
              </button>
            </div>
          )}

          {outOfStock && (
            <Button size="xl" disabled className="w-full h-14 rounded-full">
              Sold Out
            </Button>
          )}

          {/* BUNDLE */}
          {bundle && bundle.items.length >= 2 && (
            <BundleSection bundle={bundle} currentProductId={product.id} />
          )}

          {/* DELIVERY/PROMISES */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Promise
              icon={Truck}
              title={qualifiesForFreeShipping ? "Free delivery" : `${formatPrice(shippingFee)} delivery`}
              sub={
                qualifiesForFreeShipping
                  ? `Arrives ~${deliveryStr}`
                  : `Free over ${formatPrice(freeShippingThreshold)}`
              }
            />
            <Promise icon={RefreshCcw} title="7-day returns" sub="No questions asked" />
            <Promise icon={Package} title="COD or Bank" sub="Rs. 250 advance for COD" />
            <Promise icon={Award} title="Quality first" sub="Hand-inspected" />
          </div>

          {/* TAGS */}
          {product.tagsList.length > 0 && (
            <div>
              <p className="eyebrow mb-2.5">Tags</p>
              <div className="flex flex-wrap gap-2">
                {product.tagsList.map((tag) => (
                  <Link
                    key={tag}
                    href={`/products?q=${encodeURIComponent(tag)}`}
                    className="text-xs px-3 py-1.5 bg-secondary hover:bg-accent hover:text-accent-foreground rounded-full transition-colors border border-border/60"
                  >
                    {prettyTag(tag)}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* SHARE */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/70 text-sm">
            <button
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <span className="text-border">·</span>
            <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>
          </div>

          {/* TABS */}
          <div className="rounded-2xl border border-border/70 overflow-hidden">
            <div className="flex border-b border-border/70 bg-secondary/40 overflow-x-auto no-scrollbar">
              {(["description", "details", "shipping", "care"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-4 text-xs uppercase tracking-[0.2em] font-semibold capitalize whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === t
                      ? "border-accent text-foreground bg-white"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-6 text-sm text-muted-foreground leading-relaxed bg-white">
              {activeTab === "description" && (
                <p className="whitespace-pre-line text-pretty">{product.description}</p>
              )}
              {activeTab === "details" && (
                <ul className="space-y-2.5">
                  <DetailLine label="SKU" value={product.sku} mono />
                  <DetailLine label="Category" value={product.category.name} />
                  {product.material && <DetailLine label="Material" value={product.material} />}
                  {product.weight && <DetailLine label="Weight" value={`${product.weight}g`} />}
                  <DetailLine
                    label="In stock"
                    value={`${product.stock} ${product.stock === 1 ? "piece" : "pieces"}`}
                  />
                </ul>
              )}
              {activeTab === "shipping" && (
                <div className="space-y-3">
                  <p>
                    <strong className="text-foreground">Delivery:</strong>{" "}
                    {shippingFee > 0 ? (
                      <>
                        {formatPrice(shippingFee)} per order — free on orders above{" "}
                        {formatPrice(freeShippingThreshold)}.
                      </>
                    ) : (
                      <>Free on every order.</>
                    )}{" "}
                    Standard delivery 3–5 business days across Pakistan.
                  </p>
                  <p>
                    <strong className="text-foreground">Cash on Delivery:</strong> Rs. 250 advance
                    via bank transfer; balance on delivery.
                  </p>
                  <p>
                    <strong className="text-foreground">Bank Transfer:</strong> Pay full amount up
                    front. Order ships once verified.
                  </p>
                </div>
              )}
              {activeTab === "care" && (
                <div className="space-y-3">
                  <p>To keep your piece looking new for years:</p>
                  <ul className="space-y-2 list-none">
                    {[
                      "Remove before showering, swimming or applying perfume.",
                      "Store in a soft pouch, away from other pieces.",
                      "Clean gently with a soft, dry cloth after wear.",
                      "Avoid contact with chemicals, lotions and chlorine.",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      {!outOfStock && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border/70 p-3 flex items-center gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <p className="font-semibold tabular-nums">{formatPrice(effectivePrice * qty)}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.name}</p>
          </div>
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
              alt={currentMedia.alt ?? product.name}
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
