# Asta Collections — Jewellery Ecommerce

A complete jewellery ecommerce store with storefront and admin panel, built with Next.js 15, Prisma, and Tailwind.

## Features

### Storefront
- Homepage with hero, featured products, categories grid
- Product catalog with sort & filter (by category)
- Category pages with products
- Product detail page with image gallery, variants, related products
- Persistent cart (localStorage) with side drawer + dedicated cart page
- Coupon codes at checkout (percentage + fixed)
- **Two payment methods:**
  - **Cash on Delivery** — customer pays Rs. 250 advance via bank transfer (configurable), balance on delivery
  - **Bank Transfer** — customer transfers full amount, uploads screenshot
- Order confirmation page

### Admin Panel
- Email/password login (JWT-based, httpOnly cookie)
- Dashboard: revenue, orders, low-stock alerts, recent orders
- **Products:** create / edit / delete with multiple images, pricing, compare price, cost price, stock, SEO
- **Categories:** create / edit / delete (blocks delete if products exist)
- **Coupons:** percentage / fixed, min order, max discount, usage limit, start/end dates
- **Orders:** list with status filters, detail view with payment screenshot preview, status updates
- **Settings:** store info, bank details for checkout, COD advance, shipping fee, free-shipping threshold

## Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS with custom gold/serif theme
- Prisma + SQLite (zero-config; swap to PostgreSQL via `DATABASE_URL`)
- Zustand for cart state
- Radix UI primitives + custom components
- `jose` for JWT, `bcryptjs` for password hashing
- `sonner` for toasts
- Local file storage in `public/uploads/`

## Setup

```bash
# 1. Install
npm install

# 2. Generate Prisma client + push schema + seed
npm run setup
```

Or step by step:
```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
```

## Run

```bash
npm run dev
```

Open http://localhost:3000.

### Login
- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login
- Default admin: `admin@astacollections.com` / `admin123` (change in `.env`)

## Important

After **first login**, go to **Admin → Settings** and replace the seeded bank details (HBL / dummy account) with your real bank account info — these are shown to customers at checkout.

## Environment

Copy `.env.example` to `.env` and adjust:
- `DATABASE_URL` — defaults to SQLite (`file:./dev.db`)
- `JWT_SECRET` — **change this in production**
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — used only when seeding
- `NEXT_PUBLIC_CURRENCY_SYMBOL` — `Rs.` by default

## Project Structure

```
src/
├── app/
│   ├── (shop)/          # Storefront pages (home, products, cart, checkout, success)
│   ├── admin/           # Admin panel
│   ├── api/             # REST endpoints (auth, products, orders, coupons, upload, settings)
│   └── globals.css
├── components/
│   ├── ui/              # Buttons, inputs, dialogs, etc.
│   ├── shop/            # Header, footer, product card, cart drawer, checkout client
│   └── admin/           # Admin shell, forms, tables
├── lib/
│   ├── prisma.ts        # Prisma singleton
│   ├── auth.ts          # JWT sign/verify + cookie helpers
│   ├── cart-store.ts    # Zustand cart with persistence
│   ├── settings.ts      # Read/write store settings
│   ├── utils.ts         # cn, formatPrice, slugify, calculateDiscount, ...
│   └── validators.ts    # Zod schemas
└── middleware.ts        # /admin guard
```

## How orders work

1. Customer adds items to cart → goes to `/checkout`.
2. Selects **COD** or **Bank Transfer**:
   - **COD:** sees "advance Rs. 250 must be paid via bank transfer". Bank details displayed. Uploads screenshot. The remaining balance is collected on delivery.
   - **Bank Transfer:** transfers the full amount. Uploads screenshot.
3. Order is created with `status=PENDING`, `paymentStatus=PENDING`. Stock is decremented.
4. Admin sees the order under **Admin → Orders** with the payment screenshot. Verifies and updates status.

## Production notes

- Replace SQLite with PostgreSQL: change `provider` in `prisma/schema.prisma`, set `DATABASE_URL`.
- Use a long random `JWT_SECRET`.
- For uploads on serverless platforms, swap the local-file `/api/upload` for S3/Cloudinary.
- Wire transactional email (e.g. Resend) for order confirmations.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:push` | Sync schema to DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run setup` | Install + push + seed in one shot |
