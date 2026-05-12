import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int(),
      parentId: z.string().nullable().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await prisma.$transaction(
      parsed.data.items.map((it) =>
        prisma.navItem.update({
          where: { id: it.id },
          data: {
            sortOrder: it.sortOrder,
            ...(it.parentId !== undefined ? { parentId: it.parentId } : {}),
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Reorder failed" }, { status: 500 });
  }
}
