"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Image as ImageIcon, Megaphone, Sparkles, BookOpen, Bell, Video, MessageSquareQuote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "./image-upload-field";
import { VideoUploadField } from "./video-upload-field";
import {
  PAGE_SLOTS,
  parseVideoCarouselItemsRaw,
  parseVideoCarouselPlacements,
  parsePlacements,
  type StoreSettings,
  type VideoCarouselItem,
} from "@/lib/settings";
import { toast } from "sonner";

const TABS = [
  { key: "hero", label: "Hero Carousel", icon: ImageIcon },
  { key: "banners", label: "Banners", icon: Megaphone },
  { key: "ribbons", label: "Top Bar & Marquee", icon: Bell },
  { key: "videos", label: "Video Carousel", icon: Video },
  { key: "reviews", label: "Reviews Strip", icon: MessageSquareQuote },
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

  // Placement is a page -> slot map. An empty slot removes the page entirely,
  // which is what "Don't show" means.
  const placements = parseVideoCarouselPlacements(s);
  const setPlacement = (page: string, slot: string) => {
    const next = { ...placements };
    if (slot) next[page] = slot;
    else delete next[page];
    set("videoCarouselPlacements", JSON.stringify(next));
  };

  const reviewPlacements = parsePlacements(s.reviewsStripPlacements);
  const setReviewPlacement = (page: string, slot: string) => {
    const next = { ...reviewPlacements };
    if (slot) next[page] = slot;
    else delete next[page];
    set("reviewsStripPlacements", JSON.stringify(next));
  };

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
            <h2 className="font-semibold">Where it appears</h2>
            <p className="text-xs text-muted-foreground">
              Pick a position per page. Choose <strong>Don&apos;t show</strong> to hide it
              on that page.
            </p>
            <div className="space-y-3">
              {PAGE_SLOTS.map((p) => (
                <div
                  key={p.key}
                  className="grid sm:grid-cols-[160px_1fr] sm:items-center gap-2"
                >
                  <Label className="mb-0">{p.label}</Label>
                  <select
                    value={placements[p.key] ?? ""}
                    onChange={(e) => setPlacement(p.key, e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Don&apos;t show</option>
                    {p.slots.map((slot) => (
                      <option key={slot.key} value={slot.key}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
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

      {/* REVIEWS STRIP */}
      {tab === "reviews" && (
        <div className="space-y-6 max-w-3xl">
          <p className="text-sm text-muted-foreground">
            Shows approved reviews from across the whole catalogue, so it works on
            pages that aren&apos;t about one product. The per-product review section
            on product pages is separate and always shows that product&apos;s own
            reviews.
          </p>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Show the reviews strip</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hidden automatically when there are no approved reviews.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-black"
                  checked={s.reviewsStripEnabled === "true"}
                  onChange={(e) =>
                    set("reviewsStripEnabled", e.target.checked ? "true" : "false")
                  }
                />
                Enabled
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Heading</Label>
                <Input
                  value={s.reviewsStripTitle}
                  onChange={(e) => set("reviewsStripTitle", e.target.value)}
                />
              </div>
              <div>
                <Label>Subheading</Label>
                <Input
                  value={s.reviewsStripSubtitle}
                  onChange={(e) => set("reviewsStripSubtitle", e.target.value)}
                />
              </div>
              <div>
                <Label>How many to show</Label>
                <Input
                  type="number"
                  min={1}
                  max={48}
                  value={s.reviewsStripCount}
                  onChange={(e) => set("reviewsStripCount", e.target.value)}
                />
              </div>
              <div>
                <Label>Minimum rating</Label>
                <select
                  value={s.reviewsStripMinRating}
                  onChange={(e) => set("reviewsStripMinRating", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n === 1 ? "" : "s"} and above
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-black"
                checked={s.reviewsStripShowProduct !== "false"}
                onChange={(e) =>
                  set("reviewsStripShowProduct", e.target.checked ? "true" : "false")
                }
              />
              Show which product each review is for
            </label>
          </section>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Review section on product pages</h2>
            <p className="text-xs text-muted-foreground">
              This is the section headed &ldquo;What our customers say&rdquo; on a
              product page — separate from the strip above.
            </p>
            <div className="space-y-2">
              {[
                {
                  value: "product",
                  label: "Only this product's reviews",
                  hint: "A product with 5 reviews shows 5. The rating describes that piece.",
                },
                {
                  value: "all",
                  label: "Every review in the store",
                  hint: "Each card names the product it's about. The star rating then describes the store, not the piece.",
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-secondary/50"
                >
                  <input
                    type="radio"
                    name="productReviewsScope"
                    className="h-4 w-4 mt-0.5 accent-black"
                    checked={(s.productReviewsScope || "product") === opt.value}
                    onChange={() => set("productReviewsScope", opt.value)}
                  />
                  <span className="text-sm">
                    {opt.label}
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {opt.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold">Where the strip appears</h2>
            <p className="text-xs text-muted-foreground">
              Same positions as the video carousel. Both can share a slot — the
              videos render first.
            </p>
            <div className="space-y-3">
              {PAGE_SLOTS.map((p) => (
                <div key={p.key} className="grid sm:grid-cols-[160px_1fr] sm:items-center gap-2">
                  <Label className="mb-0">{p.label}</Label>
                  <select
                    value={reviewPlacements[p.key] ?? ""}
                    onChange={(e) => setReviewPlacement(p.key, e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Don&apos;t show</option>
                    {p.slots.map((slot) => (
                      <option key={slot.key} value={slot.key}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
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
