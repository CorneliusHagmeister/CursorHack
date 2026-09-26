import { NextResponse } from "next/server";
import { createAgentToken } from "@/lib/agent-tokens";
import { takeSessionCode } from "@/lib/session-codes";
import type { ShopperProfile } from "@/lib/types";

const agentView = (shopper: ShopperProfile) => ({
  name: shopper.name,
  email: shopper.email,
  city: shopper.city,
  waist: shopper.waist,
  length: shopper.length,
  budgetMax: shopper.budgetMax,
  preferredBrands: shopper.preferredBrands,
  styleLikes: shopper.styleLikes,
  minCondition: shopper.minCondition,
  pastPurchases: shopper.pastPurchases,
});

export async function POST(req: Request) {
  let body: { code?: unknown };
  try {
    body = (await req.json()) as { code?: unknown };
  } catch {
    return NextResponse.json(
      { error: "Send JSON { code }" },
      { status: 400 }
    );
  }

  const code = typeof body.code === "string" ? body.code : "";
  const shopper = takeSessionCode(code);
  if (!shopper) {
    return NextResponse.json(
      {
        error: "That code is unknown or expired",
        hint: "Ask the shopper to open Account and show a new code. Do not ask for their password.",
      },
      { status: 401 }
    );
  }

  const { token, record } = await createAgentToken({
    shopperId: shopper.id,
    label: "Session code",
  });

  return NextResponse.json({
    token,
    tokenPrefix: record.prefix,
    scopes: record.scopes,
    shopper: agentView(shopper),
    hint: "Send Authorization: Bearer <token> on later catalogue, offer, and order calls. The spoken code is now used up.",
  });
}
