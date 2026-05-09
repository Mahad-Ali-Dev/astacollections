import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const category = await prisma.category.create({ data: parsed.data });
    return NextResponse.json({ category });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Create failed" }, { status: 500 });
  }
}
