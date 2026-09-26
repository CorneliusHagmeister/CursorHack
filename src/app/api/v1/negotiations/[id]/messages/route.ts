import { NextResponse } from "next/server";
import { resolveShopperContext } from "@/lib/context";
import { serviceNegotiate } from "@/lib/services";
import {
  getNegotiationSession,
  setNegotiationSession,
} from "@/lib/negotiation-sessions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getNegotiationSession(id);
  if (!session) {
    return NextResponse.json(
      {
        error: "Unknown negotiation",
        hint: "POST /api/v1/negotiations first to start",
      },
      { status: 404 }
    );
  }

  const body = (await req.json()) as { message?: string };
  if (!body.message?.trim()) {
    return NextResponse.json(
      { error: "message required", hint: "Try: Knock £10 off" },
      { status: 400 }
    );
  }

  const ctx = await resolveShopperContext({
    authorization: req.headers.get("authorization"),
  });

  const result = serviceNegotiate({
    productId: session.productId,
    message: body.message,
    history: session.history,
    deal: session.deal,
    shopper: ctx.shopper ?? null,
    campaign: ctx.campaign ?? null,
  });

  setNegotiationSession(id, {
    productId: session.productId,
    history: [
      ...session.history,
      { role: "user", content: body.message },
      { role: "assistant", content: result.steps.join("\n") },
    ],
    deal: result.deal,
  });

  return NextResponse.json({ negotiationId: id, ...result });
}
