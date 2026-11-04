import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCarousel } from "@/components/shop/product-carousel";
import { Marquee } from "@/components/shop/marquee";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { FullBanner } from "@/components/shop/banners";
import { Hero, type HeroSlide } from "@/components/shop/hero";
import { CollectionRail } from "@/components/shop/collection-rail";
import { selectDistinctReviews } from "@/lib/review-selection";
import { OfferBand } from "@/components/shop/offer-band";
import { EditTiles } from "@/components/shop/edit-tiles";
import { HomeReviews, type HomeReview } from "@/components/shop/home-reviews";
import { guideProducts } from "@/lib/guide-data";
import type { ProductCardData } from "@/components/shop/product-card";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { Reveal } from "@/components/motion/reveal";
import { getSettings } from "@/lib/settings";
import { SectionSlot } from "@/components/shop/section-slot";
import { getStorePolicy, syncDeliveryAmount } from "@/lib/store-policy";
import { COLLECTION_COPY } from "@/lib/collection-copy";
import { pageMeta, SITE } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Asta Collections: Stainless Steel Jewellery Online in Pakistan",
  description: SITE.description,
  path: "/",
  absoluteTitle: true,
});

// Photos chosen from the catalogue so each one shows what its label sells. If a
// product is removed, the matching collection's own image is used instead.
const PHOTO_PICKS = {
  rings: { slug: "midnight-sapphire-radiance-stone-ring", image: 0 },
  couple: { slug: "asta-enchanted-antler-stainless-steel-couples-ring-set", image: 4 },
};

// Collections linked from the home intro, in the order shoppers search for them.
const INTRO_LINKS = [
  { slug: "rings", label: "Rings" },
  { slug: "couple-rings", label: "Couple rings" },
  { slug: "pendant", label: "Pendant sets" },
  { slug: "studs", label: "Stud earrings" },
  { slug: "bracelets", label: "Bracelets" },
  { slug: "hand-cuff", label: "Handcuffs" },
];

