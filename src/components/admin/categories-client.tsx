"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/utils";
import { toast } from "sonner";
import { ImageUploadField } from "./image-upload-field";
import { CategoryProductsDialog } from "./category-products-dialog";

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number; extraProducts?: number };
};

const empty = {
  id: "",
  name: "",
  slug: "",
  description: "",
  image: "",
  parentId: "",
  isActive: true,
  sortOrder: 0,
};

export function CategoriesClient({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Cat[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof empty>(empty);
  const [managing, setManaging] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const newCategory = () => {
    setEditing(empty);
    setOpen(true);
  };

  const editCategory = (c: Cat) => {
    setEditing({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? "",
      image: c.image ?? "",
      parentId: c.parentId ?? "",
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing.name || !editing.slug) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const isNew = !editing.id;
      const res = await fetch(
        isNew ? "/api/categories" : `/api/categories/${editing.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editing.name,
            slug: editing.slug,
            description: editing.description || null,
            image: editing.image || null,
            parentId: editing.parentId || null,
            isActive: editing.isActive,
            sortOrder: Number(editing.sortOrder) || 0,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isNew ? "Category created" : "Category updated");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Cat) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Category deleted");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products</p>
        </div>
        <Button onClick={newCategory} variant="gold">
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      <div className="bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/30">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Products</th>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.slug}</td>
                <td className="p-3">
                  {c._count.products + (c._count.extraProducts ?? 0)}
                  {(c._count.extraProducts ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground ml-1.5">
                      ({c._count.extraProducts} added)
                    </span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">{c.sortOrder}</td>
                <td className="p-3">
                  <Badge variant={c.isActive ? "success" : "outline"}>
                    {c.isActive ? "Active" : "Hidden"}
                  </Badge>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setManaging({ id: c.id, name: c.name })}
                    className="px-2.5 py-1.5 text-xs rounded border hover:bg-muted mr-1 align-middle"
                  >
                    Manage products
                  </button>
                  <button onClick={() => editCategory(c)} className="p-2 hover:bg-muted rounded mr-1">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(c)}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {managing && (
        <CategoryProductsDialog
          categoryId={managing.id}
          categoryName={managing.name}
          onClose={() => setManaging(null)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEditing({
                    ...editing,
                    name,
                    slug: editing.slug && editing.id ? editing.slug : slugify(name),
                  });
                }}
                placeholder="e.g. Diamond Rings"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="diamond-rings"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL: /category/{editing.slug || "..."}
              </p>
            </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                placeholder="Short description shown on the category page"
              />
            </div>
            <ImageUploadField
              label="Category Image"
              value={editing.image}
              onChange={(url) => setEditing({ ...editing, image: url })}
              hint="Shown on the homepage Collection grid and the category banner."
              aspect="wide"
            />
            <div>
              <Label>Parent category (for subcategories)</Label>
              <select
                value={editing.parentId}
                onChange={(e) => setEditing({ ...editing, parentId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— None (top-level category) —</option>
                {categories
                  .filter((c) => c.id !== editing.id && !c.parentId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Pick a parent to make this a subcategory (e.g. Chokers under Necklaces).
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.sortOrder}
                  onChange={(e) => {
                    // Allow an empty field mid-edit; "" would otherwise snap
                    // straight back to 0 and fight the cursor.
                    const raw = e.target.value;
                    setEditing({
                      ...editing,
                      sortOrder: raw === "" ? ("" as unknown as number) : Number(raw),
                    });
                  }}
                  onBlur={() =>
                    setEditing((c) => ({ ...c, sortOrder: Number(c.sortOrder) || 0 }))
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lower numbers show first.
                </p>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} variant="gold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
