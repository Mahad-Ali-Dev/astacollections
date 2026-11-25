import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { WelcomePopup } from "@/components/shop/welcome-popup";
import { WhatsAppWidget } from "@/components/shop/whatsapp-widget";
import { getSettings } from "@/lib/settings";
import { getNavTree } from "@/lib/nav";
import { prisma } from "@/lib/prisma";
import { MobileTabBar } from "@/components/shop/mobile-tab-bar";
import { COLLECTION_COPY } from "@/lib/collection-copy";
import { codLine, getStorePolicy, syncDeliveryAmount } from "@/lib/store-policy";

// Built once and reused; admin saves and orders expire it at once
// (src/lib/storefront.ts). This is only the daily backstop.
export const revalidate = 86400;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, navItems, categories, policy] = await Promise.all([
    getSettings(),
    getNavTree(),
    // Thumbnails for the header mega menu.
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, image: true, parentId: true },
    }),
    getStorePolicy(),
  ]);
  const collections = categories.map((c) => ({
    href: `/category/${c.slug}`,
    name: COLLECTION_COPY[c.slug]?.h1 ?? c.name.trim(),
    image: c.image,
    topLevel: !c.parentId,
  }));
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        // The amount in this admin text follows the free-delivery setting.
        announcementText={syncDeliveryAmount(settings.announcementText, Number(settings.freeShippingThreshold) || 0)}
        announcementCode={settings.announcementCode}
        navItems={navItems}
        collections={collections}
        delivery={{ fee: policy.shippingFee, freeThreshold: policy.freeShippingThreshold, codLabel: codLine(policy) }}
      />
      {/* The footer's bottom padding keeps content clear of the floating phone menu */}
      <main className="flex-1">{children}</main>
      <Footer />
      <WelcomePopup
        enabled={settings.popupEnabled !== "false"}
        image={settings.popupImage}
      />
      <WhatsAppWidget />
      <MobileTabBar />
    </div>
  );
}
