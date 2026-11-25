import { revalidatePath } from "next/cache";

// ───────────────────────────────────────────────────────────
//  Storefront refresh
//
//  Shop pages (home, product pages, about, FAQ, shipping, guides)
//  are built once and reused instead of rendering on every visit,
//  which kept the server and database busy for every crawler hit.
//  Any change that can show on those pages (an admin save, a new
//  order changing stock, a review) expires the whole storefront at
//  once, so edits still appear on the next page load.
// ───────────────────────────────────────────────────────────

/** Rebuilt at most once a day if nothing else expires them first. */
export const STOREFRONT_REVALIDATE = 86400;

export function refreshStorefront() {
  revalidatePath("/", "layout");
}

/** Wrap a mutating route handler: refresh the storefront only if it succeeded. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function refreshesStorefront<H extends (...args: any[]) => Promise<Response>>(handler: H): H {
  return (async (...args: Parameters<H>) => {
    const res = await handler(...args);
    if (res.ok) refreshStorefront();
    return res;
  }) as H;
}
