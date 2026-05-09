import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signCustomerToken, setCustomerCookie } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { email: parsed.data.email } });
    if (!customer) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(parsed.data.password, customer.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signCustomerToken({ id: customer.id, email: customer.email, name: customer.name });
    await setCustomerCookie(token);

    return NextResponse.json({
      success: true,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
