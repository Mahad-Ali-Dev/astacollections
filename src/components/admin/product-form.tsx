"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Film, Loader2, Trash2, Upload, X } from "lucide-react";
import { upload as imagekitUpload } from "@imagekit/javascript";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { slugify, generateSku, formatPrice, getDiscountPercent } from "@/lib/utils";
import { toast } from "sonner";
import { ProductAttributesEditor } from "./product-attributes-editor";

type Category = { id: string; name: string };
type ProductImage = { id?: string; url: string; alt?: string | null };

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  sku: string;
  price: string;
  comparePrice: string;
  costPrice: string;
  stock: string;
  weight: string;
  material: string;
  tags: string;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string;
  metaDesc: string;
  categoryId: string;
  images: string[];
  videoUrl: string | null;
};

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDesc?: string | null;
    sku: string;
    price: number;
    comparePrice?: number | null;
    costPrice?: number | null;
    stock: number;
    weight?: number | null;
    material?: string | null;
    tags?: string | null;
    isFeatured: boolean;
    isActive: boolean;
    metaTitle?: string | null;
    metaDesc?: string | null;
    categoryId: string;
    images: ProductImage[];
    videoUrl?: string | null;
  };
}) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(
    product
      ? {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDesc: product.shortDesc ?? "",
          sku: product.sku,
          price: String(product.price),
          comparePrice: product.comparePrice ? String(product.comparePrice) : "",
          costPrice: product.costPrice ? String(product.costPrice) : "",
          stock: String(product.stock),
          weight: product.weight ? String(product.weight) : "",
          material: product.material ?? "",
          tags: product.tags ?? "",
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          metaTitle: product.metaTitle ?? "",
          metaDesc: product.metaDesc ?? "",
          categoryId: product.categoryId,
          images: product.images.map((i) => i.url),
          videoUrl: product.videoUrl ?? null,
        }
      : {
          name: "",
          slug: "",
          description: "",
          shortDesc: "",
          sku: generateSku(),
          price: "",
          comparePrice: "",
          costPrice: "",
          stock: "0",
          weight: "",
          material: "",
          tags: "",
          isFeatured: false,
          isActive: true,
          metaTitle: "",
          metaDesc: "",
          categoryId: categories[0]?.id ?? "",
          images: [],
          videoUrl: null,
        }
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const update =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      toast.success("Image uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadImage);
  };

  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }));

  const moveImage = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= form.images.length) return;
    const arr = [...form.images];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setForm((f) => ({ ...f, images: arr }));
  };

  // Direct-to-ImageKit upload for product videos. The server only mints a signed
  // upload token; the browser streams the file straight to ImageKit's CDN. This
  // bypasses Vercel's 4.5MB function body limit and avoids consuming Vercel
  // Blob bandwidth.
  const uploadVideo = async (file: File) => {
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) {
      toast.error("Video must be under 50MB. Try compressing it first.");
      return;
    }
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
      toast.error("Only MP4, WebM, or MOV videos are supported");
      return;
    }
    setVideoUploading(true);
    setVideoProgress(0);
    try {
      // 1. Ask our server for a fresh signed upload token.
      const authRes = await fetch("/api/upload/video");
      if (!authRes.ok) {
        const err = await authRes.json().catch(() => ({}));
        throw new Error(err?.error ?? "Could not authorize upload");
      }
      const auth: {
        token: string;
        expire: number;
        signature: string;
        publicKey: string;
        urlEndpoint: string;
      } = await authRes.json();

      // Generate the same kind of filename we used previously so URLs stay
      // consistent across the catalog.
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      // 2. Stream directly to ImageKit. The SDK handles XHR progress events.
      const uploaded = await imagekitUpload({
        file,
        fileName: filename,
        folder: "/products/videos",
        useUniqueFileName: false,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        publicKey: auth.publicKey,
        onProgress: (e) => {
          if (e.lengthComputable) {
            setVideoProgress(Math.round((e.loaded / e.total) * 100));
          }
        },
      });

      setForm((f) => ({ ...f, videoUrl: uploaded.url ?? null }));
      toast.success("Video uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Video upload failed");
    } finally {
      setVideoUploading(false);
      setVideoProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const removeVideo = () => setForm((f) => ({ ...f, videoUrl: null }));

  const save = async () => {
    if (!form.name || !form.sku || !form.slug || !form.price || !form.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }
    const price = Number(form.price);
    if (!price || price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        shortDesc: form.shortDesc || null,
        sku: form.sku,
        price,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        stock: Number(form.stock) || 0,
        weight: form.weight ? Number(form.weight) : null,
        material: form.material || null,
        tags: form.tags || "",
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        metaTitle: form.metaTitle || null,
        metaDesc: form.metaDesc || null,
        categoryId: form.categoryId,
        images: form.images,
        videoUrl: form.videoUrl,
      };
      const isNew = !form.id;
      const res = await fetch(isNew ? "/api/products" : `/api/products/${form.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isNew ? "Product created" : "Product updated");
      router.push("/admin/products");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${form.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Product deleted");
      router.push("/admin/products");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const discountPct = getDiscountPercent(
    Number(form.price) || 0,
    Number(form.comparePrice) || null
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-serif">
            {form.id ? "Edit Product" : "New Product"}
          </h1>
        </div>
        {form.id && (
          <Button variant="outline" size="sm" onClick={remove} disabled={deleting}>
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </Button>
        )}
        <Button onClick={save} disabled={saving} variant="gold">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Product"
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Basic Information</h2>
            <div>
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({
                    ...form,
                    name,
                    slug: form.slug && form.id ? form.slug : slugify(name),
                  });
                }}
                placeholder="e.g. Royal Pearl Choker Set"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={update("slug")} placeholder="royal-pearl-choker-set" />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input value={form.sku} onChange={update("sku")} placeholder="ASTA-NK-001" />
              </div>
            </div>
            <div>
              <Label>Short Description</Label>
              <Input
                value={form.shortDesc}
                onChange={update("shortDesc")}
                placeholder="One-line tagline shown on cards"
              />
            </div>
            <div>
              <Label>Full Description *</Label>
              <Textarea
                value={form.description}
                onChange={update("description")}
                placeholder="Detailed product description..."
                rows={6}
              />
            </div>
          </section>

          {/* Pricing */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Pricing & Inventory</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Price (Rs.) *</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={update("price")}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <Label>Compare Price (was)</Label>
                <Input
                  type="number"
                  value={form.comparePrice}
                  onChange={update("comparePrice")}
                  placeholder="Higher price (struck through)"
                  min="0"
                />
                {discountPct > 0 && (
                  <p className="text-xs text-green-700 mt-1">{discountPct}% off shown</p>
                )}
              </div>
              <div>
                <Label>Cost Price (internal)</Label>
                <Input
                  type="number"
                  value={form.costPrice}
                  onChange={update("costPrice")}
                  placeholder="Your cost"
                  min="0"
                />
              </div>
            </div>
            <Separator />
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Stock *</Label>
                <Input type="number" value={form.stock} onChange={update("stock")} min="0" />
              </div>
              <div>
                <Label>Weight (g)</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={update("weight")}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label>Material</Label>
                <Input
                  value={form.material}
                  onChange={update("material")}
                  placeholder="e.g. Gold-plated brass"
                />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={update("tags")}
                placeholder="e.g. pearl, bridal, gold, statement (comma-separated)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Tags help customers find this product via search and related-product suggestions.
              </p>
              {form.tags && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2 py-0.5 bg-secondary border rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* Images */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.images.map((url, i) => (
                <div key={url} className="relative aspect-square border rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">
                      MAIN
                    </span>
                  )}
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-background/80 backdrop-blur p-1 rounded opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveImage(i, -1)}
                      disabled={i === 0}
                      className="bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-xs disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(i, 1)}
                      disabled={i === form.images.length - 1}
                      className="bg-background/80 backdrop-blur px-1.5 py-0.5 rounded text-xs disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent text-muted-foreground hover:text-accent">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs">Add image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              First image is the main product image. PNG, JPG, WEBP up to 5MB each.
            </p>
          </section>

          {/* Product video — optional, plays muted on hover in grid */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Film className="h-4 w-4" /> Product Video
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Optional short clip. Plays muted on hover in the product grid and
                  with full controls on the product page. MP4, WebM, or MOV up to 50MB.
                </p>
              </div>
            </div>

            {form.videoUrl ? (
              <div className="relative max-w-md">
                <video
                  src={form.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full aspect-video rounded-lg bg-black object-cover"
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-background/90 backdrop-blur p-1.5 rounded-full shadow"
                  aria-label="Remove video"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="text-[11px] text-muted-foreground mt-2 break-all">
                  {form.videoUrl}
                </p>
              </div>
            ) : (
              <label className="block max-w-md aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent text-muted-foreground hover:text-accent transition">
                {videoUploading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    <span className="text-xs">
                      Uploading{videoProgress > 0 ? ` — ${videoProgress}%` : "..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Film className="h-7 w-7 mb-1.5" />
                    <span className="text-sm font-medium">Add product video</span>
                    <span className="text-[11px] mt-0.5">MP4 / WebM / MOV · up to 50MB</span>
                  </>
                )}
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  disabled={videoUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadVideo(f);
                  }}
                />
              </label>
            )}
          </section>

          {/* ATTRIBUTES (size / color / etc.) */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <div>
              <h2 className="font-semibold">Variants & Attributes</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Size, color, length etc. Customers pick one of each on the product page.
              </p>
            </div>
            <ProductAttributesEditor productId={form.id ?? null} />
          </section>

          {/* SEO */}
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">SEO (optional)</h2>
            <div>
              <Label>Meta Title</Label>
              <Input value={form.metaTitle} onChange={update("metaTitle")} />
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={form.metaDesc} onChange={update("metaDesc")} rows={2} />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="font-semibold">Organization</h2>
            <div>
              <Label>Category *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="bg-card border rounded-lg p-6 space-y-3">
            <h2 className="font-semibold">Visibility</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Active (visible on store)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Featured on homepage</span>
            </label>
          </section>

          {form.price && (
            <section className="bg-muted/50 border rounded-lg p-4 space-y-1 text-xs">
              <p className="font-semibold mb-2">Preview</p>
              <p>Price: {formatPrice(Number(form.price))}</p>
              {form.comparePrice && Number(form.comparePrice) > Number(form.price) && (
                <p className="text-muted-foreground">
                  Was: <span className="line-through">{formatPrice(Number(form.comparePrice))}</span>{" "}
                  ({discountPct}% off)
                </p>
              )}
              {form.costPrice && Number(form.costPrice) > 0 && (
                <p className="text-muted-foreground">
                  Margin:{" "}
                  {formatPrice(Number(form.price) - Number(form.costPrice))} (
                  {Math.round(
                    ((Number(form.price) - Number(form.costPrice)) / Number(form.price)) * 100
                  )}
                  %)
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
