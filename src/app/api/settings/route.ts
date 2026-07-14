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

    // Guard: the store must always offer at least one payment method. Evaluate
    // the incoming change against current settings (body may be partial).
    if ("codEnabled" in body || "bankTransferEnabled" in body) {
      const current = await getSettings();
      const cod = (body.codEnabled ?? current.codEnabled) !== "false";
      const bank = (body.bankTransferEnabled ?? current.bankTransferEnabled) !== "false";
      if (!cod && !bank) {
        return NextResponse.json(
          { error: "At least one payment method must stay enabled." },
          { status: 400 }
        );
      }
    }

    await updateSettings(body);
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Update failed" }, { status: 500 });
  }
}
