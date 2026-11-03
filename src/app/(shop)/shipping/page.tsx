import { Truck, RefreshCcw, Banknote, Building2, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { pageMeta } from "@/lib/seo";
import { getStorePolicy } from "@/lib/store-policy";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "Shipping, Cash on Delivery and Returns",
  description:
    "Delivery charges and times across Pakistan, how cash on delivery and bank transfer work, and our 7-day return policy at Asta Collections.",
  path: "/shipping",
});

export default async function ShippingPage() {
  // Fees and the COD rule come from the admin settings (display only).
  const policy = await getStorePolicy();
  return (
    <section className="container py-16 md:py-24 max-w-3xl">
      <Reveal className="space-y-4 mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Information</p>
        <h1 className="text-4xl md:text-6xl font-serif">Shipping & Returns</h1>
      </Reveal>

      <Reveal className="space-y-8" stagger={0.08}>
        <Block icon={Truck} title="Shipping">
          <p>We ship across Pakistan via trusted courier partners.</p>
          <ul className="space-y-1.5 list-disc pl-5 text-muted-foreground">
            <li>Orders dispatched within 1–2 business days of confirmation.</li>
            <li>Standard delivery: 3–5 business days nationwide.</li>
            {policy.shippingFee > 0 ? (
              <li>
                Delivery charge: <strong className="text-foreground">{formatPrice(policy.shippingFee)}</strong>
                {policy.freeShippingThreshold > 0 && (
                  <>
                    , <strong className="text-foreground">free</strong> on orders of{" "}
                    {formatPrice(policy.freeShippingThreshold)} or more
                  </>
                )}
                .
              </li>
            ) : (
              <li><strong className="text-foreground">Free delivery</strong> on every order.</li>
            )}
            <li>Tracking number sent once dispatched.</li>
          </ul>
        </Block>

        {policy.codEnabled && (
          <Block icon={Banknote} title="Cash on Delivery">
            {policy.codAdvance > 0 ? (
              <>
                <p>
                  COD is available across Pakistan. To confirm a COD order, an advance of{" "}
                  <strong className="text-foreground">{formatPrice(policy.codAdvance)}</strong> must
                  be paid by bank transfer at checkout. The remaining balance is collected by the
                  courier when your order is delivered.
                </p>
                <p className="text-muted-foreground">
                  Why? It keeps cancellation rates low and lets us ship every confirmed order with care.
                </p>
              </>
            ) : (
              <p>
                COD is available across Pakistan. Nothing is paid upfront: you pay the full amount to
                the courier when your order is delivered.
              </p>
            )}
          </Block>
        )}

        {policy.bankEnabled && (
          <Block icon={Building2} title="Bank Transfer">
            <p>
              Pay the full order amount via bank transfer. The account details are displayed at
              checkout and you&apos;ll upload a screenshot of the transfer. Your order is confirmed
              once we verify the payment (usually within a few hours during business days).
            </p>
          </Block>
        )}

        <Block icon={RefreshCcw} title="Returns">
          <p>
            We offer a <strong className="text-foreground">7-day return window</strong> from the
            date of delivery.
          </p>
          <ul className="space-y-1.5 list-disc pl-5 text-muted-foreground">
            <li>Item must be unworn, in original packaging, in resaleable condition.</li>
            <li>Earrings cannot be returned for hygiene reasons (faulty items excepted).</li>
            <li>Custom or final-sale items may not be eligible — see product page.</li>
            <li>Refund issued via the original payment method within 5–7 business days.</li>
          </ul>
        </Block>

        <Block icon={ShieldCheck} title="Faulty Items">
          <p>
            If a piece arrives damaged or faulty, contact us within 48 hours of delivery with photos
            and we&apos;ll replace or refund it — at our cost. No friction.
          </p>
        </Block>
      </Reveal>
    </section>
  );
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-accent/10 text-accent">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
