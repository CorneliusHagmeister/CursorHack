import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { issueSessionCode } from "@/lib/session-codes";
import { DEMO_SHOPPER_COOKIE, RETURNING_SHOPPER } from "@/lib/shopper";
import { resolveShopperContext } from "@/lib/context";

export async function POST() {
  const cookieStore = await cookies();
  const demo = cookieStore.get(DEMO_SHOPPER_COOKIE)?.value === "1";
  const ctx = await resolveShopperContext();
  const shopper = ctx.shopper ?? (demo ? RETURNING_SHOPPER : undefined);
  if (!shopper) {
    return NextResponse.json(
      {
        error: "Sign in on the site first",
        hint: "POST /api/auth/login with { demo: true }, then create a code. Do not send a password to an agent.",
      },
      { status: 401 }
    );
  }

  const issued = issueSessionCode(shopper);
  return NextResponse.json({
    code: issued.code,
    expiresAt: issued.expiresAt,
    hint: "Read this code to your agent. They redeem it at POST /api/auth/session-code/redeem. Single use, 10 minutes.",
  });
}
