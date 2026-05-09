import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email().transform((s) => s.toLowerCase()),
  source: z.enum(["POPUP", "FOOTER", "SIGNUP", "CHECKOUT"]).default("POPUP"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    }

    // Idempotent — if already subscribed, succeed silently
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {}, // don't change source on resubscribe
      create: { email: parsed.data.email, source: parsed.data.source },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
