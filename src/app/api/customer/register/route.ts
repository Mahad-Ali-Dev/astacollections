import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, setCustomerCookie } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { name, email, password, phone } = parsed.data;

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { name, email, password: hashed, phone: phone || null },
    });

    const token = await signCustomerToken({ id: customer.id, email: customer.email, name: customer.name });
    await setCustomerCookie(token);

    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Registration failed" }, { status: 500 });
  }
}
