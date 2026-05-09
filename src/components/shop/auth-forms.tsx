"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function LoginForm({ redirect = "/account" }: { redirect?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Sign in failed");
        return;
      }
      toast.success(`Welcome back, ${data.customer.name}`);
      router.push(redirect);
      router.refresh();
    } catch {
      toast.error("Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="you@example.com"
          className="w-full h-12 px-5 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </Field>
      <Field label="Password">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Your password"
            className="w-full h-12 pl-5 pr-12 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
      </button>
      <p className="text-xs text-center text-muted-foreground pt-1">
        <Link href="/register" className="hover:text-foreground transition-colors">
          Don&apos;t have an account? Create one →
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Registration failed");
        return;
      }
      toast.success(`Welcome to Asta, ${data.customer.name}!`);
      router.push("/account");
      router.refresh();
    } catch {
      toast.error("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Full name">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          autoFocus
          placeholder="As on your ID"
          className="w-full h-12 px-5 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          placeholder="you@example.com"
          className="w-full h-12 px-5 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </Field>
      <Field label="Phone (optional)">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="03xx-xxxxxxx"
          className="w-full h-12 px-5 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </Field>
      <Field label="Password">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="w-full h-12 pl-5 pr-12 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </Field>
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
      </button>
      <p className="text-[10px] text-center text-muted-foreground/70 pt-1 uppercase tracking-[0.2em]">
        By signing up you agree to our Terms & Privacy
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
