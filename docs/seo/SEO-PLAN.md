# Asta Collections: SEO plan

Live domain: **https://astacollections.com** (Vercel). Written 3 Nov 2026.

## 1. What the store actually sells (from the live catalogue)

- 158 active products, 14 collections.
- **Every piece is stainless steel**, with a gold-tone or silver-tone finish. Some have zircon-style stones, enamel, or mother of pearl (a few use an acrylic mother-of-pearl effect).
- Prices run from **Rs. 597 to Rs. 2,999**, with a median of Rs. 999. Every product currently shows a compare-at (sale) price.
- Biggest groups: pendants and sets (45), zircon rings (32), enamel rings (21), handcuffs (13), studs (11), couple rings (9).
- **No bridal, kundan, sterling silver, freshwater pearl or necklace-only collections exist.** The old site copy and meta tags claimed all of these, and the footer, search and home banners linked to `/category/bridal-sets` and `/category/necklaces`, which don't exist.

That changes the keyword strategy. Chasing "bridal jewellery set price in Pakistan" would bring visitors the store can't serve. The winnable territory is **stainless steel / non-tarnish everyday jewellery, rings for girls, couple rings, stud sets, pendant sets and handcuffs** in a Rs. 600–3,000 budget.

## 2. Keyword research (Google autocomplete, gl=pk, 3 Nov 2026)

Autocomplete shows what people in Pakistan actually type. Volumes aren't public, so the targets below are ranked by relevance and intent rather than volume.

| Theme | Phrases Google suggests | Intent | Our page |
|---|---|---|---|
| Material | stainless steel jewellery pakistan · stainless steel jewelry pakistan price / online · stainless steel rings pakistan · stainless steel bracelets pakistan | buy | Home, /products, /category/rings, /category/bracelets |
| Non-tarnish | non tarnish jewelry pakistan · anti tarnish jewellery pakistan · tarnish free jewellery | buy + research | Home and FAQ copy; future guide "Does stainless steel tarnish?" |
| Generic | artificial jewellery online pakistan (with price) · fashion jewellery online pakistan · jewellery online shopping in pakistan with price | buy | /products |
| Rings | rings for girls · rings for girls pakistan / online in pakistan / simple / artificial · ladies ring design · adjustable rings for girls · adjustable rings pakistan | buy | /category/rings, /category/casual-wear-rings |
| Couple | couple rings pakistan (online, price) · couple rings price in pakistan · promise rings pakistan · promise rings for her pakistan | buy + gift | /category/couple-rings |
| Zircon | zircon ring price in pakistan · zircon rings pakistan · zircon rings for women | buy | /category/zircon-rings |
| Enamel / MOP / hexagon | enamel rings pakistan · mother of pearl ring (gold / silver / for women) · hexagon ring | buy | matching collections |
| Earrings | stud earrings for girls (gold design) · tops for girls in pakistan · stud earrings hypoallergenic | buy | /category/studs, /category/earrings |
| Pendants | pendant for girls pakistan · pendant set pakistan · locket for girls · pendant set for girls | buy | /category/pendant |
| Bracelets | bracelet for girls price in pakistan · bracelet for girls with price · handcuff bracelet for girls · handcuff bracelet stainless steel · kada for girls | buy | /category/bracelets, /category/hand-cuff |
| Gifts | gift for wife pakistan · birthday / anniversary / eid gift for wife pakistan | gift | future gift guide |
| Care / how-to | does stainless steel tarnish (in water, turn skin green) · how to clean stainless steel jewelry · ring size pakistan · ring size chart pakistan in cm | research | FAQ now; future guides |
| City | jewellery online lahore · artificial jewellery online lahore / karachi | buy | About + home mention Lahore; don't build thin city pages |

**Who ranks now** (spot check): Daraz, Markaz and small Shopify stores (e.g. shopzefiro.com, jewellerystore.pk). Product pages with a visible PKR price and "price in Pakistan" phrasing win. Daraz lists a stainless steel couple ring set at Rs. 2,358, close to our Rs. 1,499–1,999. jewellerystore.pk ranks with blog posts like "Is stainless steel jewellery good in Pakistan heat?", which shows guides can rank in this niche.

**Skip:** bridal / kundan / gold and silver price queries (no matching stock), "COD jewellery" (autocomplete shows it means Call of Duty or a code list), and wholesale queries.

