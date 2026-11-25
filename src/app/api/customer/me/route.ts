import { NextResponse } from "next/server";
import { getCustomerFromCookie } from "@/lib/auth";

// The signed-in shopper, for cached pages that need it in the browser
// (e.g. pre-filling the review form). Never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const c = await getCustomerFromCookie();
  return NextResponse.json(
    { customer: c ? { id: c.id, name: c.name, email: c.email } : null },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
