# Storefront motion system

One timing language: **450 ms, ease-out `cubic-bezier(0.22, 0.61, 0.36, 1)`, opacity + `translate` only** (compositor-friendly, no layout shift). Everything is off under `prefers-reduced-motion` (the last block of the motion section in `src/app/globals.css`). GSAP is no longer shipped to the browser.

| Piece | Where | How |
|---|---|---|
| Scroll reveal | `src/components/motion/reveal.tsx` + `[data-reveal]` CSS | IntersectionObserver. Children fade + rise 14 px, staggered 60 ms, capped at the 5th child. Server HTML is never hidden; only blocks still below the viewport after mount are set to "out", so nothing above the fold waits on JS. |
| Image fade-in | `src/components/ui/fade-image.tsx` + `.img-fade` | Fades a product photo in when it loads. Only hidden if it is still loading after hydration, so a missed load event can't leave a blank. |
| Hover / press | `.press`, card classes | Desktop hover zoom 1.04 on hover-capable devices only; `scale(0.98)` press feedback on touch screens. |
| Links / buttons | `.link-slide`, `group-hover:translate-x-1` | Underline slides in from the left; arrows nudge; colour transitions. |
| Add to bag | `src/lib/use-bump.ts`, `.bag-bounce`, `.count-bump` | Bag icon bounces once and the count pops (header + tab bar); the product button turns green with a tick for 1.6 s. |
| Carousels | `src/components/shop/product-carousel.tsx` | Native scroll-snap (momentum on phones), peek of the next card, dots on phones, arrows on desktop. |
| Page transitions | `src/app/(shop)/template.tsx` + `.page-in` | 260 ms opacity fade on client navigation (`backwards` fill so no stacking context lingers). |
| Accordions | `details::details-content` + `interpolate-size` | Height + opacity transition where the browser supports it; instant elsewhere. |
| Hero | `src/components/shop/hero.tsx` | Admin slides cross-fade; text enters with CSS fade-rise; slow Ken Burns zoom. A filling bar times each slide, pauses on hover or focus, and under reduced motion nothing advances on its own. Phones swipe. |
| Marquees | `animate-marquee` (tailwind) | CSS-only tickers; pause on hover; static and scrollable under reduced motion. |
