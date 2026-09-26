import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAgentToken } from "@/lib/agent-tokens";
import { DEMO_SHOPPER_COOKIE, RETURNING_SHOPPER } from "@/lib/shopper";
import { resolveShopperContext } from "@/lib/context";

export async function POST() {
  const cookieStore = await cookies();
  const demo = cookieStore.get(DEMO_SHOPPER_COOKIE)?.value === "1";
  const ctx = await resolveShopperContext();
  const shopper = ctx.shopper ?? (demo ? RETURNING_SHOPPER : undefined);
  if (!shopper) {
    return NextResponse.json(
      { error: "Sign in first", hint: "POST /api/auth/login with demo: true" },
      { status: 401 }
    );
  }

  const { token, record } = await createAgentToken({
    shopperId: shopper.id,
    label: "Indigo Lane agent",
  });

  return NextResponse.json({
    token,
    prefix: record.prefix,
    scopes: record.scopes,
    createdAt: record.createdAt,
  });
}
