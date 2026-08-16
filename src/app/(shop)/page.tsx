import Link from "next/link";
import { ArrowRight, ArrowUpRight, Truck, ShieldCheck, RefreshCcw, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { ProductCarousel } from "@/components/shop/product-carousel";
import { Hero, type HeroSlide } from "@/components/shop/hero";
import { Marquee } from "@/components/shop/marquee";
import { CollectionGrid } from "@/components/shop/collection-grid";
import { FullBanner, DualBanner } from "@/components/shop/banners";
import { Testimonials } from "@/components/shop/testimonials";
import { OfferTimer } from "@/components/shop/offer-timer";
import { BundleStrip } from "@/components/shop/bundle-strip";
import { Reveal } from "@/components/motion/reveal";
import { defaultOfferEndsAt } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { VideoCarouselSection } from "@/components/shop/video-carousel-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categoriesWithCount, latestProducts, bestsellers, bundles, settings] = await Promise.all([
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      take: 6,
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
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
            product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          },
        },
      },
    }),
    getSettings(),
  ]);

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
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image ?? "",
    productCount: c._count.products,
  }));

  return (
    <>
      <Hero slides={heroSlides} />
      <Marquee phrases={settings.marqueePhrases.split("|").map((p) => p.trim()).filter(Boolean)} />

      <VideoCarouselSection page="home" slot="hero" />

      {/* TRUST PILLARS */}
      <Reveal as="section" className="bg-secondary/40">
        <div className="container py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Pillar icon={Truck} title="Free shipping" sub="Above Rs. 5,000" />
          <Pillar icon={ShieldCheck} title="Quality assured" sub="Premium materials" />
          <Pillar icon={RefreshCcw} title="Easy returns" sub="7-day policy" />
          <Pillar icon={Award} title="Handpicked" sub="Curated edit" />
        </div>
      </Reveal>

      <VideoCarouselSection page="home" slot="pillars" />

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

      <VideoCarouselSection page="home" slot="collections" />

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

      <VideoCarouselSection page="home" slot="offer" />

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
                video: p.videoUrl,
                videoPoster: p.videoPoster,
                isFeatured: p.isFeatured,
              }))}
            />
          </Reveal>
        </section>
      )}

      <VideoCarouselSection page="home" slot="bestsellers" />

      {/* DUAL BANNER */}
      <section className="container pb-12">
        <Reveal>
          <DualBanner
            banners={[
              {
                eyebrow: "Bridal",
                title: "For the day you'll always remember",
                description: "Complete kundan and pearl bridal sets, hand-set with care.",
                cta: { label: "Shop Bridal", href: "/category/bridal-sets" },
                image: settings.bannerDualLeftImage,
              },
              {
                eyebrow: "Everyday",
                title: "Pieces you'll never take off",
                description: "Minimalist rings, layering necklaces and stud earrings.",
                cta: { label: "Shop Everyday", href: "/category/rings" },
                image: settings.bannerDualRightImage,
              },
            ]}
          />
        </Reveal>
      </section>

      <VideoCarouselSection page="home" slot="dual-banner" />

      {/* FULL BANNER */}
      <section className="blush-bg py-20 md:py-28">
        <div className="container">
          <Reveal>
            <FullBanner
              eyebrow="The Bridal Story"
              title={<>Heirlooms in <span className="italic font-light rose-gold-text">the making</span>.</>}
              description="Every piece in our bridal collection is designed with the moment in mind — the first meeting of eyes, the exchange of vows, the dance under fairy lights. Crafted to be passed down for generations."
              cta={{ label: "Explore Bridal", href: "/category/bridal-sets" }}
              image={settings.bannerBridalImage}
              imagePosition="left"
            />
          </Reveal>
        </div>
      </section>

      <VideoCarouselSection page="home" slot="full-banner" />

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

      <VideoCarouselSection page="home" slot="bundles" />

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
                  video: p.videoUrl,
                  videoPoster: p.videoPoster,
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </Reveal>
        </section>
      )}

      <VideoCarouselSection page="home" slot="featured" />

      {/* PROMISE — dark editorial */}
      <section>
        <FullBanner
          eyebrow="Our Promise"
          title="Quality you can feel."
          description="Hand-inspected before shipping. Hypoallergenic settings. Premium plating that doesn't fade. If anything is off, we'll make it right."
          cta={{ label: "Read Our Story", href: "/about" }}
          image={settings.bannerPromiseImage}
          imagePosition="right"
          variant="dark"
        />
      </section>

      <VideoCarouselSection page="home" slot="promise" />

      {/* TESTIMONIALS */}
      <Testimonials />

      <VideoCarouselSection page="home" slot="testimonials" />

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
                  video: p.videoUrl,
                  videoPoster: p.videoPoster,
                  isFeatured: p.isFeatured,
                }}
              />
            ))}
          </Reveal>
        </section>
      )}

      <VideoCarouselSection page="home" slot="end" />
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

function Pillar({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className="bg-white border border-border w-11 h-11 rounded-full flex items-center justify-center text-accent shrink-0">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