export default async function HomePage() {
  const [featured, categoriesWithCount, latestProducts, bestsellers, bundles, settings, reviewPool, policy, cheapest, giftPicks, forHer, introCats, pickProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true, extraProducts: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 8,
    }),
    prisma.bundle.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } } },
          },
        },
      },
    }),
    getSettings(),
    // Approved 4-5 star reviews for the home review block (de-duplicated below).
    prisma.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        customerName: true,
        rating: true,
        body: true,
        verified: true,
        product: {
          select: {
            name: true,
            slug: true,
            isActive: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    getStorePolicy(),
    prisma.product.findFirst({
      where: { isActive: true },
      orderBy: { price: "asc" },
      select: { price: true },
    }),
    guideProducts(["zircon-rings", "studs", "pendant", "enamel-rings", "hand-cuff", "couple-rings"], 2000, 12),
    guideProducts(["pendant", "studs", "bracelets", "mother-pearl-rings"], undefined, 12),
    prisma.category.findMany({
      where: { slug: { in: INTRO_LINKS.map((l) => l.slug) }, isActive: true },
      select: { slug: true, image: true },
    }),
    prisma.product.findMany({
      where: { slug: { in: Object.values(PHOTO_PICKS).map((x) => x.slug) }, isActive: true },
      select: {
        slug: true,
        name: true,
        price: true,
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
  ]);

  // The welcome offer comes from the real coupon record, so its terms (and
  // a countdown, only when the admin set an expiry) can't drift.
  const now = new Date();
  // The announcement-code setting is often left blank; WELCOME10 is the code
  // the home page has always promoted. Either way it must match a live coupon.
  const offerCode = (settings.announcementCode || "WELCOME10").trim().toUpperCase();
  const offerCoupon = offerCode
    ? await prisma.coupon.findFirst({
        where: {
          code: offerCode,
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
        },
        select: { code: true, discountType: true, discountValue: true, minOrder: true, maxDiscount: true, expiresAt: true },
      })
    : null;

  // No two cards show the same text (see review-selection.ts). Reviews are shown
  // whole or not at all; the text is never edited.
  const homeReviews: HomeReview[] = selectDistinctReviews(
    reviewPool.filter((r) => {
      const len = r.body.trim().length;
      return len >= 30 && len <= 260 && r.product?.isActive;
    }),
    9
  ).map((r) => ({
    id: r.id,
    name: r.customerName,
    rating: r.rating,
    body: r.body.trim(),
    verified: r.verified,
    product: r.product ? { name: r.product.name, slug: r.product.slug, image: r.product.images[0]?.url ?? null } : null,
  }));

  const toCard = (p: (typeof giftPicks)[number]): ProductCardData => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    comparePrice: p.comparePrice,
    sku: p.sku,
    stock: p.stock,
    image: p.images[0]?.url,
    hoverImage: p.images[1]?.url,
    hasOptions: p._count.attributes > 0,
    video: p.videoUrl,
    videoPoster: p.videoPoster,
    isFeatured: p.isFeatured,
  });

  const countOf = (id: string): number => {
    const c = categoriesWithCount.find((x) => x.id === id);
    if (!c) return 0;
    const own = c._count.products + c._count.extraProducts;
    return own + categoriesWithCount.filter((x) => x.parentId === id).reduce((n, x) => n + countOf(x.id), 0);
  };
  const gridCollections = categoriesWithCount
    .filter((c) => c.slug !== "bestsellers" && c.image)
    .map((c) => ({
      // Some category names in the database are slugs ("couple-rings").
      name: COLLECTION_COPY[c.slug]?.h1 ?? c.name.trim(),
      slug: c.slug,
      image: c.image ?? "",
      productCount: countOf(c.id),
    }))
    .filter((c) => c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount);
  // Keep the grid even at 4 / 3 / 2 columns (12 divides by all three).
  const collections = gridCollections.slice(0, gridCollections.length >= 12 ? 12 : gridCollections.length >= 8 ? 8 : gridCollections.length);

  const catImage = (slug: string) => introCats.find((c) => c.slug === slug)?.image ?? null;
  const pick = (k: keyof typeof PHOTO_PICKS) => {
    const product = pickProducts.find((x) => x.slug === PHOTO_PICKS[k].slug);
    return product ? { product, url: product.images[PHOTO_PICKS[k].image]?.url ?? product.images[0]?.url } : null;
  };
  // Slides come from Admin -> Site content.
  const heroSlides: HeroSlide[] = [
    {
      eyebrow: settings.hero1Eyebrow,
      title: settings.hero1Title,
      titleAccent: settings.hero1Accent,
      description: settings.hero1Description,
      cta: { label: settings.hero1CtaLabel, href: settings.hero1CtaHref },
      image: settings.hero1Image,
    },
    {
      eyebrow: settings.hero2Eyebrow,
      title: settings.hero2Title,
      titleAccent: settings.hero2Accent,
      description: settings.hero2Description,
      cta: { label: settings.hero2CtaLabel, href: settings.hero2CtaHref },
      image: settings.hero2Image,
    },
    {
      eyebrow: settings.hero3Eyebrow,
      title: settings.hero3Title,
      titleAccent: settings.hero3Accent,
      description: settings.hero3Description,
      cta: { label: settings.hero3CtaLabel, href: settings.hero3CtaHref },
      image: settings.hero3Image,
    },
  ].filter((s) => s.image && s.title);
  const storeFacts = [
    `Gold and silver tone${cheapest ? `, from ${formatPrice(cheapest.price)}` : ""}.`,
    policy.codEnabled ? "Cash on delivery across Pakistan." : "Delivered across Pakistan.",
  ].join(" ");
  const introCollections = INTRO_LINKS.map((l) => ({
    href: `/category/${l.slug}`,
    label: l.label,
    image: introCats.find((c) => c.slug === l.slug)?.image ?? null,
  }));

  const offer = offerCoupon
    ? {
        code: offerCoupon.code,
        headline:
          offerCoupon.discountType === "PERCENTAGE"
            ? `${offerCoupon.discountValue}% off your first order`
            : `${formatPrice(offerCoupon.discountValue)} off your first order`,
        terms: [
          offerCoupon.minOrder ? `On orders of ${formatPrice(offerCoupon.minOrder)} or more` : null,
          offerCoupon.maxDiscount && offerCoupon.discountType === "PERCENTAGE"
            ? `up to ${formatPrice(offerCoupon.maxDiscount)} off`
            : null,
          "apply the code at checkout.",
        ]
          .filter(Boolean)
          .join(", ")
          .replace(/^./, (c) => c.toUpperCase()),
        expiresAt: offerCoupon.expiresAt ? offerCoupon.expiresAt.toISOString() : null,
      }
    : null;

  return (
    <>
      <Hero slides={heroSlides} />
      <Marquee
        phrases={settings.marqueePhrases
          .split("|")
          .map((p) => syncDeliveryAmount(p.trim(), policy.freeShippingThreshold))
          .filter(Boolean)}
      />
      <CollectionRail collections={introCollections} facts={storeFacts} policy={policy} />

      <SectionSlot page="home" slot="hero" />

      <SectionSlot page="home" slot="pillars" />

      {/* COLLECTION GRID */}
      <section className="container py-14 md:py-24">
        <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-12 md:mb-16">
          <SectionHeader
            eyebrow="Shop by Collection"
            title={<>Discover <span className="italic font-light rose-gold-text">your style</span></>}
            description="Rings, pendant sets, studs and handcuffs, each collection in gold-tone and silver-tone stainless steel."
          />
          <Link
            href="/products"
            className="text-xs uppercase tracking-[0.2em] font-semibold hidden md:inline-flex items-center gap-2 px-5 h-10 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>

        <CollectionGrid collections={collections} />
      </section>

      <SectionSlot page="home" slot="collections" />

      {/* OFFER: only while the coupon in settings is active */}
      {offer && <OfferBand {...offer} />}

      <SectionSlot page="home" slot="offer" />

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
        <section className="container py-14 md:py-24">
          <Reveal className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <SectionHeader
              eyebrow="Top Picks"
              title="Bestsellers"
              description="The pieces our customers can't stop reordering."
            />
            <Link
              href="/products"
              className="text-xs uppercase tracking-[0.2em] font-semibold hidden md:inline-flex items-center gap-2 px-5 h-10 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
          <Reveal>
            <ProductCarousel
              products={bestsellers.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                comparePrice: p.comparePrice,
                sku: p.sku,
                stock: p.stock,
                image: p.images[0]?.url,
                hoverImage: p.images[1]?.url,
                hasOptions: p._count.attributes > 0,
                video: p.videoUrl,
                videoPoster: p.videoPoster,
                isFeatured: p.isFeatured,
              }))}
            />
          </Reveal>
        </section>
      )}

      <SectionSlot page="home" slot="bestsellers" />

      {/* GIFTS: two carousels on a soft blush wash, a little playful */}
      {(giftPicks.length > 0 || forHer.length > 0) && (
        <section className="relative overflow-hidden py-20 md:py-24 bg-[radial-gradient(ellipse_at_top_left,rgba(233,205,193,0.55),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(218,171,151,0.35),transparent_50%)] bg-secondary/40">
          <div className="container space-y-16 md:space-y-20">
            {giftPicks.length > 0 && (
              <div>
                <Reveal className="flex items-end justify-between mb-8 flex-wrap gap-4">
                  <SectionHeader
                    eyebrow="Gifting made easy"
                    title={<>Gifts under <span className="italic font-light rose-gold-text">Rs. 2,000</span></>}
                    description="Adjustable rings, stud sets and pendant sets that are easy to give, with cash on delivery."
                  />
                  <Link
                    href="/guides/jewellery-gift-ideas-for-her-under-2000"
                    className="text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 px-5 h-10 rounded-full bg-white border border-border hover:border-accent hover:text-accent transition-colors"
                  >
                    Gift guide <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Reveal>
                <ProductCarousel products={giftPicks.map(toCard)} />
              </div>
            )}
            {forHer.length > 0 && (
              <div>
                <Reveal className="flex items-end justify-between mb-8 flex-wrap gap-4">
                  <SectionHeader
                    eyebrow="For her"
                    title={<>Sets, studs <span className="italic font-light rose-gold-text">&amp; sparkle</span></>}
                    description="Pendant and earring sets, multi-pair studs and bracelets in gold and silver tones."
                  />
                  <Link
                    href="/category/pendant"
                    className="text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 px-5 h-10 rounded-full bg-white border border-border hover:border-accent hover:text-accent transition-colors"
                  >
                    Shop sets <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Reveal>
                <ProductCarousel products={forHer.map(toCard)} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* THE EDIT: one tall + two stacked tiles (images from Admin -> Site content) */}
      <EditTiles
        tiles={[
          {
            eyebrow: "Gift sets",
            title: "Sets that are ready to gift",
            line: "Necklace and earring sets in gold and silver tones.",
            cta: "Shop gift sets",
            href: "/category/pendant",
            image: catImage("pendant") ?? "",
          },
          {
            eyebrow: "Everyday",
            title: "Rings for every day",
            line: "Zircon, enamel and charm rings, most of them adjustable.",
            cta: "Shop rings",
            href: "/category/rings",
            image: pick("rings")?.url ?? catImage("rings") ?? "",
          },
          {
            eyebrow: "For two",
            title: "Couple rings, made to match",
            line: "Matching sets for promises, nikkahs and anniversaries.",
            cta: "Shop couple rings",
            href: "/category/couple-rings",
            image: pick("couple")?.url ?? catImage("couple-rings") ?? "",
          },
        ].filter((t) => t.image)}
      />

      <SectionSlot page="home" slot="dual-banner" />

      <SectionSlot page="home" slot="full-banner" />

      {/* BUNDLES */}
      {bundles.length > 0 && (
        <section className="container py-14 md:py-24">
          <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-12 md:mb-16">
            <SectionHeader
              eyebrow="Bundle & Save"
              title={<>Curated <span className="italic font-light rose-gold-text">bundles</span></>}
              description="Hand-picked sets at a special price — wear together, save together."
            />
          </Reveal>
          <Reveal y={36}>
            <BundleStrip bundles={bundles} />
          </Reveal>
        </section>
      )}

      <SectionSlot page="home" slot="bundles" />

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="container py-14 md:py-24">
          <Reveal className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <SectionHeader
              eyebrow="Editor's Choice"
              title="Featured pieces"
              description="Standout pieces from across the collection."
            />
            <Link
              href="/products"
              className="text-xs uppercase tracking-[0.2em] font-semibold hidden md:inline-flex items-center gap-2 px-5 h-10 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
            >
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
          <ProductCarousel products={featured.map(toCard)} />
        </section>
      )}

      <SectionSlot page="home" slot="featured" />

      {/* PROMISE — dark editorial */}
      <section>
        <FullBanner
          eyebrow="Our Promise"
          title="Quality you can feel."
          description={`Stainless steel made for everyday wear, cash on delivery anywhere in Pakistan, and a ${policy.returnDays}-day return window if something isn't right.`}
          cta={{ label: "Read Our Story", href: "/about" }}
          image={settings.bannerPromiseImage}
          imagePosition="right"
          variant="dark"
        />
      </section>

      <SectionSlot page="home" slot="promise" />

      {/* REVIEWS: equal cards, no two with the same text */}
      <HomeReviews reviews={homeReviews} />

      <SectionSlot page="home" slot="testimonials" />

      {/* NEW ARRIVALS */}
      {latestProducts.length > 0 && (
        <section className="container py-14 md:py-24">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow-accent mb-4 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-accent" />
              Just In
              <span className="h-px w-8 bg-accent" />
            </p>
            <h2 className="display-2">New arrivals</h2>
          </Reveal>
          <ProductCarousel products={latestProducts.map(toCard)} />
        </section>
      )}

      <SectionSlot page="home" slot="end" />
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-4 max-w-xl">
      <p className="eyebrow-accent flex items-center gap-3">
        <span className="h-px w-8 bg-accent" />
        {eyebrow}
      </p>
      <h2 className="display-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-base text-pretty leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
