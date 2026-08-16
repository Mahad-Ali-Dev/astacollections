import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { ArrowRight, Award, Heart, Sparkles } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { VideoCarouselSection } from "@/components/shop/video-carousel-section";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us",
  description:
    "Asta Collections — handpicked jewellery for every occasion, crafted with love in Pakistan.",
};

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <section className="container py-16 md:py-24 max-w-4xl">
        <Reveal className="text-center space-y-5">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Our Story</p>
          <h1 className="text-4xl md:text-6xl font-serif text-balance">
            Jewellery that lasts longer than the moments
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto text-pretty">
            We started Asta Collections with a simple belief: the pieces women wear should hold
            their stories — first dates, big nights, quiet Sundays. Every item we make is meant to
            stay with you.
          </p>
        </Reveal>
      </section>

      <section className="container pb-16 grid md:grid-cols-2 gap-10 items-center max-w-6xl">
        <Reveal className="relative aspect-[4/5] rounded-2xl overflow-hidden">
          <Image
            src={settings.aboutHeroImage}
            alt="Crafted jewellery"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </Reveal>
        <Reveal className="space-y-5" stagger={0.12}>
          <h2 className="text-3xl md:text-4xl font-serif">Made by hand. Worn for a lifetime.</h2>
          <p className="text-muted-foreground leading-relaxed">
            Each piece in our collection is hand-inspected before it ships. We work with skilled
            artisans across Pakistan who share our obsession with detail — the way a clasp clicks
            shut, how light catches a stone, the comfort of a properly weighted earring.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We use premium gold-plating that doesn&apos;t fade, hypoallergenic settings,
            and stones we&apos;d wear ourselves. If something falls short, we&apos;ll make it right —
            no questions, no friction.
          </p>
        </Reveal>
      </section>

      <VideoCarouselSection page="about" slot="story" />

      <section className="container py-16 max-w-5xl">
        <Reveal className="grid md:grid-cols-3 gap-6">
          <Value
            icon={Heart}
            title="Made with love"
            text="Every piece passes through caring hands before yours."
          />
          <Value
            icon={Award}
            title="Quality first"
            text="Premium materials, hand-inspection, fair guarantees."
          />
          <Value
            icon={Sparkles}
            title="Built to last"
            text="Heirloom-grade craft at prices that respect your money."
          />
        </Reveal>
      </section>

      <VideoCarouselSection page="about" slot="values" />

      <section className="container pb-24">
        <Reveal className="bg-secondary rounded-3xl p-10 md:p-16 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">Browse the collection</h2>
          <p className="text-muted-foreground mb-6">
            Find a piece you&apos;ll wear for years.
          </p>
          <Link href="/products">
            <Button variant="gold" size="lg" className="group">
              Shop All Pieces
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </Reveal>
      </section>

      <VideoCarouselSection page="about" slot="end" />
    </>
  );
}

function Value({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-3">
      <div className="inline-flex p-3 rounded-full bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-serif text-xl">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
