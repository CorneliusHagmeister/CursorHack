import { NextResponse } from "next/server";
import { resolveShopperContext } from "@/lib/context";
import { compatStart } from "@/lib/negotiation/compat";
import { NegotiationError } from "@/lib/negotiation/engine";

export async function POST(req: Request) {
  const body = (await req.json()) as { productId?: string; message?: string };
  if (!body.productId) {
    return NextResponse.json(
      { error: "productId required", hint: "e.g. apc-petit-new" },
      { status: 400 }
    );
  }

  const ctx = await resolveShopperContext({
    authorization: req.headers.get("authorization"),
  });

  try {
    const result = await compatStart({
      productId: body.productId,
      shopper: ctx.shopper ?? null,
      message: body.message,
    });
    return NextResponse.json(
      { ...result, channel: ctx.source === "agent" ? "agent" : "web" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof NegotiationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
