import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Shop pages are built at deploy time now (see src/lib/storefront.ts). The
// build renders many pages at once over a single pooled connection, so give
// queued queries longer to wait than the 10 s default. Only during the build:
// live requests keep the normal pool settings from DATABASE_URL.
function buildTimeUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (process.env.NEXT_PHASE !== "phase-production-build" || !url) return undefined;
  if (/[?&]pool_timeout=/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "pool_timeout=120";
}

const datasourceUrl = buildTimeUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
