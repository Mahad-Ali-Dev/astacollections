import Image from "next/image";
import { cn } from "@/lib/utils";

/** A mood photo in a rounded frame, or edge to edge when `bleed`. Decorative, so no alt text. */
export function LifestylePhoto({
  src,
  className,
  imageClassName,
  sizes = "100vw",
  bleed,
}: {
  src: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  bleed?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary", !bleed && "rounded-[1.5rem]", className)}>
      <Image src={src} alt="" fill sizes={sizes} className={cn("object-cover", imageClassName)} />
    </div>
  );
}

/**
 * Fades in on the right of a listing page's short header on desktop. Phones skip
 * it, and hidden lazy images don't download, so products stay high and light.
 */
export function HeaderPhoto({ src }: { src: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 [mask-image:linear-gradient(to_right,transparent,black_65%)] md:block"
      aria-hidden="true"
    >
      <Image src={src} alt="" fill sizes="50vw" className="object-cover" />
    </div>
  );
}
