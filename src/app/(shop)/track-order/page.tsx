import { Package, Truck, MapPin, Clock } from "lucide-react";
import { TrackOrderClient } from "@/components/shop/track-order-client";

export const metadata = {
  title: "Track Your Order",
  description: "Track your Asta Collections order. Enter your order number and email to see status and courier tracking.",
};

export default function TrackOrderPage() {
  return (
    <section className="container py-16 md:py-24 max-w-3xl">
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mx-auto">
          <Package className="h-8 w-8 text-accent" strokeWidth={1.4} />
        </div>
        <p className="eyebrow-accent">Order Tracking</p>
        <h1 className="display-2">Track your order</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter your order number and the email you used at checkout to view live status and
          courier tracking.
        </p>
      </div>

      <TrackOrderClient />

      {/* Status journey */}
      <div className="mt-16 grid sm:grid-cols-4 gap-4 text-center">
        <Step icon={Clock} label="Pending" sub="Order placed" />
        <Step icon={Package} label="Confirmed" sub="Payment verified" />
        <Step icon={Truck} label="Shipped" sub="On its way to you" />
        <Step icon={MapPin} label="Delivered" sub="Arrived safely" />
      </div>
    </section>
  );
}

function Step({
  icon: Icon,
  label,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 card-soft">
      <Icon className="h-5 w-5 text-accent mx-auto mb-2" strokeWidth={1.5} />
      <p className="text-sm font-semibold">{label}</p>
      <p className="eyebrow mt-1">{sub}</p>
    </div>
  );
}
