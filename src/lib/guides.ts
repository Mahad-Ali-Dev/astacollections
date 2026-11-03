/**
 * Jewellery guides (/guides). Written Nov 2026 and fact-checked against the
 * sources listed on each guide. Claims about OUR products are limited to what
 * the catalogue says (stainless steel, gold-tone / silver-tone finishes,
 * which collections are adjustable). Prices are never written here:
 *
 *   {range:<category-slug>}  live min–max price of that collection
 *   {min:<category-slug>}    live lowest price in that collection
 *   {delivery}               live delivery line from the admin settings
 *
 * are filled in at render time (src/app/(shop)/guides/[slug]/page.tsx).
 * Inline markup: [text](/path) links and **bold**. Nothing else.
 */
export type GuideBlock =
  | string
  | { list: string[]; ordered?: boolean }
  | { table: { head: string[]; rows: string[][]; caption?: string } };

export type Guide = {
  slug: string;
  title: string;
  /** <title>; brand appended by the template. */
  metaTitle: string;
  description: string;
  published: string;
  updated: string;
  readMins: number;
  /** One-paragraph answer shown first (also good for AI answers). */
  summary: string;
  sections: { heading: string; blocks: GuideBlock[] }[];
  faqs: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  /** "Shop the guide": live products from these collections. */
  shop: { heading: string; categorySlugs: string[]; maxPrice?: number };
};

const SOURCES = {
  sciam: {
    label: "Scientific American: Why doesn't stainless steel rust?",
    url: "https://www.scientificamerican.com/article/why-doesnt-stainless-stee",
  },
  livescience: {
    label: "Live Science: Why doesn't stainless steel rust?",
    url: "https://www.livescience.com/chemistry/why-doesn-t-stainless-steel-rust",
  },
  jewelersMutual: {
    label: "Jewelers Mutual: How to clean stainless steel jewelry",
    url: "https://www.jewelersmutual.com/resources/individuals/cleaning/how-clean-stainless-steel-jewelry",
  },
  ringSize: {
    label: "Wikipedia: Ring size (ISO 8653 and US size equivalents)",
    url: "https://en.wikipedia.org/wiki/Ring_size",
  },
};