## 3. Target keyword per page

| URL | Title (as shipped) | Primary target | Secondary |
|---|---|---|---|
| `/` | Asta Collections: Stainless Steel Jewellery Online in Pakistan | stainless steel jewellery pakistan | non tarnish jewellery pakistan, asta collections |
| `/products` | Stainless Steel Jewellery Online in Pakistan: Shop All | artificial / stainless steel jewellery online pakistan with price | fashion jewellery online pakistan |
| `/category/rings` | Rings for Girls Online in Pakistan: Stainless Steel Rings | rings for girls online in pakistan | stainless steel rings pakistan, ladies ring design |
| `/category/couple-rings` | Couple Rings Price in Pakistan: Stainless Steel Ring Sets | couple rings price in pakistan | promise rings pakistan, couple rings pakistan online |
| `/category/zircon-rings` | Zircon Rings: Price in Pakistan | zircon ring price in pakistan | zircon rings for women |
| `/category/enamel-rings` | Enamel Rings: Floral Stainless Steel Rings for Girls | enamel rings pakistan | floral ring |
| `/category/mother-pearl-rings` | Mother of Pearl Rings: Gold and Silver Stainless Steel | mother of pearl ring | mother of pearl ring gold / silver |
| `/category/hexagonal-rings` | Hexagon Rings: Geometric Stone Rings | hexagon ring | geometric ring |
| `/category/casual-wear-rings` | Adjustable Rings for Girls: Everyday Casual Rings | adjustable rings for girls | adjustable rings pakistan |
| `/category/hormony-collection` | Harmony Collection: Minimalist Charm Rings | minimalist charm rings | heart / butterfly ring |
| `/category/earrings` | Stud Earrings for Girls in Pakistan: Stainless Steel Stud Sets | stud earrings for girls | tops for girls in pakistan |
| `/category/studs` | Stud Earrings Set: 6-Pair Stainless Steel Studs | stud earrings set | earring set for girls |
| `/category/pendant` | Pendant Sets for Girls: Necklace and Earring Sets in Pakistan | pendant set for girls pakistan | locket for girls, pendant for girls pakistan |
| `/category/bracelets` | Bracelets for Girls: Price in Pakistan | bracelet for girls price in pakistan | stainless steel bracelets pakistan |
| `/category/hand-cuff` | Handcuff Bracelets for Girls: Gold Stainless Steel Cuffs | handcuff bracelet for girls | kada for girls, handcuff bracelet stainless steel |
| `/category/bestsellers` | Bestselling Jewellery | (brand / internal) | |
| `/products/<slug>` | `<product title>: Price in Pakistan` (added only when the admin title is short and doesn't already say Pakistan) | `<product name> price in pakistan` | |
| `/faq` | FAQ: Cash on Delivery, Delivery Charges, Returns and Ring Sizes | does stainless steel tarnish, ring size | cod jewellery store |

All collection copy lives in `src/lib/collection-copy.ts`. Prices in it are filled live from the database, so they can't go stale.

## 4. Content roadmap (needs the owner's go-ahead)

A small `/guides` section, each post fact-checked, linking into the matching collection:

1. **Does stainless steel jewellery tarnish?** ("does stainless steel tarnish in water / turn skin green", "non tarnish jewelry pakistan"). Say plainly that the gold tone is a finish, not solid gold.
2. **How to clean stainless steel jewellery at home** (autocomplete: with baking soda, vinegar, aluminium foil).
3. **Ring size guide for Pakistan**: measure in mm, plus a printable chart ("ring size pakistan", "ring size chart pakistan in cm").
4. **Couple ring gift guide**: promise, nikkah and anniversary rings under Rs. 2,000.
5. **Gift ideas for her under Rs. 2,000**: Eid, birthday and anniversary ("gift for wife pakistan").

After that: an annual Eid gift guide, and "stud earrings for sensitive ears" (only with sourced facts on 316L / nickel, never claiming "hypoallergenic" unless the supplier certifies it).

## 5. Off-site (owner)

- Instagram and TikTok bios should link to the matching collection pages, not just the home page.
- Ask buyers for reviews on the product page (the form is live). These are the only reviews used for Google star ratings (see the audit).
- A Google Business Profile only fits if there is a pickup point or showroom. For an online-only store, skip it.
