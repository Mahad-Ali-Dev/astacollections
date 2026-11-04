/**
 * General lifestyle photos (stock, credits in docs/lifestyle-image-credits.tsv).
 * They set the mood only: never use one as a product image, link one as if it
 * shows a product, or make a claim about it. Each ships at 640, 1024 and 1600 px
 * wide; image-loader.ts picks the width.
 */
export const LIFESTYLE = {
  silkBeige: "/images/lifestyle/silk-beige.webp",
  driedStems: "/images/lifestyle/dried-stems.webp",
  driedVase: "/images/lifestyle/dried-vase.webp",
  bouquetHeld: "/images/lifestyle/bouquet-held.webp",
  bouquetHand: "/images/lifestyle/bouquet-hand.webp",
  morningBed: "/images/lifestyle/morning-bed.webp",
  giftBoxes: "/images/lifestyle/gift-boxes.webp",
  giftWrapping: "/images/lifestyle/gift-wrapping.webp",
  womanCream: "/images/lifestyle/woman-cream.webp",
  chai: "/images/lifestyle/chai.webp",
} as const;
