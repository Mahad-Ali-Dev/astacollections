"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Image as ImageIcon, Megaphone, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "./image-upload-field";
import type { StoreSettings } from "@/lib/settings";
import { toast } from "sonner";

const TABS = [
  { key: "hero", label: "Hero Carousel", icon: ImageIcon },
  { key: "banners", label: "Banners", icon: Megaphone },
  { key: "popup", label: "Welcome Popup", icon: Sparkles },
  { key: "about", label: "About Page", icon: BookOpen },
] as const;

type Tab = (typeof TABS)[number]["key"];

export function ContentClient({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [s, setS] = useState<StoreSettings>(initial);
  const [tab, setTab] = useState<Tab>("hero");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setS({ ...s, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Content saved · changes are live");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif">Site Content</h1>
          <p className="text-sm text-muted-foreground">
            Manage hero carousel, banners, and other section images displayed on the storefront.
          </p>
        </div>
        <Button onClick={save} disabled={saving} variant="gold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                active
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* HERO CAROUSEL */}
      {tab === "hero" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The hero carousel auto-rotates every 6 seconds on the homepage. Configure each slide
            below — image, eyebrow, title (and italic accent), description, and CTAs.
          </p>
          {[1, 2, 3].map((n) => {
            const k = (suffix: string) => `hero${n}${suffix}` as keyof StoreSettings;
            return (
              <section
                key={n}
                className="bg-card border rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-accent text-accent-foreground rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                    {n}
                  </span>
                  <h2 className="font-semibold">Slide {n}</h2>
                </div>

                <ImageUploadField
                  label="Slide Image"
                  value={s[k("Image") as keyof StoreSettings] as string}
                  onChange={(url) => set(k("Image") as any, url as any)}
                  hint="Recommended: 1800×1200px or larger"
                  aspect="wide"
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Eyebrow (small caps line)</Label>
                    <Input
                      value={s[k("Eyebrow") as keyof StoreSettings] as string}
                      onChange={(e) => set(k("Eyebrow") as any, e.target.value as any)}
                    />
                  </div>
                  <div>
                    <Label>Title (first line)</Label>
                    <Input
                      value={s[k("Title") as keyof StoreSettings] as string}
                      onChange={(e) => set(k("Title") as any, e.target.value as any)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Title accent (second line, italic)</Label>
                    <Input
                      value={s[k("Accent") as keyof StoreSettings] as string}
                      onChange={(e) => set(k("Accent") as any, e.target.value as any)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Description</Label>
                    <Textarea
                      value={s[k("Description") as keyof StoreSettings] as string}
                      onChange={(e) => set(k("Description") as any, e.target.value as any)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>CTA Label</Label>
                    <Input
                      value={s[k("CtaLabel") as keyof StoreSettings] as string}
                      onChange={(e) => set(k("CtaLabel") as any, e.target.value as any)}
                    />
                  </div>
                  <div>
                    <Label>CTA Link</Label>
                    <Input
                      value={s[k("CtaHref") as keyof StoreSettings] as string}
                      onChange={(e) => set(k("CtaHref") as any, e.target.value as any)}
                      placeholder="/products"
                    />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* BANNERS */}
      {tab === "banners" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Editorial banners shown across the homepage. Upload product / lifestyle photos that
            match the section copy.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <section className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Bridal Story (full-width)</h2>
              <ImageUploadField
                value={s.bannerBridalImage}
                onChange={(url) => set("bannerBridalImage", url)}
                aspect="portrait"
              />
            </section>

            <section className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Quality Promise (dark banner)</h2>
              <ImageUploadField
                value={s.bannerPromiseImage}
                onChange={(url) => set("bannerPromiseImage", url)}
                aspect="square"
              />
            </section>

            <section className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Dual Banner — Left (Bridal)</h2>
              <ImageUploadField
                value={s.bannerDualLeftImage}
                onChange={(url) => set("bannerDualLeftImage", url)}
                aspect="portrait"
              />
            </section>

            <section className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Dual Banner — Right (Everyday)</h2>
              <ImageUploadField
                value={s.bannerDualRightImage}
                onChange={(url) => set("bannerDualRightImage", url)}
                aspect="portrait"
              />
            </section>
          </div>
        </div>
      )}

      {/* WELCOME POPUP */}
      {tab === "popup" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The welcome popup that appears on a visitor&apos;s first visit, offering them the
            WELCOME10 discount code.
          </p>
          <section className="bg-card border rounded-xl p-6 space-y-4 max-w-2xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={s.popupEnabled === "true"}
                onChange={(e) => set("popupEnabled", e.target.checked ? "true" : "false")}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Show welcome popup on first visit</span>
            </label>
            <ImageUploadField
              label="Popup image"
              value={s.popupImage}
              onChange={(url) => set("popupImage", url)}
              hint="Square or portrait works best — image shows on the left side of the modal."
              aspect="portrait"
            />
          </section>
        </div>
      )}

      {/* ABOUT PAGE */}
      {tab === "about" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Imagery used on the /about page.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <section className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">About — Hero (story image)</h2>
              <ImageUploadField
                value={s.aboutHeroImage}
                onChange={(url) => set("aboutHeroImage", url)}
                aspect="portrait"
              />
            </section>
            <section className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">About — Story detail image</h2>
              <ImageUploadField
                value={s.aboutStoryImage}
                onChange={(url) => set("aboutStoryImage", url)}
                aspect="portrait"
              />
            </section>
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t pt-4 -mx-4 lg:-mx-8 px-4 lg:px-8 flex items-center justify-end">
        <Button onClick={save} disabled={saving} variant="gold" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
