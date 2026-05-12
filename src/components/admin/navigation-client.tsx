"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Loader2, ArrowUp, ArrowDown, ExternalLink, Link as LinkIcon, Folder, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type NavItem = {
  id: string;
  label: string;
  href: string | null;
  categoryId: string | null;
  categoryName: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  openInNewTab: boolean;
};

type Category = { id: string; name: string; slug: string };

const empty = {
  id: "",
  label: "",
  linkType: "category" as "category" | "url",
  categoryId: "",
  href: "",
  parentId: "",
  sortOrder: 0,
  isActive: true,
  openInNewTab: false,
};

export function NavigationClient({
  initial,
  categories,
}: {
  initial: NavItem[];
  categories: Category[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<NavItem[]>(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  // Group into roots + children for rendering
  const roots = items.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
  const childrenOf = (parentId: string) =>
    items.filter((i) => i.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const startNew = (parentId: string = "") => {
    setEditing({ ...empty, parentId, sortOrder: items.filter((i) => i.parentId === (parentId || null)).length });
    setOpen(true);
  };

  const startEdit = (it: NavItem) => {
    setEditing({
      id: it.id,
      label: it.label,
      linkType: it.categoryId ? "category" : "url",
      categoryId: it.categoryId ?? "",
      href: it.href ?? "",
      parentId: it.parentId ?? "",
      sortOrder: it.sortOrder,
      isActive: it.isActive,
      openInNewTab: it.openInNewTab,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing.label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (editing.linkType === "category" && !editing.categoryId) {
      toast.error("Pick a category or switch to custom URL");
      return;
    }
    if (editing.linkType === "url" && !editing.href.trim()) {
      toast.error("Enter a URL or switch to a category link");
      return;
    }

    setSaving(true);
    try {
      const isNew = !editing.id;
      const payload = {
        label: editing.label.trim(),
        href: editing.linkType === "url" ? editing.href.trim() : null,
        categoryId: editing.linkType === "category" ? editing.categoryId : null,
        parentId: editing.parentId || null,
        sortOrder: Number(editing.sortOrder) || 0,
        isActive: editing.isActive,
        openInNewTab: editing.openInNewTab,
      };
      const res = await fetch(isNew ? "/api/nav" : `/api/nav/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isNew ? "Nav item created" : "Nav item updated");
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (it: NavItem) => {
    const hasChildren = items.some((i) => i.parentId === it.id);
    const confirmMsg = hasChildren
      ? `Delete "${it.label}" and all its sub-items?`
      : `Delete "${it.label}"?`;
    if (!confirm(confirmMsg)) return;
    try {
      const res = await fetch(`/api/nav/${it.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Deleted");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  const move = async (it: NavItem, dir: -1 | 1) => {
    const siblings = items.filter((i) => i.parentId === it.parentId).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = siblings.findIndex((s) => s.id === it.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const a = siblings[idx];
    const b = siblings[swapIdx];

    // Optimistic local update
    setItems((prev) =>
      prev.map((p) => {
        if (p.id === a.id) return { ...p, sortOrder: b.sortOrder };
        if (p.id === b.id) return { ...p, sortOrder: a.sortOrder };
        return p;
      })
    );

    try {
      await fetch("/api/nav/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { id: a.id, sortOrder: b.sortOrder },
            { id: b.id, sortOrder: a.sortOrder },
          ],
        }),
      });
      router.refresh();
    } catch {
      toast.error("Reorder failed");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif">Navigation</h1>
          <p className="text-sm text-muted-foreground">
            Customize the navbar menu. Drag/reorder, nest items into dropdowns, link to categories or custom URLs.
          </p>
        </div>
        <Button onClick={() => startNew()} variant="gold">
          <Plus className="h-4 w-4" />
          New Item
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {roots.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">No nav items yet.</p>
            <Button onClick={() => startNew()} variant="gold">
              Add your first nav item
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {roots.map((root, rIdx) => {
              const kids = childrenOf(root.id);
              return (
                <li key={root.id} className="p-4">
                  <NavRow
                    item={root}
                    isFirst={rIdx === 0}
                    isLast={rIdx === roots.length - 1}
                    onMove={move}
                    onEdit={startEdit}
                    onDelete={remove}
                    onAddChild={() => startNew(root.id)}
                  />
                  {kids.length > 0 && (
                    <ul className="mt-3 pl-9 space-y-2 border-l-2 border-dashed border-border ml-3">
                      {kids.map((c, cIdx) => (
                        <li key={c.id} className="pl-4">
                          <NavRow
                            item={c}
                            isFirst={cIdx === 0}
                            isLast={cIdx === kids.length - 1}
                            onMove={move}
                            onEdit={startEdit}
                            onDelete={remove}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing.id ? "Edit Nav Item" : "New Nav Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Label (shown in navbar)</Label>
              <Input
                value={editing.label}
                onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                placeholder="e.g. Bridal, New Arrivals, Gift Cards"
              />
            </div>

            <div>
              <Label>Link type</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, linkType: "category" })}
                  className={`px-3 py-2 rounded-md border text-xs font-medium transition ${
                    editing.linkType === "category"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Folder className="h-3.5 w-3.5 inline mr-1.5" />
                  Category
                </button>
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, linkType: "url" })}
                  className={`px-3 py-2 rounded-md border text-xs font-medium transition ${
                    editing.linkType === "url"
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <LinkIcon className="h-3.5 w-3.5 inline mr-1.5" />
                  Custom URL
                </button>
              </div>
            </div>

            {editing.linkType === "category" ? (
              <div>
                <Label>Category</Label>
                <select
                  value={editing.categoryId}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Select category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (/{c.slug})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <Label>URL</Label>
                <Input
                  value={editing.href}
                  onChange={(e) => setEditing({ ...editing, href: e.target.value })}
                  placeholder="/products?q=pearl or https://..."
                />
              </div>
            )}

            <div>
              <Label>Parent item (for dropdown nesting)</Label>
              <select
                value={editing.parentId}
                onChange={(e) => setEditing({ ...editing, parentId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— None (top-level) —</option>
                {items
                  .filter((i) => !i.parentId && i.id !== editing.id)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      Under: {i.label}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Nested items appear in a dropdown on hover.
              </p>
            </div>

            <div className="flex flex-wrap gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.isActive}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Active (visible)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.openInNewTab}
                  onChange={(e) => setEditing({ ...editing, openInNewTab: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Open in new tab</span>
              </label>
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

function NavRow({
  item,
  isFirst,
  isLast,
  onMove,
  onEdit,
  onDelete,
  onAddChild,
}: {
  item: NavItem;
  isFirst: boolean;
  isLast: boolean;
  onMove: (it: NavItem, dir: -1 | 1) => void;
  onEdit: (it: NavItem) => void;
  onDelete: (it: NavItem) => void;
  onAddChild?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{item.label}</span>
          {!item.isActive && <Badge variant="outline">Hidden</Badge>}
          {item.openInNewTab && (
            <Badge variant="outline" className="text-[10px]">
              <ExternalLink className="h-2.5 w-2.5 mr-1" />
              new tab
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {item.categoryName ? (
            <>
              <Folder className="h-3 w-3 inline mr-1" />
              Category: {item.categoryName}
            </>
          ) : item.href ? (
            <>
              <LinkIcon className="h-3 w-3 inline mr-1" />
              {item.href}
            </>
          ) : (
            "No link set"
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onMove(item, -1)}
          disabled={isFirst}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
          aria-label="Move up"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onMove(item, 1)}
          disabled={isLast}
          className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
          aria-label="Move down"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        {onAddChild && (
          <button
            onClick={onAddChild}
            className="p-1.5 rounded hover:bg-muted text-accent"
            aria-label="Add sub-item"
            title="Add sub-item"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
        <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-muted">
          <Edit className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(item)}
          className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
