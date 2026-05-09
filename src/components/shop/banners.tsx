import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type BannerProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  cta: { label: string; href: string };
  image: string;
  imagePosition?: "left" | "right";
  variant?: "default" | "dark";
};

/** Editorial split banner — image on one side, copy on the other. */
export function FullBanner({
  eyebrow,
  title,
  description,
  cta,
  image,
  imagePosition = "right",
  variant = "default",
}: BannerProps) {
  const imageOrder = imagePosition === "left" ? "md:order-1" : "md:order-2";
  const textOrder = imagePosition === "left" ? "md:order-2" : "md:order-1";

  if (variant === "dark") {
    return (
      <div className="container">
        <div className="bg-foreground text-background rounded-3xl overflow-hidden grid md:grid-cols-2 items-center my-12">
          <div className={`relative aspect-[4/5] md:aspect-square overflow-hidden ${imageOrder}`}>
            <Image
              src={image}
              alt={typeof title === "string" ? title : "Banner"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className={`p-8 md:p-14 space-y-5 ${textOrder}`}>
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-[0.3em] text-accent font-semibold flex items-center gap-3">
                <span className="h-px w-8 bg-accent" />
                {eyebrow}
              </p>
            )}
            <h2 className="display-2">{title}</h2>
            {description && (
              <p className="text-base text-pretty leading-relaxed text-background/75 max-w-md">
                {description}
              </p>
            )}
            <Link
              href={cta.href}
              className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-white hover:text-foreground transition-all"
            >
              {cta.label}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 items-center gap-8 md:gap-14">
      <div className={`relative aspect-[4/5] md:aspect-[5/6] overflow-hidden rounded-3xl ${imageOrder} card-soft`}>
        <Image
          src={image}
          alt={typeof title === "string" ? title : "Banner"}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className={`space-y-5 ${textOrder}`}>
        {eyebrow && (
          <p className="eyebrow-accent flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            {eyebrow}
          </p>
        )}
        <h2 className="display-2">{title}</h2>
        {description && (
          <p className="text-base text-muted-foreground text-pretty leading-relaxed max-w-md">
            {description}
          </p>
        )}
        <Link
          href={cta.href}
          className="group inline-flex items-center gap-2 bg-foreground text-background px-7 h-12 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-all gold-button-glow"
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

type DualBannerProps = {
  banners: [
    {
      eyebrow?: string;
      title: string;
      description?: string;
      cta: { label: string; href: string };
      image: string;
    },
    {
      eyebrow?: string;
      title: string;
      description?: string;
      cta: { label: string; href: string };
      image: string;
    }
  ];
};

/** Two image-led promotional cards side by side. */
export function DualBanner({ banners }: DualBannerProps) {
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      {banners.map((b, i) => (
        <Link
          key={i}
          href={b.cta.href}
          className="group relative overflow-hidden rounded-3xl bg-secondary/60 aspect-[4/5] md:aspect-[3/4] card-soft card-hover"
        >
          <Image
            src={b.image}
            alt={b.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-background flex items-end justify-between gap-3">
            <div className="min-w-0">
              {b.eyebrow && (
                <p className="text-[11px] uppercase tracking-[0.3em] text-accent font-semibold mb-2">
                  {b.eyebrow}
                </p>
              )}
              <h3 className="font-serif text-2xl md:text-3xl text-balance leading-tight">
                {b.title}
              </h3>
              {b.description && (
                <p className="text-sm opacity-85 mt-2 line-clamp-2 max-w-xs">{b.description}</p>
              )}
              <p className="text-[11px] uppercase tracking-[0.3em] mt-4 font-semibold link-grow inline-block">
                {b.cta.label}
              </p>
            </div>
            <span className="shrink-0 w-11 h-11 inline-flex items-center justify-center rounded-full bg-white text-foreground transition-all group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-12" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Slim hairline strip — between sections. */
export function PromoStrip({
  title,
  cta,
}: {
  title: string;
  cta: { label: string; href: string };
}) {
  return (
    <section className="bg-foreground text-background rounded-2xl px-6 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <p className="font-serif text-lg md:text-xl text-balance text-center md:text-left">
        {title}
      </p>
      <Link
        href={cta.href}
        className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 h-11 rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-white hover:text-foreground transition-colors"
      >
        {cta.label}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </Link>
    </section>
  );
}
