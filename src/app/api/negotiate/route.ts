import { NextResponse } from "next/server";
import { resolveShopperContext } from "@/lib/context";
import { serviceNegotiate } from "@/lib/services";
import type { NegotiatedDeal, NegotiateMessage } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    productId?: string;
    message?: string;
    history?: NegotiateMessage[];
    deal?: NegotiatedDeal | null;
  };
  if (!body.productId) {
    return NextResponse.json(
      { error: "productId required", hint: "Pass the catalogue id, e.g. apc-petit-new" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const ctx = await resolveShopperContext({
    searchParams: url.searchParams,
    authorization: req.headers.get("authorization"),
  });

  const result = serviceNegotiate({
    productId: body.productId,
    message: body.message ?? "",
    history: body.history ?? [],
    deal: body.deal ?? null,
    shopper: ctx.shopper ?? null,
    campaign: ctx.campaign ?? null,
  });
  return NextResponse.json(result);
}
