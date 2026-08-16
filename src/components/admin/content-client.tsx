"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Image as ImageIcon, Megaphone, Sparkles, BookOpen, Bell, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "./image-upload-field";
import { VideoUploadField } from "./video-upload-field";
import {
  VIDEO_CAROUSEL_PAGES,
  parseVideoCarouselItemsRaw,
  type StoreSettings,
  type VideoCarouselItem,
} from "@/lib/settings";
import { toast } from "sonner";

const TABS = [
  { key: "hero", label: "Hero Carousel", icon: ImageIcon },
  { key: "banners", label: "Banners", icon: Megaphone },
  { key: "ribbons", label: "Top Bar & Marquee", icon: Bell },
  { key: "videos", label: "Video Carousel", icon: Video },
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

  // Video carousel items live as JSON inside a single setting, so edits go
  // through here and get re-serialised on every change.
  const videos = parseVideoCarouselItemsRaw(s.videoCarouselItems);
  const setVideos = (next: VideoCarouselItem[]) =>
    set("videoCarouselItems", JSON.stringify(next));
  const updateVideo = (i: number, patch: Partial<VideoCarouselItem>) =>
    setVideos(videos.map((v, j) => (j === i ? { ...v, ...patch } : v)));

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

      {/* TOP BAR & MARQUEE */}
      {tab === "ribbons" && (
        <div className="space-y-6 max-w-3xl">
          <p className="text-sm text-muted-foreground">
            The thin black bar at the top of every page (announcement) and the rolling
            phrases strip below the homepage hero (marquee).
          </p>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Announcement Bar</h2>
            <div>
              <Label>Announcement text</Label>
              <Input
                value={s.announcementText}
                onChange={(e) => set("announcementText", e.target.value)}
                placeholder="Free shipping above Rs. 5,000 · COD across Pakistan"
              />
            </div>
            <div>
              <Label>Highlighted code (optional)</Label>
              <Input
                value={s.announcementCode}
                onChange={(e) => set("announcementCode", e.target.value)}
                placeholder="WELCOME10"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Appended as &quot;Use {`{CODE}`} for 10% off&quot;. Leave empty to hide.
              </p>
            </div>
            <div className="bg-foreground text-background text-[10px] uppercase tracking-[0.3em] py-2.5 px-4 text-center font-medium rounded">
              <span className="opacity-60 mr-2">PREVIEW:</span>
              {s.announcementText}
              {s.announcementCode && (
                <>
                  {" · Use "}
                  <span className="text-rose-300 font-bold">{s.announcementCode}</span>
                  {" for 10% off"}
                </>
              )}
            </div>
          </section>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Homepage Marquee</h2>
            <div>
              <Label>Phrases (one per line)</Label>
              <Textarea
                value={s.marqueePhrases.split("|").join("\n")}
                onChange={(e) =>
                  set("marqueePhrases", e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).join("|"))
                }
                rows={8}
                placeholder={"Free shipping above Rs. 5,000\nCash on Delivery\nHandcrafted in Pakistan"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Phrases scroll continuously across the strip below the homepage hero.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* VIDEO CAROUSEL */}
      {tab === "videos" && (
        <div className="space-y-6 max-w-3xl">
          <p className="text-sm text-muted-foreground">
            A scrolling strip of short vertical clips. Videos autoplay muted while on
            screen; visitors can unmute one at a time.
          </p>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Show the carousel</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Turn off to hide it everywhere without losing your videos.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-black"
                  checked={s.videoCarouselEnabled === "true"}
                  onChange={(e) =>
                    set("videoCarouselEnabled", e.target.checked ? "true" : "false")
                  }
                />
                Enabled
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Heading</Label>
                <Input
                  value={s.videoCarouselTitle}
                  onChange={(e) => set("videoCarouselTitle", e.target.value)}
                  placeholder="Seen on you"
                />
              </div>
              <div>
                <Label>Subheading</Label>
                <Input
                  value={s.videoCarouselSubtitle}
                  onChange={(e) => set("videoCarouselSubtitle", e.target.value)}
                  placeholder="Real pieces, real light, real people."
                />
              </div>
            </div>
          </section>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Show it on these pages</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {VIDEO_CAROUSEL_PAGES.map((p) => {
                const active = s.videoCarouselPages
                  .split(",")
                  .map((x) => x.trim())
                  .includes(p.key);
                return (
                  <label
                    key={p.key}
                    className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer hover:bg-secondary/50"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-black"
                      checked={active}
                      onChange={(e) => {
                        const current = s.videoCarouselPages
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean);
                        const next = e.target.checked
                          ? Array.from(new Set([...current, p.key]))
                          : current.filter((x) => x !== p.key);
                        set("videoCarouselPages", next.join(","));
                      }}
                    />
                    {p.label}
                  </label>
                );
              })}
            </div>
          </section>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Videos</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVideos([...videos, { url: "" }])}
              >
                Add video
              </Button>
            </div>

            {videos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No videos yet. Click <strong>Add video</strong> to start.
              </p>
            )}

            {videos.map((v, i) => (
              <div key={i} className="border rounded-xl p-4 space-y-3 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Video {i + 1}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={i === 0}
                      onClick={() => {
                        const next = [...videos];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        setVideos(next);
                      }}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={i === videos.length - 1}
                      onClick={() => {
                        const next = [...videos];
                        [next[i + 1], next[i]] = [next[i], next[i + 1]];
                        setVideos(next);
                      }}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setVideos(videos.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <VideoUploadField
                  value={v.url}
                  onChange={(url) => updateVideo(i, { url })}
                  label="Video"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Poster image (optional)</Label>
                    <Input
                      value={v.poster ?? ""}
                      onChange={(e) => updateVideo(i, { poster: e.target.value })}
                      placeholder="https://ik.imagekit.io/…/cover.jpg"
                    />
                  </div>
                  <div>
                    <Label>Links to (optional)</Label>
                    <Input
                      value={v.href ?? ""}
                      onChange={(e) => updateVideo(i, { href: e.target.value })}
                      placeholder="/products/midnight-clover-set"
                    />
                  </div>
                </div>
                <div>
                  <Label>Caption (optional)</Label>
                  <Input
                    value={v.caption ?? ""}
                    onChange={(e) => updateVideo(i, { caption: e.target.value })}
                    placeholder="Midnight Clover set — worn by Ayesha"
                  />
                </div>
              </div>
            ))}
          </section>
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
