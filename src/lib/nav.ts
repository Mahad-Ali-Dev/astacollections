import { prisma } from "./prisma";

export type NavNode = {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: NavNode[];
};

/**
 * Fetch the public navigation tree from the DB.
 * - Only active items
 * - Resolves categoryId → /category/{slug}
 * - Returns top-level items with children nested
 */
export async function getNavTree(): Promise<NavNode[]> {
  const items = await prisma.navItem.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { category: { select: { slug: true } } },
  });

  const idToNode = new Map<string, NavNode & { parentId: string | null }>();
  for (const it of items) {
    const href = it.href || (it.category ? `/category/${it.category.slug}` : "#");
    idToNode.set(it.id, {
      id: it.id,
      label: it.label,
      href,
      openInNewTab: it.openInNewTab,
      children: [],
      parentId: it.parentId,
    });
  }

  const roots: NavNode[] = [];
  for (const node of idToNode.values()) {
    if (node.parentId && idToNode.has(node.parentId)) {
      idToNode.get(node.parentId)!.children.push(stripParent(node));
    } else {
      roots.push(stripParent(node));
    }
  }
  return roots;
}

function stripParent(n: NavNode & { parentId: string | null }): NavNode {
  return { id: n.id, label: n.label, href: n.href, openInNewTab: n.openInNewTab, children: n.children };
}
