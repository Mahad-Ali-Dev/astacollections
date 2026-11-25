import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { applySale, endSale, getSaleSummary } from "@/lib/store-sale";
import { refreshesStorefront } from "@/lib/storefront";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(req: NextRequest) {
  if (!(await getAdminFromRequest(req))) return unauthorized();
  return NextResponse.json({ sale: await getSaleSummary() });
}

// Start the sale, or discount products added since it started.
async function handlePOST(req: NextRequest) {
  if (!(await getAdminFromRequest(req))) return unauthorized();
  try {
    const { percent } = await req.json();
    const sale = await applySale(Math.round(Number(percent)));
    return NextResponse.json({ sale });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Could not start the sale" }, { status: 400 });
  }
}

// End the sale and restore the original prices.
async function handleDELETE(req: NextRequest) {
  if (!(await getAdminFromRequest(req))) return unauthorized();
  try {
    const result = await endSale();
    return NextResponse.json({ ...result, sale: await getSaleSummary() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Could not end the sale" }, { status: 400 });
  }
}

export const POST = refreshesStorefront(handlePOST);
export const DELETE = refreshesStorefront(handleDELETE);
