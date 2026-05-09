import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-me-must-be-long-enough"
);

const ADMIN_COOKIE = "asta_admin";
const CUSTOMER_COOKIE = "asta_customer";

export type AdminTokenPayload = { id: string; email: string; name: string };
export type CustomerTokenPayload = { id: string; email: string; name: string };

// ----- Admin -----
export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  const c = await cookies();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}

export async function getAdminFromCookie(): Promise<AdminTokenPayload | null> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function getAdminFromRequest(req: NextRequest): Promise<AdminTokenPayload | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return Promise.resolve(null);
  return verifyAdminToken(token);
}

// ----- Customer -----
export async function signCustomerToken(payload: CustomerTokenPayload): Promise<string> {
  return new SignJWT({ ...payload, kind: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as CustomerTokenPayload;
  } catch {
    return null;
  }
}

export async function setCustomerCookie(token: string) {
  const c = await cookies();
  c.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerCookie() {
  const c = await cookies();
  c.delete(CUSTOMER_COOKIE);
}

export async function getCustomerFromCookie(): Promise<CustomerTokenPayload | null> {
  const c = await cookies();
  const token = c.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerToken(token);
}

export function getCustomerFromRequest(req: NextRequest): Promise<CustomerTokenPayload | null> {
  const token = req.cookies.get(CUSTOMER_COOKIE)?.value;
  if (!token) return Promise.resolve(null);
  return verifyCustomerToken(token);
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;
export const CUSTOMER_COOKIE_NAME = CUSTOMER_COOKIE;
