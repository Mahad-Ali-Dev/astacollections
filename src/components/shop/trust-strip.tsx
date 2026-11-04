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
  cards = false,
}: {
  policy: StorePolicy;
  className?: string;
  /** Two-column, smaller variant for narrow spots (cart, checkout sidebar). */
  compact?: boolean;
  /** Raised white cards with a hover lift (home page). */
  cards?: boolean;
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
        <li
          key={title}
          className={cn(
            "flex items-start gap-3 min-w-0",
            cards &&
              "group/trust rounded-2xl border border-border/70 bg-white p-4 md:p-5 shadow-[0_1px_2px_rgba(40,20,15,0.04),0_10px_28px_-18px_rgba(40,20,15,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(150,90,70,0.45)] motion-reduce:hover:translate-y-0"
          )}
        >
          <span
            className={cn(
              "shrink-0 rounded-full border border-border bg-white text-accent flex items-center justify-center transition-colors duration-300",
              compact ? "h-8 w-8" : "h-10 w-10",
              cards && "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 group-hover/trust:from-accent group-hover/trust:to-accent group-hover/trust:text-accent-foreground"
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
  // Every item draws its "·" in its left padding and the row is pulled left by
  // that padding, so the first item on each wrapped line has its dot clipped.
  const item = "relative pl-6 before:absolute before:left-[0.6rem] before:content-['·']";
  return (
    <p className={cn("overflow-hidden text-xs text-muted-foreground", className)}>
      <span className="-ml-6 flex flex-wrap gap-y-1">
        <span className={item}>{codLine(policy)}</span>
        <span className={item}>{deliveryLine(policy)}</span>
        <span className={item}>
          <Link href="/shipping" className="underline underline-offset-2 hover:text-foreground">
            {policy.returnDays}-day returns
          </Link>
        </span>
      </span>
    </p>
  );
}
