import Link from "next/link";
import { Banknote, Truck, RefreshCcw, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { codLine, deliveryLine, type StorePolicy } from "@/lib/store-policy";

/**
 * Delivery / payment reassurance row. Every figure comes from the admin
 * settings via getStorePolicy(), so it can't contradict what checkout charges.
 */
export function TrustStrip({
  policy,
  className,
  compact = false,
}: {
  policy: StorePolicy;
  className?: string;
  /** Two-column, smaller variant for narrow spots (cart, checkout sidebar). */
  compact?: boolean;
}) {
  const items = [
    { icon: Banknote, title: codLine(policy), sub: policy.bankEnabled ? "or bank transfer" : "Pay when it arrives" },
    {
      icon: Truck,
      title: deliveryLine(policy),
      sub: "3–5 working days nationwide",
    },
    { icon: RefreshCcw, title: `${policy.returnDays}-day returns`, sub: "On unworn pieces" },
    { icon: MessageCircle, title: "WhatsApp support", sub: "Ask us before you order" },
  ];
  return (
    <ul
      className={cn(
        "grid gap-x-4 gap-y-4",
        compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4",
        className
      )}
      aria-label="Delivery and payment"
    >
      {items.map(({ icon: Icon, title, sub }) => (
        <li key={title} className="flex items-start gap-3 min-w-0">
          <span
            className={cn(
              "shrink-0 rounded-full border border-border bg-white text-accent flex items-center justify-center",
              compact ? "h-8 w-8" : "h-10 w-10"
            )}
            aria-hidden="true"
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={1.7} />
          </span>
          <span className="min-w-0">
            <span className={cn("block font-semibold leading-tight", compact ? "text-xs" : "text-sm")}>
              {title}
            </span>
            <span className="block text-xs text-muted-foreground mt-0.5">{sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** One-line version for the top of listing pages. */
export function TrustLine({ policy, className }: { policy: StorePolicy; className?: string }) {
  // Separators are drawn as a ::before on every item but the first, so a
  // wrapped line never ends with a dangling "·".
  const item = "[&:not(:first-child)]:before:content-['·'] [&:not(:first-child)]:before:mr-3";
  return (
    <p className={cn("text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1", className)}>
      <span className={item}>{codLine(policy)}</span>
      <span className={item}>{deliveryLine(policy)}</span>
      <span className={item}>
        <Link href="/shipping" className="underline underline-offset-2 hover:text-foreground">
          {policy.returnDays}-day returns
        </Link>
      </span>
    </p>
  );
}
