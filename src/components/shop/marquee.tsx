// Pure CSS ticker (was GSAP). The phrase list is rendered twice and the track
// slides by exactly half (tailwind `animate-marquee`), so it loops seamlessly.
// Under prefers-reduced-motion it stops and can be scrolled sideways.

const FALLBACK_PHRASES = [
  "Cash on Delivery",
  "Bank transfer accepted",
  "7-day easy returns",
];

export function Marquee({ phrases }: { phrases?: string[] } = {}) {
  const list = phrases && phrases.length > 0 ? phrases : FALLBACK_PHRASES;
  return (
    <div className="overflow-hidden bg-foreground py-3.5 text-background motion-reduce:overflow-x-auto">
      <div
        className="flex w-max animate-marquee items-center whitespace-nowrap motion-reduce:animate-none"
        style={{ ["--duration" as string]: "45s" }}
      >
        {[...list, ...list].map((p, i) => (
          <div
            key={i}
            aria-hidden={i >= list.length ? true : undefined}
            className="flex items-center gap-5 px-5 text-[11px] font-medium uppercase tracking-[0.28em] text-background/85"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-300" />
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}
