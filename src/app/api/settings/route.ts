import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/settings";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    await updateSettings(body);
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}
