import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  shortDesc: z.string().optional().nullable(),
  sku: z.string().min(1),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0),
  weight: z.number().positive().optional().nullable(),
  material: z.string().optional().nullable(),
  tags: z.string().default(""),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional().nullable(),
  metaDesc: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  images: z.array(z.string()).default([]),
  videoUrl: z.string().url().optional().nullable(),
});

export const couponSchema = z.object({
  code: z.string().min(1).transform((s) => s.toUpperCase()),
  description: z.string().optional().nullable(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().positive(),
  minOrder: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(0).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Please enter your name"),
  customerEmail: z.string().email("Please enter a valid email"),
  customerPhone: z.string().min(7, "Please enter a valid phone"),
  shippingAddress: z.string().min(5, "Please enter your full address"),
  shippingCity: z.string().min(2, "Please enter your city"),
  shippingArea: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER"]),
  paymentProof: z.string().optional().nullable(),
  couponCode: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().optional(), // optional override (e.g. variant price)
        selectedAttributes: z.record(z.string()).optional().nullable(),
      })
    )
    .min(1, "Cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
