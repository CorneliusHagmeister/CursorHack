import { NextResponse } from "next/server";
import { compatMessage } from "@/lib/negotiation/compat";
import { NegotiationError } from "@/lib/negotiation/engine";
import { optionalPrice, optionalString, optionalTerms } from "@/lib/negotiation/http";
import type { BuyerTurn } from "@/lib/negotiation/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message : "";
  if (!message.trim() && body.acceptOfferId == null && body.counterOffer == null) {
    return NextResponse.json(
      { error: "message required", hint: "Try: Knock £10 off" },
      { status: 400 }
    );
  }

  try {
    // Optional structured fields (same as /api/negotiations) override the parsed text
    const structured: Partial<BuyerTurn> = {};
    const counterOffer = optionalPrice(body, "counterOffer");
    const offerTerms = optionalTerms(body, "offerTerms");
    const acceptOfferId = optionalString(body, "acceptOfferId");
    if (counterOffer != null) structured.counterOffer = counterOffer;
    if (offerTerms) structured.offerTerms = offerTerms;
    if (acceptOfferId) structured.acceptOfferId = acceptOfferId;
    if (typeof body.includePerk === "boolean") structured.includePerk = body.includePerk;

    const result = await compatMessage({
      negotiationId: id,
      message,
      structured: Object.keys(structured).length ? structured : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof NegotiationError) {
      return NextResponse.json(
        err.status === 404
          ? { error: "Unknown negotiation", hint: "POST /api/v1/negotiations first to start" }
          : { error: err.message },
        { status: err.status }
      );
    }
    throw err;
  }
}
