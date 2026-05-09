import { Reveal } from "@/components/motion/reveal";
import { faqJsonLd } from "@/lib/seo";

export const metadata = {
  title: "FAQ — Shipping, Returns, Care, COD & Bank Transfer",
  description: "Answers to common questions about ordering, COD, bank transfer, shipping, returns, and jewellery care from Asta Collections Pakistan.",
};

const FAQS = [
  {
    q: "How does Cash on Delivery work?",
    a: "When you choose COD, an advance of Rs. 250 (the delivery charges) must be paid via bank transfer to confirm your order. The remaining balance is collected by the courier when the order is delivered. You'll see our bank details and upload the screenshot at checkout.",
  },
  {
    q: "How does bank transfer work?",
    a: "Choose 'Bank Transfer' at checkout, transfer the full order amount to the account shown, and upload a screenshot of the transfer. Once we verify the payment, your order is confirmed and shipped.",
  },
  {
    q: "How long does delivery take?",
    a: "Orders are dispatched within 1–2 business days of confirmation. Standard delivery across Pakistan takes 3–5 business days. You'll receive a tracking number once your order ships.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes — orders above Rs. 5,000 ship free anywhere in Pakistan. Below that, our standard shipping fee applies (shown at checkout).",
  },
  {
    q: "What's your return policy?",
    a: "We offer a 7-day return window from the date of delivery. The item must be unworn, in original packaging, and in resaleable condition. Custom or sale pieces may have specific conditions — see the product page.",
  },
  {
    q: "Are your pieces genuine?",
    a: "Every piece description lists the exact material — gold-plated brass, sterling silver, kundan, freshwater pearls, etc. We don't claim solid gold unless the piece is solid gold. Honesty above all.",
  },
  {
    q: "How do I care for my jewellery?",
    a: "Keep pieces dry — remove before showering, swimming or applying perfume. Store separately to avoid scratches. Clean with a soft cloth. Properly cared-for plated jewellery lasts years.",
  },
  {
    q: "Can I exchange or modify my order after placing it?",
    a: "Yes, as long as the order hasn't shipped yet. Contact us via WhatsApp or email as soon as possible — we'll do our best to accommodate.",
  },
  {
    q: "Do you make custom pieces?",
    a: "We take custom requests on a limited basis, particularly for bridal sets. Reach out via WhatsApp or email with your idea — we'll see what's possible.",
  },
  {
    q: "Is my payment information safe?",
    a: "We never store card or bank details. Bank transfer screenshots are stored only to verify payment and are accessible only to authorised staff.",
  },
];

export default function FaqPage() {
  return (
    <section className="container py-16 md:py-24 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS.map((f) => ({ q: f.q, a: f.a })))) }}
      />
      <Reveal className="text-center space-y-4 mb-14">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-medium">Help</p>
        <h1 className="text-4xl md:text-6xl font-serif">Frequently asked questions</h1>
        <p className="text-muted-foreground">
          Can&apos;t find what you&apos;re looking for? Reach out — we&apos;re happy to help.
        </p>
      </Reveal>

      <Reveal className="space-y-3" stagger={0.05}>
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group bg-card border rounded-xl p-5 cursor-pointer hover:border-accent/50 transition-colors"
          >
            <summary className="font-medium text-base flex items-center justify-between gap-4 list-none">
              {f.q}
              <span className="text-accent transition-transform group-open:rotate-45 text-xl shrink-0">
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
