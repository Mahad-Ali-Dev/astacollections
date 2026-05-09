import Link from "next/link";
import Image from "next/image";

type Props = {
  /** "inline" = mark + decorative wordmark side by side. "mark" = nav_logo SVG only. "footer" = the bigger footer_logo (composite). "wordmark" = decorative text only. */
  variant?: "inline" | "mark" | "footer" | "wordmark";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  tone?: "ink" | "light";
  href?: string | null;
  className?: string;
};

const SIZES = {
  sm: { mark: 36, text: "text-base" },
  md: { mark: 48, text: "text-xl" },
  lg: { mark: 64, text: "text-2xl" },
  xl: { mark: 80, text: "text-3xl" },
  "2xl": { mark: 120, text: "text-4xl" },
};

export function Logo({
  variant = "inline",
  size = "md",
  tone = "ink",
  href = "/",
  className = "",
}: Props) {
  const s = SIZES[size];
  const lightInvert = tone === "light" ? "invert brightness-0 contrast-200 opacity-95" : "";
  const textColor = tone === "light" ? "text-background" : "text-foreground";

  // Footer composite — uses the bigger pre-baked footer_logo
  if (variant === "footer") {
    const inner = (
      <Image
        src="/footer_logo.svg"
        alt="Asta Collections"
        width={s.mark * 4}
        height={s.mark * 1.6}
        priority
        className={`object-contain h-auto ${lightInvert} ${className}`}
        style={{ width: "auto", maxHeight: s.mark * 2.4 }}
      />
    );
    if (href === null) return inner;
    return (
      <Link href={href} aria-label="Asta Collections — home" className="inline-flex">
        {inner}
      </Link>
    );
  }

  // Wordmark only — decorative text
  if (variant === "wordmark") {
    const inner = (
      <span className={`font-wordmark uppercase tracking-[0.04em] ${s.text} ${textColor} ${className}`}>
        ASTACOLLECTIONS
      </span>
    );
    if (href === null) return inner;
    return <Link href={href} aria-label="Asta Collections — home">{inner}</Link>;
  }

  // Inline (default) and mark variants — uses nav_logo SVG
  const inner = (
    <span className={`inline-flex items-center gap-3 md:gap-4 ${className}`}>
      <Image
        src="/nav_logo.png"
        alt="Asta Collections"
        width={s.mark}
        height={s.mark}
        priority
        className={`shrink-0 object-contain ${lightInvert}`}
        style={{ height: s.mark, width: "auto" }}
      />
      {variant !== "mark" && (
        <span
          className={`font-wordmark uppercase tracking-[0.02em] leading-none ${s.text} ${textColor} whitespace-nowrap`}
        >
          ASTACOLLECTIONS
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} aria-label="Asta Collections — home" className="inline-flex items-center">
      {inner}
    </Link>
  );
}
