import { PrismaClient, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Curated free Unsplash jewellery photos
const IMG = {
  necklace1: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&auto=format&fit=crop&q=80",
  necklace2: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&auto=format&fit=crop&q=80",
  necklace3: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=900&auto=format&fit=crop&q=80",
  ring1: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900&auto=format&fit=crop&q=80",
  ring2: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=900&auto=format&fit=crop&q=80",
  ring3: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&auto=format&fit=crop&q=80",
  earring1: "https://images.unsplash.com/photo-1635767582909-345788c69757?w=900&auto=format&fit=crop&q=80",
  earring2: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=900&auto=format&fit=crop&q=80",
  earring3: "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=900&auto=format&fit=crop&q=80",
  bracelet1: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900&auto=format&fit=crop&q=80",
  bracelet2: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=900&auto=format&fit=crop&q=80",
  bridal1: "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=900&auto=format&fit=crop&q=80",
  bridal2: "https://images.unsplash.com/photo-1602751584547-2d09bba4ae89?w=900&auto=format&fit=crop&q=80",
  anklet1: "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=900&auto=format&fit=crop&q=80",
};

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@astacollections.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const hashed = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: hashed, name: "Store Admin" },
  });
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);

  // Settings
  const settings: Record<string, string> = {
    storeName: "Asta Collections",
    storeTagline: "Timeless jewellery, crafted with love",
    storeEmail: "contact@astacollections.com",
    storePhone: "+92 326 4348024",
    storeAddress: "Karachi, Pakistan",
    bankName: "Habib Bank Limited",
    bankAccountTitle: "Asta Collections",
    bankAccountNumber: "1234-5678-9012-3456",
    bankIBAN: "PK00HABB0000123456789012",
    codAdvance: "250",
    shippingFee: "0",
    freeShippingThreshold: "5000",
    currency: "PKR",
    currencySymbol: "Rs.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // Categories
  const categories = [
    { name: "Rings", slug: "rings", description: "Elegant rings for every occasion", sortOrder: 1 },
    { name: "Necklaces", slug: "necklaces", description: "Stunning necklaces and pendants", sortOrder: 2 },
    { name: "Earrings", slug: "earrings", description: "Beautiful earrings collection", sortOrder: 3 },
    { name: "Bracelets", slug: "bracelets", description: "Graceful bracelets and bangles", sortOrder: 4 },
    { name: "Bridal Sets", slug: "bridal-sets", description: "Complete bridal jewellery sets", sortOrder: 5 },
    { name: "Anklets", slug: "anklets", description: "Delicate anklets for any look", sortOrder: 6 },
  ];

  const created: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { description: c.description },
      create: c,
    });
    created[c.slug] = cat.id;
  }

  // Products with images
  const products = [
    {
      name: "Royal Pearl Choker Set",
      slug: "royal-pearl-choker-set",
      sku: "ASTA-NK-001",
      description:
        "An exquisite choker set featuring lustrous pearls and delicate gold-plated detailing. Perfect for bridal occasions and formal events. Comes with matching earrings.\n\nThe choker sits comfortably at the base of the neck, drawing the eye upward. The pearls are matched for size and lustre, and the gold-plated brass setting is hypoallergenic.",
      shortDesc: "Lustrous pearl choker with matching earrings",
      price: 8500,
      comparePrice: 12000,
      stock: 15,
      material: "Gold-plated brass with freshwater pearls",
      weight: 45,
      tags: "pearl,bridal,wedding,gold,choker,statement",
      categorySlug: "necklaces",
      isFeatured: true,
      images: [IMG.necklace1, IMG.necklace2, IMG.necklace3],
    },
    {
      name: "Crystal Stud Earrings",
      slug: "crystal-stud-earrings",
      sku: "ASTA-ER-001",
      description:
        "Sparkling crystal stud earrings that add a touch of elegance to any outfit. Hypoallergenic posts make them comfortable for all-day wear.\n\nEach stud features a single, brilliant-cut crystal in a four-prong setting. Perfect for everyday wear or as a subtle accent for formal events.",
      shortDesc: "Sparkling crystal studs",
      price: 1200,
      comparePrice: 1800,
      stock: 50,
      material: "Sterling silver with cubic zirconia",
      weight: 4,
      tags: "crystal,studs,silver,everyday,minimal,sparkle",
      categorySlug: "earrings",
      isFeatured: true,
      images: [IMG.earring1, IMG.earring2],
    },
    {
      name: "Vintage Floral Ring",
      slug: "vintage-floral-ring",
      sku: "ASTA-RG-001",
      description:
        "A stunning vintage-inspired ring featuring intricate floral details and a center stone. Adjustable band fits most ring sizes.\n\nHand-detailed petals frame a faceted center stone. The antique gold finish adds warmth and character — a piece that looks treasured from the moment you put it on.",
      shortDesc: "Vintage floral ring with center stone",
      price: 2200,
      stock: 25,
      material: "Antique gold-plated alloy",
      weight: 6,
      tags: "vintage,floral,gold,antique,statement,unique",
      categorySlug: "rings",
      isFeatured: true,
      images: [IMG.ring1, IMG.ring2, IMG.ring3],
    },
    {
      name: "Kundan Bridal Set",
      slug: "kundan-bridal-set",
      sku: "ASTA-BR-001",
      description:
        "Complete kundan bridal jewellery set including necklace, earrings, maang tikka, and bracelet. The perfect choice for your special day.\n\nEach piece is hand-set with kundan stones in 22k gold-plated settings. The set is designed to be worn together for maximum impact, but each piece holds its own when worn separately.",
      shortDesc: "Complete kundan bridal set",
      price: 25000,
      comparePrice: 35000,
      stock: 8,
      material: "Kundan with gold-plated finish",
      weight: 180,
      tags: "kundan,bridal,wedding,traditional,gold,complete-set,heirloom",
      categorySlug: "bridal-sets",
      isFeatured: true,
      images: [IMG.bridal1, IMG.bridal2, IMG.necklace2],
    },
    {
      name: "Minimalist Gold Bangle",
      slug: "minimalist-gold-bangle",
      sku: "ASTA-BG-001",
      description:
        "Sleek and minimalist gold bangle perfect for everyday wear. Stack with other bracelets for a layered look.\n\nThe smooth, understated finish makes this bangle a versatile go-to. Layer it with other bracelets or wear it solo for a clean, modern look.",
      shortDesc: "Sleek gold bangle for everyday wear",
      price: 1800,
      stock: 30,
      material: "18k gold-plated brass",
      weight: 18,
      tags: "minimal,gold,bangle,everyday,stackable,clean",
      categorySlug: "bracelets",
      images: [IMG.bracelet1, IMG.bracelet2],
    },
    {
      name: "Emerald Drop Earrings",
      slug: "emerald-drop-earrings",
      sku: "ASTA-ER-002",
      description:
        "Stunning emerald drop earrings with intricate gold-plated detailing. Adds a regal touch to any traditional outfit.\n\nThe deep green emerald stones contrast beautifully with the warm gold setting. Lightweight enough for all-day wear despite their dramatic appearance.",
      shortDesc: "Regal emerald drop earrings",
      price: 3500,
      comparePrice: 4500,
      stock: 12,
      material: "Gold-plated with emerald stones",
      weight: 12,
      tags: "emerald,green,traditional,gold,drop,festive,bridal",
      categorySlug: "earrings",
      isFeatured: true,
      images: [IMG.earring2, IMG.earring3, IMG.earring1],
    },
    {
      name: "Statement Layered Necklace",
      slug: "statement-layered-necklace",
      sku: "ASTA-NK-002",
      description:
        "A bold layered necklace that makes a statement. Three layers of gold-toned chains with delicate pendants.\n\nThe layers fall at staggered lengths, creating depth and visual interest. Adjustable clasp lets you wear all three layers or single out one for a softer look.",
      shortDesc: "Bold three-layer statement necklace",
      price: 2800,
      stock: 20,
      material: "Gold-plated alloy",
      weight: 28,
      tags: "layered,gold,statement,modern,bold,party",
      categorySlug: "necklaces",
      images: [IMG.necklace3, IMG.necklace1],
    },
    {
      name: "Silver Anklet Pair",
      slug: "silver-anklet-pair",
      sku: "ASTA-AN-001",
      description:
        "Delicate pair of silver anklets with tiny bells. Adjustable length to fit comfortably.\n\nEach anklet features small bells that chime softly with movement. A subtle, romantic detail that adds personality to summer outfits.",
      shortDesc: "Silver anklets with bells",
      price: 1500,
      stock: 40,
      material: "Sterling silver",
      weight: 14,
      tags: "silver,anklet,bells,delicate,summer,romantic",
      categorySlug: "anklets",
      images: [IMG.anklet1],
    },
    {
      name: "Pearl Solitaire Ring",
      slug: "pearl-solitaire-ring",
      sku: "ASTA-RG-002",
      description:
        "A timeless pearl solitaire on a delicate gold-plated band. Elegant simplicity that pairs with everything in your wardrobe.\n\nThe pearl is hand-selected for lustre and roundness. The slim band sits comfortably under or beside other rings.",
      shortDesc: "Timeless pearl solitaire ring",
      price: 1650,
      comparePrice: 2200,
      stock: 22,
      material: "Gold-plated brass with freshwater pearl",
      weight: 4,
      tags: "pearl,minimal,gold,timeless,solitaire,everyday",
      categorySlug: "rings",
      images: [IMG.ring2, IMG.ring1],
    },
    {
      name: "Diamond-cut Tennis Bracelet",
      slug: "diamond-cut-tennis-bracelet",
      sku: "ASTA-BG-002",
      description:
        "A continuous line of diamond-cut crystals on a flexible setting. Adjustable to fit most wrist sizes comfortably.\n\nThe crystals catch light from every angle thanks to their precision diamond cut. The flexible link setting moves naturally with your wrist.",
      shortDesc: "Sparkling tennis bracelet with crystals",
      price: 4200,
      comparePrice: 5500,
      stock: 14,
      material: "Sterling silver with cubic zirconia",
      weight: 16,
      tags: "tennis,sparkle,silver,crystal,party,formal",
      categorySlug: "bracelets",
      isFeatured: true,
      images: [IMG.bracelet2, IMG.bracelet1],
    },
  ];

  for (const p of products) {
    const { categorySlug, images, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        stock: data.stock,
        price: data.price,
        isActive: true,
        tags: data.tags ?? "",
      },
      create: {
        ...data,
        categoryId: created[categorySlug],
      },
    });
    // Replace images
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: images.map((url, sortOrder) => ({ url, sortOrder, productId: product.id })),
    });
  }

  // Bundles
  const bundles = [
    {
      name: "Bridal Essentials Bundle",
      slug: "bridal-essentials",
      description: "Everything you need for your big day — kundan set, vintage ring, and matching earrings — all bundled at a special price.",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 15,
      sortOrder: 1,
      items: [
        { productSlug: "kundan-bridal-set", quantity: 1 },
        { productSlug: "vintage-floral-ring", quantity: 1 },
        { productSlug: "emerald-drop-earrings", quantity: 1 },
      ],
    },
    {
      name: "Everyday Elegance Set",
      slug: "everyday-elegance",
      description: "The perfect daily layering trio — pearl ring, minimalist bangle, and crystal studs for effortless polish.",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 12,
      sortOrder: 2,
      items: [
        { productSlug: "pearl-solitaire-ring", quantity: 1 },
        { productSlug: "minimalist-gold-bangle", quantity: 1 },
        { productSlug: "crystal-stud-earrings", quantity: 1 },
      ],
    },
    {
      name: "Statement Pair",
      slug: "statement-pair",
      description: "Bold layered necklace + tennis bracelet — the duo that turns any outfit into a moment.",
      discountType: DiscountType.FIXED,
      discountValue: 800,
      sortOrder: 3,
      items: [
        { productSlug: "statement-layered-necklace", quantity: 1 },
        { productSlug: "diamond-cut-tennis-bracelet", quantity: 1 },
      ],
    },
  ];

  for (const b of bundles) {
    const { items: bItems, ...bdata } = b;
    const bundle = await prisma.bundle.upsert({
      where: { slug: b.slug },
      update: { ...bdata },
      create: bdata,
    });
    await prisma.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
    for (let i = 0; i < bItems.length; i++) {
      const product = await prisma.product.findUnique({ where: { slug: bItems[i].productSlug } });
      if (product) {
        await prisma.bundleItem.create({
          data: {
            bundleId: bundle.id,
            productId: product.id,
            quantity: bItems[i].quantity,
            sortOrder: i,
          },
        });
      }
    }
  }

  // Coupons
  const coupons = [
    {
      code: "WELCOME10",
      description: "10% off for new customers",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrder: 1000,
      maxDiscount: 2000,
      usageLimit: 1000,
      isActive: true,
    },
    {
      code: "FLAT500",
      description: "Flat Rs. 500 off on orders above Rs. 3000",
      discountType: DiscountType.FIXED,
      discountValue: 500,
      minOrder: 3000,
      isActive: true,
    },
    {
      code: "BRIDAL20",
      description: "20% off on bridal collection",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrder: 5000,
      maxDiscount: 5000,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
