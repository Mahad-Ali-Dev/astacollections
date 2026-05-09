# Neon Postgres Setup Guide

This project uses **Postgres** (designed for [Neon](https://neon.tech) but works with any Postgres). The schema is defined in `prisma/schema.prisma`.

---

## 1. Create a Neon project

1. Sign up at https://neon.tech
2. Create a new project (region close to your users — `ap-southeast-1` for South Asia)
3. Note the project's **default branch** name (usually `main`)

---

## 2. Get your two connection strings

In Neon → your project → **Connection Details**:

| Variable | Type | Used by | Copy from |
|---|---|---|---|
| `DATABASE_URL` | Pooled (PgBouncer) | Application runtime | "Pooled connection" toggle ON |
| `DIRECT_URL` | Direct (no pooler) | Migrations | "Pooled connection" toggle OFF |

The two URLs differ only by hostname: pooled has `-pooler` in the host.

Example:
```bash
DATABASE_URL="postgresql://user:pass@ep-cool-cell-12345-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=10"
DIRECT_URL="postgresql://user:pass@ep-cool-cell-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=10"
```

Both URLs need `?sslmode=require`. The pooled URL also needs `pgbouncer=true`.

---

## 3. Set environment variables

### Locally (`.env`)

```bash
DATABASE_URL="<your pooled URL>"
DIRECT_URL="<your direct URL>"
JWT_SECRET="<generate with: openssl rand -hex 32>"
RESEND_API_KEY="re_..."
RESEND_FROM="Asta Collections <orders@your-verified-domain.com>"
NEXT_PUBLIC_SITE_URL="https://astacollections.com"
ADMIN_EMAIL="admin@astacollections.com"
ADMIN_PASSWORD="<a strong password>"
```

### On your host (Vercel / Netlify / Railway / etc.)

Set the same env vars in the project's environment settings.

---

## 4. Initialize the schema and seed

```bash
# Generate Prisma client for your platform
npx prisma generate

# Push the schema to your Neon DB (creates all tables + enums + indexes)
npx prisma db push

# Seed admin user, settings, sample categories/products/coupons/bundles
npx tsx prisma/seed.ts
```

After this you should see ~10 tables in Neon's SQL editor:
- `Admin`, `Customer`, `CustomerAddress`
- `Category`, `Product`, `ProductImage`
- `Bundle`, `BundleItem`
- `Coupon`, `CouponRedemption`
- `Order`, `OrderItem`, `OrderEvent`
- `Review`, `WishlistItem`, `NewsletterSubscriber`
- `EmailLog`, `InventoryLog`
- `Setting`

Plus the Postgres enum types: `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `DiscountType`, `ReviewStatus`, `NewsletterSource`, `EmailKind`, `EmailStatus`, `InventoryReason`, `OrderEventActor`.

---

## 5. Switching to formal migrations

The `db push` approach works for early development. For production you should switch to versioned migrations:

```bash
# Reset and create your first migration
npx prisma migrate dev --name init
```

This generates `prisma/migrations/<timestamp>_init/migration.sql`. Commit it to git.

On deploys, your host runs:
```bash
npx prisma migrate deploy
```

Already wired into `package.json`'s `build` script:
```json
"build": "prisma generate && prisma migrate deploy && next build --webpack"
```

---

## 6. Schema overview

### Core tables
- **Admin** — store staff (email + bcrypt password + name)
- **Customer** — store accounts (orders link by email + optional `customerId`)
- **CustomerAddress** — saved addresses on file (multiple per customer, `isDefault` flag)
- **Category / Product / ProductImage** — catalog
- **Bundle / BundleItem** — multi-product bundles with discount
- **Coupon / CouponRedemption** — discount codes + per-redemption ledger
- **Order / OrderItem / OrderEvent** — orders with denormalized customer snapshot, line items, and status audit trail
- **Review** — customer reviews (moderated)
- **WishlistItem** — heart-toggled products per customer
- **NewsletterSubscriber** — emails captured from welcome popup / footer
- **EmailLog** — every Resend send attempt (success or failure)
- **InventoryLog** — every stock movement (orders, cancellations, admin adjustments)
- **Setting** — site-wide config + admin-managed UI content (hero slides, banners, bank details)

### Enums
All status fields use real Postgres enums for type safety: `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `DiscountType`, `ReviewStatus`, etc.

### Indexes (hot paths)
- `Product.slug` (unique), `(isActive, isFeatured)`, `(isActive, createdAt DESC)`, `(isActive, price)`
- `Order.orderNumber` (unique), `customerEmail`, `customerId`, `(status, createdAt DESC)`, `paymentStatus`
- `OrderEvent (orderId, createdAt DESC)` — for the order timeline
- `EmailLog (orderId)`, `(kind, createdAt DESC)`, `(status)` — for debugging
- `InventoryLog (productId, createdAt DESC)` — for stock-history queries
- `Review (productId, status)` — for "approved reviews on a product"

### Cascading deletes
Removing a `Product` cascades to its `ProductImage`s, `BundleItem`s, `Reviews`, `WishlistItem`s, `InventoryLog`s. Removing a `Customer` cascades to their `CustomerAddress`es and `WishlistItem`s. Removing an `Order` cascades to its `OrderItem`s, `OrderEvent`s, `CouponRedemption`. The `OrderItem.product` relation is **non-cascading** so order history stays intact even if a product is deleted (snapshots are preserved on the `OrderItem` itself).

---

## 7. Why `Float` for money?

The schema uses `Float` (Postgres `DOUBLE PRECISION`) for all monetary fields. For PKR jewellery prices in whole rupees, IEEE-754 double precision is more than enough (15+ significant digits — safe up to ~9 quadrillion rupees).

If you later need sub-rupee precision (e.g. for cents in USD): change `Float` → `Decimal @db.Decimal(10, 2)` in the schema, run a migration, and update display code to use `.toNumber()` on Prisma's `Decimal` returns.

---

## 8. Connection pooling on serverless

Neon's pooled URL uses **PgBouncer in transaction mode**. This works with Prisma but has caveats:
- Prepared statements aren't reused across pool connections (Prisma adapts automatically)
- Some operations (like `prisma migrate`) need a non-pooled connection — that's why we have `DIRECT_URL`

For Vercel / serverless deployments, the pooled URL avoids "too many connections" errors when many Lambda instances spin up simultaneously.

---

## 9. Local development

If you don't want to use Neon for dev, you can run Postgres locally:

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16

# Then set:
DATABASE_URL="postgresql://localhost:5432/asta_dev"
DIRECT_URL="postgresql://localhost:5432/asta_dev"
```

Or use Docker:
```bash
docker run --name asta-postgres -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16
DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:dev@localhost:5432/postgres"
```

---

## 10. Troubleshooting

**`P1001: Can't reach database server`** — usually means `DATABASE_URL` host is wrong or your IP isn't allowed. Neon allows all IPs by default; double-check the URL.

**`P3009: migrate found failed migrations`** — happens if a migration partially applied. In dev: `npx prisma migrate reset` (destroys data!). In prod: open Neon SQL editor and manually fix `_prisma_migrations` table.

**`Server has closed the connection` during `prisma db push`** — you're probably using the pooled URL for migrations. Switch to `DIRECT_URL` (Prisma reads it from the schema's `directUrl` field automatically).

**Slow first query after deploy** — Neon scales-to-zero in inactive branches. The first query on a cold branch takes 1-2s. Subsequent queries are sub-100ms. Disable scale-to-zero in Neon settings if you can't tolerate the cold start.
