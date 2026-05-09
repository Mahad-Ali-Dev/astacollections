import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerFromCookie } from "@/lib/auth";
import { LoginForm } from "@/components/shop/auth-forms";
import { Logo } from "@/components/shop/logo";

export const metadata = { title: "Sign In" };

export default async function CustomerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const customer = await getCustomerFromCookie();
  if (customer) redirect("/account");
  const sp = await searchParams;

  return (
    <div className="container py-16 md:py-24 max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex justify-center">
          <Logo variant="mark" size="lg" href={null} />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl mt-6">Welcome back</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Sign in to track orders, manage your details, and write reviews.
        </p>
      </div>
      <div className="bg-white border border-border rounded-3xl p-7 md:p-9 card-soft">
        <LoginForm redirect={sp.redirect ?? "/account"} />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-6">
        New here?{" "}
        <Link href="/register" className="text-foreground font-medium hover:text-accent transition-colors underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