export const GUIDES: Guide[] = [
  {
    slug: "does-stainless-steel-jewellery-tarnish",
    title: "Does stainless steel jewellery tarnish?",
    metaTitle: "Does Stainless Steel Jewellery Tarnish? An Honest Answer",
    description:
      "Why stainless steel doesn't tarnish like silver, what can still dull or mark it (sweat, chlorine, perfume), and how to keep gold-tone pieces looking new in Pakistan's heat.",
    published: "2026-11-03",
    updated: "2026-11-03",
    readMins: 5,
    summary:
      "Stainless steel does not tarnish the way silver or brass fashion jewellery does, because a thin, invisible layer of chromium oxide protects its surface and re-forms when it's scratched. It isn't indestructible: salt, chlorine and bleach can mark it, lotions and perfume leave a dull film, and on gold-tone pieces the colour is a finish over the steel that can wear with friction over time.",
    sections: [
      {
        heading: "Why stainless steel stays bright",
        blocks: [
          "Stainless steel is iron alloyed with at least about 10.5% chromium. The chromium reacts with oxygen in the air to form a layer of chromium oxide only a few nanometres thick. You can't see it, but it stops oxygen and moisture reaching the iron underneath, so the metal doesn't rust or darken.",
          "If the surface gets scratched, the exposed chromium reacts with the air again and the protective layer re-forms. That is the big difference from silver, which darkens as it reacts with sulphur compounds in the air, and from brass or copper-based fashion jewellery, which can discolour and sometimes leave a green mark on skin.",
        ],
      },
      {
        heading: "What can still dull or mark it",
        blocks: [
          "Stainless means \"stains less\", not \"never stains\". The things that cause trouble are mostly everyday ones:",
          {
            list: [
              "**Salt and chlorine.** Chlorides break down the protective layer. That includes swimming-pool water, sea water, bleach and household cleaners. Long or repeated exposure can leave spots.",
              "**Sweat.** Sweat is salty. In a Lahore or Karachi summer, wipe your rings and bracelets after a long day so salt doesn't sit on them.",
              "**Perfume, lotion and hair products.** These don't corrode steel, but they leave a cloudy film that makes a piece look dull. It washes off (see our [cleaning guide](/guides/how-to-clean-stainless-steel-jewellery)).",
              "**Friction.** Rings and handcuffs rub against desks, bags and each other. Plain steel polishes back easily; a coloured finish is harder to restore.",
            ],
          },
        ],
      },
      {
        heading: "Gold-tone and silver-tone: what's actually on the surface",
        blocks: [
          "All of our jewellery is stainless steel, finished in either a gold tone or a silver tone. On gold-tone pieces the colour is a thin finish bonded to the steel. It is much tougher than the plating on cheap brass jewellery, but it is still a surface layer, so heavy rubbing, abrasive cloths and chemicals will wear it faster.",
          "Silver-tone pieces are usually the polished steel itself, so there is no coating to wear through. If a gold-tone piece is something you'll wear every day, a little care goes a long way:",
          {
            list: [
              "Put jewellery on last, after perfume, lotion and makeup, and take it off first.",
              "Take rings and bracelets off for washing up, cleaning, the gym and swimming.",
              "Wipe with a soft dry cloth after wearing. Never use a scouring pad or toothpaste.",
              "Store pieces separately so they don't scratch each other.",
            ],
          },
        ],
      },
      {
        heading: "A note on sensitive skin",
        blocks: [
          "The stainless steels used for jewellery contain some nickel, held inside the alloy. Most people wear stainless steel without any problem, but if you have a diagnosed nickel allergy, try a piece for a short time first and stop if your skin reacts. We don't describe our jewellery as \"hypoallergenic\", because we can't promise that for every wearer.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I shower with stainless steel jewellery?",
        a: "The steel itself will cope, but soap and shampoo leave a film, and hot water and products wear gold-tone finishes faster. It's best to take it off.",
      },
      {
        q: "Will gold-tone stainless steel fade?",
        a: "Not quickly, but it can wear over time where it rubs, such as the inside of a ring. Keeping it away from chemicals, perfume and abrasive cloths makes the colour last much longer.",
      },
      {
        q: "Does stainless steel turn your finger green?",
        a: "It rarely does. A green mark usually comes from copper alloys such as brass reacting with sweat. If you notice a mark from any piece, clean it and your skin with mild soap and dry well.",
      },
    ],
    sources: [SOURCES.sciam, SOURCES.livescience, SOURCES.jewelersMutual],
    shop: { heading: "Everyday stainless steel pieces", categorySlugs: ["rings", "hand-cuff", "bracelets"] },
  },
  {
    slug: "how-to-clean-stainless-steel-jewellery",
    title: "How to clean stainless steel jewellery at home",
    metaTitle: "How to Clean Stainless Steel Jewellery at Home (Safely)",
    description:
      "A 5-minute way to clean stainless steel rings, pendants and bracelets with warm water and mild soap, plus what to avoid on gold-tone finishes, enamel and mother of pearl.",
    published: "2026-11-03",
    updated: "2026-11-03",
    readMins: 4,
    summary:
      "Soak the piece for a few minutes in warm water with a drop of mild washing-up liquid, brush gently with a soft toothbrush, rinse in clean water and dry completely with a soft cloth. Skip bleach, toothpaste, baking soda and scouring pads, especially on gold-tone pieces, and only wipe (never soak) anything with enamel or mother of pearl.",
    sections: [
      {
        heading: "What you need",
        blocks: [
          {
            list: [
              "Two small bowls of warm (not hot) water",
              "A few drops of mild washing-up liquid",
              "A soft toothbrush (a new, soft one)",
              "A soft, lint-free cloth, such as microfibre or an old cotton T-shirt",
            ],
          },
        ],
      },
      {
        heading: "Step by step",
        blocks: [
          {
            ordered: true,
            list: [
              "Add a few drops of mild soap to one bowl of warm water.",
              "Soak plain steel pieces for about five minutes to loosen oils and dirt. (Skip soaking for enamel or mother of pearl: see below.)",
              "Brush gently with the soft toothbrush, paying attention to clasps, links and the inside of rings.",
              "Rinse in the second bowl of clean water so no soap is left behind, as leftover soap dries to a cloudy film.",
              "Dry completely with a soft cloth, then leave the piece out for a few minutes before you put it away.",
            ],
          },
        ],
      },
      {
        heading: "Gold-tone, enamel, stones and mother of pearl",
        blocks: [
          "**Gold-tone finishes:** use only soap and water and a soft cloth. Abrasive powders, baking soda pastes and rough cloths slowly wear the colour away. Don't use ultrasonic cleaners on plated or coated pieces.",
          "**Enamel and mother of pearl:** these are surface details, not steel. Wipe them with a damp cloth and dry straight away. Don't soak them or use any chemicals. Mother of pearl is a natural shell (or a shell-effect material on some designs: the product page says which) and can lose its shine if it's soaked.",
          "**Set stones:** brush gently around the setting and dry well so water doesn't sit under the stone.",
        ],
      },
      {
        heading: "What not to use",
        blocks: [
          {
            list: [
              "**Bleach or chlorine cleaners.** Chlorides attack the protective layer on stainless steel and can cause spotting.",
              "**Toothpaste, baking soda or scouring pads** on finished or coated pieces. They're abrasive.",
              "**Silver dip or silver polish.** They're made for a different metal and can strip finishes.",
              "**Very hot water.** It's harder on glued stones and enamel.",
            ],
          },
        ],
      },
      {
        heading: "Keep it clean for longer",
        blocks: [
          "Wipe pieces with a dry cloth after wearing, store them in separate pouches or compartments so they don't scratch each other, and keep them somewhere dry rather than in a steamy bathroom. A quick weekly wipe usually means you'll only need a full wash now and then. For why steel behaves the way it does, read [does stainless steel jewellery tarnish?](/guides/does-stainless-steel-jewellery-tarnish)",
        ],
      },
    ],
    faqs: [
      {
        q: "How often should I clean stainless steel jewellery?",
        a: "Wipe it after wearing, and give pieces you wear daily a gentle soap-and-water wash every few weeks, or whenever they look dull.",
      },
      {
        q: "Can I use vinegar?",
        a: "We don't recommend it for gold-tone, enamel or mother of pearl pieces. Mild soap and warm water clean stainless steel jewellery safely.",
      },
    ],
    sources: [SOURCES.jewelersMutual, SOURCES.sciam],
    shop: { heading: "Pieces that are easy to care for", categorySlugs: ["pendant", "studs"] },
  },
  {
    slug: "ring-size-guide",
    title: "Ring size guide: find your size at home",
    metaTitle: "Ring Size Guide for Pakistan: Measure Your Size in mm at Home",
    description:
      "Measure your ring size at home with a ring you own or a strip of paper, then match it to the chart in millimetres. Plus tips for heat, knuckles and buying a ring as a surprise.",
    published: "2026-11-03",
    updated: "2026-11-03",
    readMins: 4,
    summary:
      "The easiest way to find your ring size is to measure the inside diameter of a ring that already fits you, in millimetres, and match it to the chart below. No ring? Wrap a strip of paper around your finger, measure the length, and use the circumference column. Most Asta Collections rings are adjustable, so you only need an exact size for our fixed-size designs.",
    sections: [
      {
        heading: "Do you even need a size?",
        blocks: [
          "Most of our rings have an adjustable open back, including every ring in [Zircon Rings](/category/zircon-rings) and [Casual Wear Rings](/category/casual-wear-rings), nearly all [Enamel Rings](/category/enamel-rings), and most [couple ring sets](/category/couple-rings). The [Hexagonal Rings](/category/hexagonal-rings) and the [Harmony Collection](/category/hormony-collection) come in fixed sizes, so measure before ordering those.",
        ],
      },
      {
        heading: "Method 1: measure a ring that fits",
        blocks: [
          {
            ordered: true,
            list: [
              "Pick a ring that fits the finger you want to wear the new ring on.",
              "Lay it on a ruler and measure straight across the inside, edge to edge, in millimetres. Don't include the metal.",
              "Find the nearest inside diameter in the chart below.",
            ],
          },
        ],
      },
      {
        heading: "Method 2: the paper strip",
        blocks: [
          {
            ordered: true,
            list: [
              "Cut a thin strip of paper about 10 cm long.",
              "Wrap it around the base of your finger. It should be snug, but still slide over your knuckle.",
              "Mark where the paper overlaps, then measure from the end to the mark in millimetres. That's your finger's circumference.",
              "Find the nearest circumference in the chart below.",
            ],
          },
        ],
      },
      {
        heading: "Ring size chart (millimetres)",
        blocks: [
          {
            table: {
              head: ["US size", "Inside diameter", "Inside circumference"],
              rows: [
                ["5", "15.7 mm", "49.3 mm"],
                ["6", "16.5 mm", "51.8 mm"],
                ["7", "17.3 mm", "54.4 mm"],
                ["8", "18.1 mm", "56.9 mm"],
                ["9", "19.0 mm", "59.5 mm"],
                ["10", "19.8 mm", "62.0 mm"],
                ["11", "20.6 mm", "64.6 mm"],
                ["12", "21.4 mm", "67.1 mm"],
              ],
              caption:
                "US sizes per the ISO 8653 relationship: circumference ≈ 36.5 mm + 2.55 mm × size; diameter ≈ 11.63 mm + 0.81 mm × size.",
            },
          },
          "Local jewellers in Pakistan often use their own numbered scale, which doesn't map neatly onto US sizes, so millimetres are the safest way to compare. If you're unsure which size to choose on one of our fixed-size rings, send us your measurement in mm on WhatsApp and we'll tell you.",
        ],
      },
      {
        heading: "Tips for an accurate size",
        blocks: [
          {
            list: [
              "**Measure in the evening.** Fingers are slightly bigger at the end of the day and in hot weather, and smaller in the cold.",
              "**Mind your knuckle.** If your knuckle is wide, choose a size that slides over it, even if it feels a little loose at the base.",
              "**Between two sizes?** Pick the larger one.",
              "**Right and left hands differ.** Your dominant hand is usually a little larger.",
              "**Buying a surprise?** Borrow one of their rings for a minute and measure it, or choose an adjustable design.",
            ],
          },
        ],
      },
      {
        heading: "Adjusting an open-back ring",
        blocks: [
          "Hold the ring with both hands and press the two ends very gently, a millimetre at a time, until it sits comfortably. Avoid bending it back and forth many times, because repeated bending weakens any metal.",
        ],
      },
    ],
    faqs: [
      {
        q: "What ring size is most common for women?",
        a: "It varies a lot by person and finger, so measure rather than guess. If you can't measure, an adjustable ring is the safe choice.",
      },
      {
        q: "Can I return a ring if it doesn't fit?",
        a: "Unworn pieces in their original packaging can be returned within 7 days of delivery. See our Shipping & Returns page for the details.",
      },
    ],
    sources: [SOURCES.ringSize],
    shop: { heading: "Adjustable rings: no sizing needed", categorySlugs: ["zircon-rings", "enamel-rings", "casual-wear-rings"] },
  },
  {
    slug: "couple-rings-guide",
    title: "Couple rings in Pakistan: how to choose a matching set",
    metaTitle: "Couple Rings in Pakistan: How to Choose a Set, Styles and Prices",
    description:
      "How to choose couple rings for a promise, nikkah or anniversary: matching styles, sizing for a surprise, gold vs silver tone, what they cost, and when to order.",
    published: "2026-11-03",
    updated: "2026-11-03",
    readMins: 4,
    summary:
      "A good couple ring set matches your style as a pair and fits both of you without guesswork. Our stainless steel sets currently cost {range:couple-rings} for the set, and most are adjustable, so you can surprise someone without knowing their ring size. Allow about a week for delivery.",
    sections: [
      {
        heading: "What couple rings are for",
        blocks: [
          "Couples in Pakistan give matching rings for all kinds of moments: a promise before a formal engagement, a nikkah or mehndi gift, an anniversary, or simply a reminder of each other. Because they're stainless steel rather than gold, they're an everyday piece you can wear without worrying about the cost of losing one.",
        ],
      },
      {
        heading: "Pick a style you'll both wear",
        blocks: [
          "Our [couple rings collection](/category/couple-rings) has a few distinct looks:",
          {
            list: [
              "**Classic:** a solitaire-style pair, or minimalist silver-tone bands.",
              "**Playful:** heart-puzzle rings that fit together, and \"Love\" heart designs.",
              "**Statement:** antler, crown and ornate scrollwork designs.",
            ],
          },
          "If one of you rarely wears jewellery, go simple: a slim band is far more likely to be worn every day.",
        ],
      },
      {
        heading: "Sizing without spoiling the surprise",
        blocks: [
          "Most of our couple sets are adjustable, so each ring can be gently opened or closed to fit. If you choose a fixed-size set, borrow a ring they already wear and measure the inside diameter. Our [ring size guide](/guides/ring-size-guide) shows how.",
        ],
      },
      {
        heading: "Gold tone or silver tone?",
        blocks: [
          "Match what you both already wear. If one of you wears a gold watch and the other wears silver, a silver-tone pair is the easier neutral. Both finishes are stainless steel underneath. The [tarnish guide](/guides/does-stainless-steel-jewellery-tarnish) explains how to keep them bright.",
        ],
      },
      {
        heading: "What they cost, and when to order",
        blocks: [
          "Our sets currently range from {range:couple-rings} per set, with cash on delivery anywhere in Pakistan. {delivery}. Orders usually arrive in 3–5 working days, so order at least a week before the date, and earlier before Eid or wedding season.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is the price for one ring or both?",
        a: "Listings named \"Ring Set\" are priced for the set. The product title and description say exactly what's included.",
      },
      {
        q: "Can we wear couple rings every day?",
        a: "Yes. Stainless steel suits daily wear. Take them off for swimming and cleaning, and wipe them dry to keep the finish looking new.",
      },
    ],
    sources: [SOURCES.ringSize],
    shop: { heading: "Couple ring sets", categorySlugs: ["couple-rings"] },
  },
  {
    slug: "jewellery-gift-ideas-for-her-under-2000",
    title: "Jewellery gift ideas for her under Rs. 2,000",
    metaTitle: "Jewellery Gift Ideas for Her Under Rs. 2,000 (Eid, Birthday, Anniversary)",
    description:
      "Thoughtful jewellery gifts for a wife, sister, friend or mother under Rs. 2,000: rings, stud sets, pendant sets and handcuffs, with tips on sizing, finish and timing for Eid.",
    published: "2026-11-03",
    updated: "2026-11-03",
    readMins: 4,
    summary:
      "For under Rs. 2,000 you can give a gift that gets worn: an adjustable stone ring, a multi-pair stud set, a pendant and earring set, or a statement handcuff. Match the finish to the jewellery she already wears, choose adjustable designs if you don't know her size, and order a week ahead (more before Eid).",
    sections: [
      {
        heading: "Pick by the person",
        blocks: [
          {
            list: [
              "**She wears jewellery every day:** a simple stone ring from [Zircon Rings](/category/zircon-rings) (currently {range:zircon-rings}). Every one is adjustable.",
              "**She likes to change her look:** a [multi-pair stud set](/category/studs) ({range:studs}). Several sets come with six pairs.",
              "**She loves a matching set:** a [pendant and earring set](/category/pendant), from {min:pendant}.",
              "**She likes a bold piece:** a gold-tone [handcuff bracelet](/category/hand-cuff), from {min:hand-cuff}.",
              "**It's for the two of you:** a [couple ring set](/category/couple-rings). Our [couple rings guide](/guides/couple-rings-guide) helps you choose.",
            ],
          },
        ],
      },
      {
        heading: "Three things to check before you order",
        blocks: [
          {
            ordered: true,
            list: [
              "**Size.** If you don't know her ring size, choose an adjustable ring or skip rings altogether. Studs, pendants and bracelets don't need sizing. See the [ring size guide](/guides/ring-size-guide).",
              "**Finish.** Look at what she already wears. If it's mostly gold, choose gold tone; if it's silver, choose silver tone.",
              "**Packaging.** Some of our sets are described as coming in a gift box. Check the product description if presentation matters.",
            ],
          },
        ],
      },
      {
        heading: "Timing for Eid, birthdays and anniversaries",
        blocks: [
          "Orders usually arrive in 3–5 working days anywhere in Pakistan, and you can pay cash on delivery. {delivery}. Order at least a week before the day, and leave extra time before Eid, when everyone else is ordering too.",
        ],
      },
    ],
    faqs: [
      {
        q: "What if she doesn't like it?",
        a: "Unworn pieces in their original packaging can be returned within 7 days of delivery. Earrings can only be returned if they arrive faulty, for hygiene reasons.",
      },
      {
        q: "Is stainless steel a good gift?",
        a: "Yes, for everyday jewellery. It doesn't tarnish like silver, suits daily wear, and keeps the price low enough that she can actually wear it without worrying.",
      },
    ],
    sources: [],
    shop: {
      heading: "Gift picks under Rs. 2,000",
      categorySlugs: ["zircon-rings", "studs", "pendant", "hand-cuff", "enamel-rings"],
      maxPrice: 2000,
    },
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Guides whose shop section includes one of these collection slugs. */
export function guidesForCollections(slugs: string[]): Guide[] {
  return GUIDES.filter((g) => g.shop.categorySlugs.some((s) => slugs.includes(s)));
}
