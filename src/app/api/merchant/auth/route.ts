import { NextResponse } from "next/server";
import {
  MERCHANT_COOKIE,
  checkMerchantPassword,
  createMerchantSession,
} from "@/lib/merchant-auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  if (!checkMerchantPassword(body.password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const session = createMerchantSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MERCHANT_COOKIE, session.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(MERCHANT_COOKIE);
  return res;
}
