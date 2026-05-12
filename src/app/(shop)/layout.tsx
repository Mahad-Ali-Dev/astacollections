import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { WelcomePopup } from "@/components/shop/welcome-popup";
import { WhatsAppWidget } from "@/components/shop/whatsapp-widget";
import { getSettings } from "@/lib/settings";
import { getNavTree } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, navItems] = await Promise.all([getSettings(), getNavTree()]);
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        announcementText={settings.announcementText}
        announcementCode={settings.announcementCode}
        navItems={navItems}
      />
      <main className="flex-1">{children}</main>
      <Footer />
      <WelcomePopup
        enabled={settings.popupEnabled !== "false"}
        image={settings.popupImage}
      />
      <WhatsAppWidget />
    </div>
  );
}
