import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const itemSchema = z.object({
  label: z.string().min(1),
  href: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  openInNewTab: z.boolean().default(false),
});

/** GET — public. Returns the full nav tree (active items only for unauth, all for admin). */
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  const where = admin ? {} : { isActive: true };

  const items = await prisma.navItem.findMany({
    where,
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    include: {
      category: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({ items });
}

/** POST — admin only. Create a nav item. */
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = itemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const data = parsed.data;
    if (!data.href && !data.categoryId) {
      return NextResponse.json(
        { error: "Either href or categoryId is required" },
        { status: 400 }
      );
    }
    const item = await prisma.navItem.create({
      data: {
        label: data.label,
        href: data.href || null,
        categoryId: data.categoryId || null,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        openInNewTab: data.openInNewTab,
      },
    });
    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Create failed" }, { status: 500 });
  }
}
