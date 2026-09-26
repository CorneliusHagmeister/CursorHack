import { NextResponse } from "next/server";
import { hasPersonalContext, resolveShopperContext } from "@/lib/context";
import { demoBankStatement } from "@/lib/demo-bank";

/** Fake linked-card statement for the signed-in shopper or an agent holding their token. */
export async function GET() {
  const ctx = await resolveShopperContext();
  if (!ctx.shopper || !hasPersonalContext(ctx)) {
    return NextResponse.json(
      { error: "Sign in first", hint: "Only the shopper, or an agent they gave a code to, can read this." },
      { status: 401 }
    );
  }

  const statement = demoBankStatement(ctx.shopper.id);
  if (!statement) {
    return NextResponse.json({ error: "No linked card for this shopper" }, { status: 404 });
  }
  return NextResponse.json(statement);
}
