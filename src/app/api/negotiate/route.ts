import { NextResponse } from "next/server";
import { resolveShopperContext } from "@/lib/context";
import { compatStateless } from "@/lib/negotiation/compat";
import { NegotiationError } from "@/lib/negotiation/engine";
import type { NegotiatedDeal, NegotiateMessage } from "@/lib/types";

/** On-site deal desk. Runs on the deal engine; the deal carries its negotiationId between turns. */
export async function POST(req: Request) {
  const body = (await req.json()) as {
    productId?: string;
    message?: string;
    history?: NegotiateMessage[];
    deal?: (NegotiatedDeal & { negotiationId?: string }) | null;
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

  try {
    const result = await compatStateless({
      productId: body.productId,
      message: body.message ?? "",
      negotiationId: body.deal?.negotiationId ?? null,
      shopper: ctx.shopper ?? null,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof NegotiationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
