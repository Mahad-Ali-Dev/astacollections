import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCarousel } from "@/components/shop/product-carousel";
import { Hero, type HeroSlide } from "@/components/shop/hero";
import { Marquee } from "@/components/shop/marquee";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { FullBanner, DualBanner } from "@/components/shop/banners";
import { ReviewsMarquee } from "@/components/shop/reviews-marquee";
import { guideProducts } from "@/lib/guide-data";
import type { ProductCardData } from "@/components/shop/product-card";
import { OfferTimer } from "@/components/shop/offer-timer";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { Reveal } from "@/components/motion/reveal";
import { defaultOfferEndsAt } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { SectionSlot } from "@/components/shop/section-slot";
import { TrustStrip } from "@/components/shop/trust-strip";
import { getStorePolicy } from "@/lib/store-policy";
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
  const [featured, categoriesWithCount, latestProducts, bestsellers, bundles, settings, reviewPool, policy, cheapest, giftPicks, forHer] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
      include: { _count: { select: { products: true, extraProducts: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, _count: { select: { attributes: true } } },
      take: 4,
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
    // Strongest recent reviews for the homepage testimonial carousel. Longer
    // bodies read better at that size, so short ones are filtered out.
    // Strongest recent reviews for the review wall. Mid-length bodies read
    // best on a card, so very short and very long ones are filtered below.
    prisma.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      orderBy: { createdAt: "desc" },
      take: 1000,
      select: {
        id: true,
        customerName: true,
        rating: true,
        body: true,
        product: { select: { name: true, slug: true, isActive: true } },
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
  ]);

  // Most imported reviews share the same template wording (Nov 2026: 951
  // reviews, 72 distinct texts, 718 opening with the same sentence). A wall of
  // repeats reads as fake, so keep one review per opening phrase.
  const seenOpenings = new Set<string>();
  const marqueeReviews = reviewPool
    .filter((r) => {
      const body = r.body.trim();
      if (body.length < 40 || body.length > 260) return false;
      const key = body.toLowerCase().replace(/[^a-z ]/g, "").slice(0, 40);
      if (seenOpenings.has(key)) return false;
      seenOpenings.add(key);
      return true;
    })
    .slice(0, 24)
    .map((r) => ({
      id: r.id,
      name: r.customerName,
      rating: r.rating,
      body: r.body.trim(),
      product: r.product && r.product.isActive ? { name: r.product.name, slug: r.product.slug } : null,
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

  // Build hero slides from settings
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

  const collections = categoriesWithCount.map((c) => ({
    // Some category names in the database are slugs ("couple-rings").
    name: COLLECTION_COPY[c.slug]?.h1 ?? c.name.trim(),
    slug: c.slug,
    description: c.description,
    image: c.image ?? "",
    // Collections can hold products whose primary category is elsewhere,
    // so both relations count towards what a shopper will actually see.
    productCount: c._count.products + c._count.extraProducts,
  }));

  return (
    <>
      <Hero slides={heroSlides} />
      <Marquee phrases={settings.marqueePhrases.split("|").map((p) => p.trim()).filter(Boolean)} />

      <SectionSlot page="home" slot="hero" />

      {/* INTRO — the page's one H1, plus links into the main collections */}
      <section className="container pt-12 md:pt-16 pb-8 text-center">
        <h1 className="display-2 max-w-3xl mx-auto">
          Stainless steel jewellery, delivered across Pakistan
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
          Rings, pendant sets, stud earrings, bracelets and handcuffs in gold-tone and
          silver-tone stainless steel
          {cheapest ? <>, from {formatPrice(cheapest.price)}</> : null}. Made for everyday
          wear, with cash on delivery to your door.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {INTRO_LINKS.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/category/${l.slug}`}
                className="px-4 h-10 inline-flex items-center rounded-full border border-border text-sm font-medium hover:border-accent hover:text-accent transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* TRUST — every figure from the admin settings */}
      <section className="container pb-4">
        <Reveal stagger={0.08}>
          <TrustStrip policy={policy} cards />
        </Reveal>
      </section>

      <SectionSlot page="home" slot="pillars" />

      {/* COLLECTION GRID */}
      <section className="container py-20 md:py-28">
        <Reveal className="flex items-end justify-between flex-wrap gap-4 mb-12 md:mb-16">
          <SectionHeader
            eyebrow="Shop by Collection"
            title={<>Discover <span className="italic font-light rose-gold-text">your style</span></>}
            description="Find the perfect piece from our handpicked categories."
          />
          <Link
            href="/products"
            className="text-xs uppercase tracking-[0.2em] font-semibold hidden md:inline-flex items-center gap-2 px-5 h-10 rounded-full border border-border hover:border-accent hover:text-accent transition-colors"
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Reveal>

        <Reveal y={36}>
          <CollectionGrid collections={collections} />
        </Reveal>
      </section>

      <SectionSlot page="home" slot="collections" />

      {/* OFFER TIMER */}
      <section className="container">
        <Reveal>
          <OfferTimer
            endsAt={defaultOfferEndsAt()}
            title="Use code WELCOME10 for 10% off your first order"
            cta={{ label: "Shop Now", href: "/products" }}
          />
        </Reveal>
      </section>

      <SectionSlot page="home" slot="offer" />

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
        <section className="container py-20 md:py-28">
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

      {/* DUAL BANNER */}
      <section className="container pb-12">
        <Reveal>
          <DualBanner
            banners={[
              {
                eyebrow: "Gift sets",
                title: "Sets that are ready to gift",
                description: "3-piece and 6-piece necklace and earring sets in gold and silver tones.",
                cta: { label: "Shop Sets", href: "/category/pendant" },
                image: settings.bannerDualLeftImage,
              },
              {
                eyebrow: "Everyday",
                title: "Pieces you'll never take off",
                description: "Adjustable rings, stud sets and handcuffs made for daily wear.",
                cta: { label: "Shop Rings", href: "/category/rings" },
                image: settings.bannerDualRightImage,
              },
            ]}
          />
        </Reveal>
      </section>

      <SectionSlot page="home" slot="dual-banner" />

      {/* FULL BANNER */}
      <section className="blush-bg py-20 md:py-28">
        <div className="container">
          <Reveal>
            <FullBanner
              eyebrow="Couple Rings"
              title={<>Made <span className="italic font-light rose-gold-text">to match</span>.</>}
              description="Matching stainless steel ring sets for promises, nikkahs and anniversaries. Most are adjustable, so you don't need to know both ring sizes to surprise someone."
              cta={{ label: "Shop Couple Rings", href: "/category/couple-rings" }}
              image={settings.bannerBridalImage}
              imagePosition="left"
            />
          </Reveal>
        </div>
      </section>

      <SectionSlot page="home" slot="full-banner" />

      {/* BUNDLES */}
      {bundles.length > 0 && (
        <section className="container py-20 md:py-28">
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
        <section className="container py-20 md:py-28">
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
          <Reveal className="product-grid" stagger={0.06} y={36}>
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={{
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
                }}
              />
            ))}
          </Reveal>
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

      {/* TESTIMONIALS */}
      {/* No "4.7 from N reviews" headline: with most reviews sharing template
          wording, a big count claim is the part most likely to mislead. The
          component shows it again if total > 0 is passed. */}
      <ReviewsMarquee reviews={marqueeReviews} total={0} average={0} />

      <SectionSlot page="home" slot="testimonials" />

      {/* NEW ARRIVALS */}
      {latestProducts.length > 0 && (
        <section className="container py-20 md:py-28">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow-accent mb-4 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-accent" />
              Just In
              <span className="h-px w-8 bg-accent" />
            </p>
            <h2 className="display-2">New arrivals</h2>
          </Reveal>
          <Reveal className="product-grid" stagger={0.06}>
            {latestProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
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
                }}
              />
            ))}
          </Reveal>
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
