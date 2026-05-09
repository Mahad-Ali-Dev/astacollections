import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { WelcomePopup } from "@/components/shop/welcome-popup";
import { WhatsAppWidget } from "@/components/shop/whatsapp-widget";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
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
