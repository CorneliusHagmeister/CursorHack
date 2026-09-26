import { NextResponse } from "next/server";
import { runNegotiate } from "@/lib/negotiate";
import type { NegotiateRequest } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as NegotiateRequest;
  if (!body.productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }
  const result = runNegotiate({
    productId: body.productId,
    message: body.message ?? "",
    history: body.history ?? [],
    deal: body.deal ?? null,
  });
  return NextResponse.json(result);
}
