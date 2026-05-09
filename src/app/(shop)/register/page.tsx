import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerFromCookie } from "@/lib/auth";
import { RegisterForm } from "@/components/shop/auth-forms";
import { Logo } from "@/components/shop/logo";

export const metadata = { title: "Create Account" };

export default async function CustomerRegisterPage() {
  const customer = await getCustomerFromCookie();
  if (customer) redirect("/account");

  return (
    <div className="container py-16 md:py-24 max-w-md">
      <div className="text-center mb-10">
        <div className="inline-flex justify-center">
          <Logo variant="mark" size="lg" href={null} />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl mt-6">Create your account</h1>
        <p className="text-muted-foreground text-sm mt-2">
          It takes a minute. Track orders and manage your wishlist.
        </p>
      </div>
      <div className="bg-white border border-border rounded-3xl p-7 md:p-9 card-soft">
        <RegisterForm />
      </div>
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground font-medium hover:text-accent transition-colors underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
