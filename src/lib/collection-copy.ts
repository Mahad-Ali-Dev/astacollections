/**
 * Search copy for collection pages, keyed by category slug.
 *
 * Every statement here was checked against the live catalogue (Nov 2026):
 * all pieces are stainless steel with a gold-tone or silver-tone finish, and
 * the "adjustable" notes follow the product tags. Prices are NOT written here;
 * pages pass the live min/max so copy never drifts from the database. When the
 * catalogue changes (a new material, a new category), update this file too.
 *
 * `{range}` in intro text is replaced with the live price range, e.g.
 * "Rs. 699 to Rs. 1,999".
 */
export type CollectionCopy = {
  /** <title> — the target search phrase first, brand appended by the template. */
  title: string;
  /** Visible H1. Several category names in the database are slugs ("couple-rings"). */
  h1: string;
  description: string;
  /** Short paragraphs shown under the product grid. */
  intro: string[];
  faqs: { q: string; a: string }[];
};

const CARE_ANSWER =
  "Stainless steel does not tarnish the way silver or brass fashion jewellery can, so it suits everyday wear. To keep the gold or silver finish looking new, put perfume and lotion on before your jewellery, take pieces off for swimming and cleaning, wipe them with a soft dry cloth, and store them separately so they don't scratch.";

export const COLLECTION_COPY: Record<string, CollectionCopy> = {
  rings: {
    title: "Rings for Girls Online in Pakistan: Stainless Steel Rings",
    h1: "Rings",
    description:
      "Shop stainless steel rings for girls in Pakistan: zircon, enamel, mother of pearl, hexagon and couple rings. Mostly adjustable, cash on delivery nationwide.",
    intro: [
      "Every ring in this collection is made from stainless steel with a gold-tone or silver-tone finish, priced from {range}. Most styles have an adjustable open back, so you can order without knowing your exact ring size.",
      "Browse by style: coloured zircon stones, floral enamel rings, mother of pearl inlays, geometric hexagon rings, minimalist charm rings, and matching ring sets for couples.",
    ],
    faqs: [
      {
        q: "What are Asta Collections rings made of?",
        a: "They are stainless steel with a gold-tone or silver-tone finish. Each product page lists the exact material and any stones, enamel or mother of pearl inlay.",
      },
      {
        q: "How do I choose my ring size?",
        a: "Most of our rings are adjustable, so one ring fits a range of fingers. Rings with fixed sizes show a size selector on the product page. Our ring size guide on the FAQ page explains how to measure at home.",
      },
      { q: "Will a stainless steel ring tarnish?", a: CARE_ANSWER },
    ],
  },
  "zircon-rings": {
    title: "Zircon Rings: Price in Pakistan",
    h1: "Zircon Rings",
    description:
      "Adjustable stainless steel zircon rings in emerald green, sapphire blue, rose pink, ruby red, black and clear stones. Order online with cash on delivery across Pakistan.",
    intro: [
      "Our zircon rings pair a single coloured stone with a stainless steel band, priced from {range}. Every ring here has an adjustable open back, so it fits most fingers without sizing.",
      "Colours include emerald green, sapphire blue, rose quartz pink, ruby red, black onyx-style and clear stones: easy to wear alone or stacked with a plain band.",
    ],
    faqs: [
      {
        q: "Are these zircon rings adjustable?",
        a: "Yes. Every ring in the Zircon collection has an adjustable open back, so you can gently widen or narrow it to fit.",
      },
      {
        q: "What is the band made of?",
        a: "Stainless steel. See each product page for the stone colour and finish.",
      },
    ],
  },
  "couple-rings": {
    title: "Couple Rings Price in Pakistan: Stainless Steel Ring Sets",
    h1: "Couple Rings",
    description:
      "Matching couple ring sets in stainless steel, mostly adjustable, for promise rings, anniversaries and gifts. Cash on delivery across Pakistan.",
    intro: [
      "Matching ring sets for two, made in stainless steel and priced from {range} per set. Styles range from a classic solitaire pair to heart-puzzle rings that fit together, minimalist bands and crown designs.",
      "Most sets are adjustable, which makes them easy to give as a surprise gift: you don't need to know both ring sizes in advance.",
    ],
    faqs: [
      {
        q: "Is the price for one ring or the pair?",
        a: "Each listing named \"Ring Set\" is priced for the set. Check the product title and description for exactly what's included.",
      },
      {
        q: "Do I need to know both ring sizes?",
        a: "Not for most sets. They are adjustable, so each ring can be gently resized to fit. The product page says if a set comes in fixed sizes.",
      },
      {
        q: "Are couple rings a good anniversary or promise gift?",
        a: "They are one of our most popular gifts. Pay by cash on delivery and keep the box for the moment you hand it over.",
      },
    ],
  },
  "enamel-rings": {
    title: "Enamel Rings: Floral Stainless Steel Rings for Girls",
    h1: "Enamel Rings",
    description:
      "Floral and lotus enamel rings in stainless steel, almost all adjustable. Lavender, peach, pink and black enamel designs, delivered across Pakistan.",
    intro: [
      "Hand-coloured enamel details on stainless steel bands, priced from {range}. You'll find lotus, rose bud, sunflower and blossom designs in lavender, peach, pink and black, many with a small pearl accent.",
      "Nearly every ring in this collection is adjustable, so it's an easy gift for sisters, friends and daughters.",
    ],
    faqs: [
      {
        q: "How do I look after enamel rings?",
        a: "Enamel is a glass-like coating, so avoid knocks against hard surfaces and keep perfume and cleaning products off it. Wipe with a soft dry cloth.",
      },
      { q: "Are enamel rings adjustable?", a: "Almost all are. The product page shows if a ring has a fixed size." },
    ],
  },
  "mother-pearl-rings": {
    title: "Mother of Pearl Rings: Gold and Silver Stainless Steel",
    h1: "Mother of Pearl Rings",
    description:
      "Mother of pearl rings with stainless steel bands in gold and silver finishes: signet, column, petal and organic shapes. Mostly adjustable. COD across Pakistan.",
    intro: [
      "Iridescent mother of pearl set into stainless steel, priced from {range}. Shapes include a north-star signet, a regal column, a petal and soft organic forms, in gold-tone and silver-tone finishes.",
      "No two shell inlays look exactly alike, so the shimmer on your ring will differ slightly from the photo.",
    ],
    faqs: [
      {
        q: "Is the mother of pearl real shell?",
        a: "Each product page states the inlay material. Read the Materials line before ordering, as a few designs use an acrylic mother of pearl effect.",
      },
      { q: "How should I clean it?", a: "Wipe gently with a soft dry cloth. Keep shell inlays away from water, perfume and chemicals." },
    ],
  },
  "hexagonal-rings": {
    title: "Hexagon Rings: Geometric Stone Rings",
    h1: "Hexagonal Rings",
    description:
      "\"Geo Lux\" hexagon rings: a geometric stainless steel band with a faceted coloured stone. Pink, emerald, champagne, sapphire and teal. Delivered across Pakistan.",
    intro: [
      "The Geo Lux hexagon rings swap a round band for a six-sided one, finished with a faceted centre stone, from {range}. Colours: pink, emerald, champagne, sapphire and teal.",
      "These rings come in set sizes: choose yours on the product page.",
    ],
    faqs: [
      {
        q: "What size should I order?",
        a: "Pick your size on the product page. If you're between sizes, our FAQ explains how to measure a ring you already own.",
      },
    ],
  },
  "casual-wear-rings": {
    title: "Adjustable Rings for Girls: Everyday Casual Rings",
    h1: "Casual Wear Rings",
    description:
      "Lightweight adjustable stainless steel rings with a gold-tone finish for daily wear: lattice, sunburst, ripple and orbit designs. Cash on delivery in Pakistan.",
    intro: [
      "Easy everyday rings in gold-tone stainless steel, priced from {range}. Every design in this edit is adjustable, so they work for stacking and gifting.",
    ],
    faqs: [{ q: "Can I wear these every day?", a: CARE_ANSWER }],
  },
  "hormony-collection": {
    title: "Harmony Collection: Minimalist Charm Rings",
    h1: "Harmony Collection",
    description:
      "Minimalist stainless steel charm rings with infinity, heart, star, flower, clover and butterfly motifs. Fixed sizes, delivered across Pakistan.",
    intro: [
      "Six small-charm rings in stainless steel, priced at {range}: infinity, heart, celestial star, flower, clover and butterfly. Wear one, or stack two or three.",
      "Unlike most of our rings, the Harmony rings come in fixed sizes, so check your size before ordering.",
    ],
    faqs: [
      { q: "Are Harmony rings adjustable?", a: "No, they come in fixed sizes. Choose your size on the product page." },
    ],
  },
  earrings: {
    title: "Stud Earrings for Girls in Pakistan: Stainless Steel Stud Sets",
    h1: "Earrings",
    description:
      "Stainless steel stud earring sets for girls, including 6-pair collections in gold-tone, pearl, crystal and black enamel designs. Cash on delivery across Pakistan.",
    intro: [
      "Our earrings are stud sets in stainless steel, priced from {range}. Many are 6-pair collections, so one order gives you a week of everyday tops.",
    ],
    faqs: [
      {
        q: "How many earrings come in a set?",
        a: "It depends on the set: the \"6-Pair\" collections include six pairs. The product title and description say exactly what's in the box.",
      },
      {
        q: "Can earrings be returned?",
        a: "For hygiene reasons earrings can only be returned if they arrive faulty. See our Shipping & Returns page.",
      },
    ],
  },
  studs: {
    title: "Stud Earrings Set: 6-Pair Stainless Steel Studs",
    h1: "Stud Earrings",
    description:
      "Stud earring sets in stainless steel: 6-pair collections with pearls, crystals, black enamel and gold-tone designs. Delivered across Pakistan, cash on delivery.",
    intro: [
      "Multi-pair stud sets in stainless steel, priced at {range}. Designs mix crystal solitaires, pearls, bows, hearts and black enamel motifs, mostly in a gold-tone finish.",
    ],
    faqs: [
      {
        q: "Can earrings be returned?",
        a: "For hygiene reasons earrings can only be returned if they arrive faulty. See our Shipping & Returns page.",
      },
    ],
  },
  pendant: {
    title: "Pendant Sets for Girls: Necklace and Earring Sets in Pakistan",
    h1: "Pendants & Jewellery Sets",
    description:
      "Stainless steel pendant necklaces and matching necklace and earring sets in gold and silver finishes: clover, heart, Roman numeral and medallion designs. COD in Pakistan.",
    intro: [
      "Pendant necklaces and gift-ready sets in stainless steel, priced from {range}. About half are sets: 3-piece sets and 6-piece necklace and earring sets that match.",
      "Designs include four-leaf clovers, hearts, starbursts, Roman numerals and medallions, in gold-tone, silver-tone and mixed-metal finishes.",
    ],
    faqs: [
      {
        q: "What's included in a 3-piece or 6-piece set?",
        a: "The product description lists every piece. Sets combine a necklace with matching earrings and, in some sets, extra pieces.",
      },
      { q: "Will the chain tarnish?", a: CARE_ANSWER },
    ],
  },
  bracelets: {
    title: "Bracelets for Girls: Price in Pakistan",
    h1: "Bracelets",
    description:
      "Gold-tone stainless steel bracelets for girls: clover link, Roman numeral, flower chain and medallion bangle styles. Cash on delivery across Pakistan.",
    intro: [
      "Chain and link bracelets in gold-tone stainless steel, priced from {range}, including a mother of pearl clover link, Roman numeral designs and a golden flower chain.",
      "Looking for a rigid cuff? See our handcuff bracelets.",
    ],
    faqs: [{ q: "Is a stainless steel bracelet good for daily wear?", a: CARE_ANSWER }],
  },
  "hand-cuff": {
    title: "Handcuff Bracelets for Girls: Gold Stainless Steel Cuffs",
    h1: "Handcuff Bracelets",
    description:
      "Gold-tone stainless steel handcuff bracelets and bangles: clover, heart, Roman numeral, filigree and pearl blossom designs, many with an easy lock. COD across Pakistan.",
    intro: [
      "Statement handcuff bracelets and bangles in gold-tone stainless steel, priced from {range}. Designs include clovers, interlocking hearts, Roman numerals, filigree blossoms and pearl flowers.",
      "Many styles close with an easy lock, so they're simple to put on by yourself.",
    ],
    faqs: [
      {
        q: "Will a handcuff fit my wrist?",
        a: "Check the product page: some cuffs have a hinged easy-open lock and others are flexible spirals. If you're unsure, message us on WhatsApp before ordering.",
      },
      { q: "Does the gold colour fade?", a: CARE_ANSWER },
    ],
  },
  bestsellers: {
    title: "Bestselling Jewellery",
    h1: "Bestsellers",
    description:
      "Our most-ordered stainless steel rings, pendant sets, studs and handcuffs, in one place. Cash on delivery across Pakistan.",
    intro: [
      "The pieces customers order most, from {range}: zircon and enamel rings, pendant sets, stud collections and handcuffs, all in stainless steel.",
    ],
    faqs: [],
  },
};

export function fillRange(text: string, range: string): string {
  return text.replace("{range}", range);
}
