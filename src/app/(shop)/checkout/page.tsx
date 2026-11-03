import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { CheckoutClient } from "@/components/shop/checkout-client";
import { privatePageMeta } from "@/lib/seo";
import { getStorePolicy } from "@/lib/store-policy";
import { TrustLine } from "@/components/shop/trust-strip";

// Transactional page: kept out of search results.
export const metadata = privatePageMeta("Checkout");

export default async function CheckoutPage() {
  const [settings, policy] = await Promise.all([getSettings(), getStorePolicy()]);
  return (
    <>
      <section className="bg-gradient-to-br from-secondary via-background to-secondary/40 border-b">
        <div className="container py-8 md:py-12">
          <Link
            href="/cart"
            className="text-xs uppercase tracking-[0.3em] text-accent font-medium inline-flex items-center gap-1 hover:gap-2 transition-all"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Bag
          </Link>
          <div className="flex items-end justify-between flex-wrap gap-3 mt-3">
            <div>
              <h1 className="text-3xl md:text-5xl font-serif">
                {settings.checkoutHeading || "Checkout"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {settings.checkoutSubheading || "Almost there — just a few details."}
              </p>
              <div className="mt-3">
                <TrustLine policy={policy} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Secure checkout
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <CheckoutClient settings={settings} />
      </div>
    </>
  );
}
