"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "asta_welcome_dismissed_v1";
const SUBSCRIBED_KEY = "asta_newsletter_subscribed";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900&auto=format&fit=crop&q=85";

export function WelcomePopup({
  enabled = true,
  image = DEFAULT_IMAGE,
}: {
  enabled?: boolean;
  image?: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"intro" | "code">("intro");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [enabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    localStorage.setItem(SUBSCRIBED_KEY, email);
    setStep("code");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText("WELCOME10");
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={close} />

      <div className="relative bg-white w-full max-w-3xl rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-2 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 max-h-[92vh]">
        {/* Image side */}
        <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[480px] bg-secondary/50 hidden md:block">
          <Image
            src={image}
            alt="Welcome to Asta Collections"
            fill
            sizes="(max-width: 768px) 0vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
        </div>

        {/* Copy side */}
        <div className="relative p-6 sm:p-8 md:p-10 flex flex-col justify-center overflow-y-auto">
          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {step === "intro" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-[11px] uppercase tracking-[0.3em] font-semibold w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                Welcome
              </div>

              <h2 className="font-serif text-3xl md:text-5xl text-balance leading-[1.05]">
                Get <span className="rose-gold-text italic">10% off</span> your first order
              </h2>

              <p className="text-muted-foreground text-pretty">
                Subscribe and we&apos;ll send you a code right away. Plus you&apos;ll be first to
                hear about new arrivals and private sales.
              </p>

              <form onSubmit={subscribe} className="space-y-3 pt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  className="w-full h-12 px-5 rounded-full border border-border bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full h-12 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow"
                >
                  Get My 10% Off
                </button>
              </form>

              <button
                onClick={close}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline w-fit"
              >
                No thanks, I&apos;ll pay full price
              </button>

              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 pt-1">
                We respect your inbox · Unsubscribe anytime
              </p>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[11px] uppercase tracking-[0.3em] font-semibold w-fit">
                <Check className="h-3.5 w-3.5" />
                You&apos;re in
              </div>

              <h2 className="font-serif text-3xl md:text-5xl text-balance leading-[1.05]">
                Here&apos;s your <span className="rose-gold-text italic">code.</span>
              </h2>

              <p className="text-muted-foreground">
                Use this at checkout for 10% off your first order over Rs. 1,000. Valid for 30 days.
              </p>

              <button
                onClick={copyCode}
                className="w-full bg-secondary border-2 border-dashed border-accent rounded-2xl py-6 px-6 hover:bg-accent/5 transition-colors group"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Tap to copy
                </p>
                <p className="font-mono text-3xl md:text-4xl font-bold tracking-[0.2em] flex items-center justify-center gap-3">
                  WELCOME10
                  {copied ? (
                    <Check className="h-6 w-6 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </p>
              </button>

              <Link
                href="/products"
                onClick={close}
                className="w-full inline-flex items-center justify-center h-12 bg-foreground text-background rounded-full text-xs uppercase tracking-[0.2em] font-semibold hover:bg-accent transition-colors gold-button-glow"
              >
                Start Shopping
              </Link>

              <div className="flex items-center justify-center gap-3 pt-2">
                <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Follow us</p>
                <a
                  href="https://www.instagram.com/astacollections"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2 0 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1 0-1.7.2-2.1.3-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.1.4-.3 1-.3 2.1C2.7 9.3 2.7 9.7 2.7 12s0 2.7.1 3.9c0 1.1.2 1.7.3 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.1 1 .3 2.1.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.2 2.1-.3.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.1-.4.3-1 .3-2.1.1-1.2.1-1.6.1-3.9s0-2.7-.1-3.9c0-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.1-1-.3-2.1-.3C15.5 4 15.1 4 12 4zm0 3c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm0 8.2c1.8 0 3.2-1.4 3.2-3.2 0-1.8-1.4-3.2-3.2-3.2-1.8 0-3.2 1.4-3.2 3.2 0 1.8 1.4 3.2 3.2 3.2zm5.4-8.4c0 .6-.5 1.2-1.2 1.2-.6 0-1.2-.5-1.2-1.2 0-.6.5-1.2 1.2-1.2.7.1 1.2.6 1.2 1.2z"/></svg>
                </a>
                <a
                  href="https://www.tiktok.com/@astacollections"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors"
                  aria-label="TikTok"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1.84-.07Z"/></svg>
                </a>
                <a
                  href="https://www.facebook.com/share/1JaNNBZn93/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-accent transition-colors"
                  aria-label="Facebook"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7C18.3 21.1 22 17 22 12z"/></svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
