import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { resolveShopperContext } from "@/lib/context";
import { serviceNegotiate } from "@/lib/services";
import { setNegotiationSession } from "@/lib/negotiation-sessions";

export async function POST(req: Request) {
  const body = (await req.json()) as { productId?: string };
  if (!body.productId) {
    return NextResponse.json(
      { error: "productId required", hint: "e.g. apc-petit-new" },
      { status: 400 }
    );
  }

  const ctx = await resolveShopperContext({
    authorization: req.headers.get("authorization"),
  });

  const result = serviceNegotiate({
    productId: body.productId,
    message: "",
    history: [],
    shopper: ctx.shopper ?? null,
    campaign: ctx.campaign ?? null,
  });

  const id = `neg_${randomBytes(8).toString("hex")}`;
  setNegotiationSession(id, {
    productId: body.productId,
    history: [{ role: "assistant", content: result.steps.join("\n") }],
    deal: result.deal,
  });

  return NextResponse.json(
    {
      negotiationId: id,
      ...result,
      channel: ctx.source === "agent" ? "agent" : "web",
    },
    { status: 201 }
  );
}
