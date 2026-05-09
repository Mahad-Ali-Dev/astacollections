import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminToken, setAdminCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email } });
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(parsed.data.password, admin.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signAdminToken({ id: admin.id, email: admin.email, name: admin.name });
    await setAdminCookie(token);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
