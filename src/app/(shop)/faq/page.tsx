import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { faqJsonLd, jsonLdString, pageMeta } from "@/lib/seo";
import { getStorePolicy, type StorePolicy } from "@/lib/store-policy";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = pageMeta({
  title: "FAQ: Cash on Delivery, Delivery Charges, Returns and Ring Sizes",
  description:
    "How cash on delivery works, delivery charges and times across Pakistan, returns, ring sizes, and how to care for stainless steel jewellery from Asta Collections.",
  path: "/faq",
});

/**
 * Answers that quote a fee or a payment rule are built from the admin
 * settings, so this page can't drift from what checkout actually does (it
 * used to promise a Rs. 250 COD advance and Rs. 5,000 free-shipping line
 * after both had changed).
 */
function buildFaqs(p: StorePolicy) {
  const faqs: { q: string; a: string }[] = [];

  if (p.codEnabled) {
    faqs.push({
      q: "Do you offer cash on delivery?",
      a:
        p.codAdvance > 0
          ? `Yes, across Pakistan. To confirm a cash on delivery order, an advance of ${formatPrice(p.codAdvance)} is paid by bank transfer at checkout, and the rest is paid to the courier when your parcel arrives.`
          : "Yes, across Pakistan. Nothing is paid upfront: you pay the full amount to the courier when your parcel arrives.",
    });
  }
  if (p.bankEnabled) {
    faqs.push({
      q: "How does bank transfer work?",
      a: "Choose Bank Transfer at checkout, send the order amount to the account shown, and upload a screenshot of the transfer. Your order is confirmed once we've verified the payment.",
    });
  }
  faqs.push(
    {
      q: "How much is delivery, and how long does it take?",
      a: `${
        p.shippingFee > 0
          ? `Delivery is ${formatPrice(p.shippingFee)}${
              p.freeShippingThreshold > 0
                ? `, and free on orders of ${formatPrice(p.freeShippingThreshold)} or more`
                : ""
            }.`
          : "Delivery is free."
      } Orders are dispatched within 1–2 business days and usually arrive in 3–5 business days anywhere in Pakistan. You'll get a tracking number once your parcel ships.`,
    },
    {
      q: "What is your jewellery made of?",
      a: "Our pieces are stainless steel with a gold-tone or silver-tone finish, some set with stones, enamel or mother of pearl. Each product page lists the exact materials. We don't sell solid gold or sterling silver.",
    },
    {
      q: "Does stainless steel jewellery tarnish?",
      a: "Stainless steel doesn't tarnish the way silver or brass fashion jewellery can, which makes it good for everyday wear. To keep the finish looking new, put on perfume and lotion before your jewellery, take it off for swimming and cleaning, and wipe it with a soft dry cloth.",
    },
    {
      q: "How do I find my ring size?",
      a: "Most of our rings are adjustable, so one ring fits a range of fingers: gently widen or close the open back. For fixed-size rings, measure the inside diameter of a ring that fits you (in millimetres) and send it to us on WhatsApp, and we'll tell you which size to pick.",
    },
    {
      q: "What's your return policy?",
      a: `You can return a piece within ${p.returnDays} days of delivery if it's unworn and in its original packaging. For hygiene reasons earrings can only be returned if they arrive faulty. Full details are on our Shipping & Returns page.`,
    },
    {
      q: "Can I change my order after placing it?",
      a: "Yes, as long as it hasn't shipped. Message us on WhatsApp or email as soon as possible and we'll do our best to help.",
    },
    {
      q: "Is my payment information safe?",
      a: "We never ask for card details. Bank transfer screenshots are stored only to verify payment and only authorised staff can see them.",
    }
  );
  return faqs;
}

export default async function FaqPage() {
  const faqs = buildFaqs(await getStorePolicy());
  return (
    <section className="container py-16 md:py-24 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(faqJsonLd(faqs)) }}
      />
      <Reveal className="text-center space-y-4 mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Help</p>
        <h1 className="text-4xl md:text-6xl font-serif">Frequently asked questions</h1>
        <p className="text-muted-foreground">
          Can&apos;t find what you&apos;re looking for?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-foreground">
            Get in touch
          </Link>{" "}
          or read our{" "}
          <Link href="/guides" className="underline underline-offset-4 hover:text-foreground">
            jewellery guides
          </Link>
          .
        </p>
      </Reveal>

      <Reveal className="space-y-3" stagger={0.05}>
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group bg-card border rounded-xl p-5 hover:border-accent/50 transition-colors"
          >
            <summary className="font-medium text-base flex items-center justify-between gap-4 list-none cursor-pointer">
              {f.q}
              <span aria-hidden="true" className="text-accent transition-transform group-open:rotate-45 text-xl shrink-0">
                +
              </span>
            </summary>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t">
              {f.a}
            </p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
