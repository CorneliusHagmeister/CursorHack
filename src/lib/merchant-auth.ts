import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Simple merchant login for the demo: one shared password (MERCHANT_PASSWORD,
 * "indigo-merchant" if unset) and an HMAC-signed session cookie, checked in
 * proxy.ts for merchant pages and APIs.
 */
export const MERCHANT_COOKIE = "il_merchant";
export const DEMO_MERCHANT_PASSWORD = "indigo-merchant";
const SESSION_HOURS = 12;

export function merchantPassword(): string {
  return process.env.MERCHANT_PASSWORD || DEMO_MERCHANT_PASSWORD;
}

export function usingDemoMerchantPassword(): boolean {
  return !process.env.MERCHANT_PASSWORD;
}

function secret(): string {
  // Changing the password invalidates existing sessions
  return process.env.MERCHANT_SESSION_SECRET || `il-merchant:${merchantPassword()}`;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkMerchantPassword(input: unknown): boolean {
  return typeof input === "string" && safeEqual(input, merchantPassword());
}

export function createMerchantSession(): { value: string; maxAge: number } {
  const maxAge = SESSION_HOURS * 60 * 60;
  const expires = String(Date.now() + maxAge * 1000);
  return { value: `${expires}.${sign(expires)}`, maxAge };
}

export function isValidMerchantSession(cookie: string | undefined): boolean {
  if (!cookie) return false;
  const [expires, mac] = cookie.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(expires));
}

/** Only allow redirects back into the merchant area */
export function safeMerchantNext(next: string | null | undefined): string {
  return next && /^\/merchant(\/|$|\?)/.test(next) ? next : "/merchant";
}

/** proxy.ts hook: null to continue, or a redirect / 401 for signed-out merchants */
export function merchantGate(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl;
  const method = req.method;
  const page =
    (pathname === "/merchant" || pathname.startsWith("/merchant/")) && pathname !== "/merchant/login";
  const api =
    (pathname.startsWith("/api/merchant/") && pathname !== "/api/merchant/auth") ||
    (pathname === "/api/orders" && method === "GET") ||
    (/^\/api\/orders\/[^/]+$/.test(pathname) && method === "PATCH");
  if (!page && !api) return null;
  if (isValidMerchantSession(req.cookies.get(MERCHANT_COOKIE)?.value)) return null;
  if (api) {
    return NextResponse.json({ error: "Merchant sign-in required" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/merchant/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}
