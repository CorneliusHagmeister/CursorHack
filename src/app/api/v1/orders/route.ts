import { NextResponse } from "next/server";
import { resolveShopperContext } from "@/lib/context";
import { servicePlaceOrder } from "@/lib/services";
import { RETURNING_SHOPPER } from "@/lib/shopper";

export async function POST(req: Request) {
  const body = await req.json();
  const ctx = await resolveShopperContext({
    authorization: req.headers.get("authorization"),
  });

  const shopper = ctx.shopper;
  const buyerName = body.buyerName ?? shopper?.name ?? RETURNING_SHOPPER.name;
  const buyerEmail =
    body.buyerEmail ?? shopper?.email ?? RETURNING_SHOPPER.email;
  const shippingCity =
    body.shippingCity ?? shopper?.city ?? RETURNING_SHOPPER.city;

  if (!body.primaryId) {
    return NextResponse.json(
      { error: "primaryId required", hint: "Pass a catalogue id" },
      { status: 400 }
    );
  }

  try {
    const order = await servicePlaceOrder({
      primaryId: body.primaryId,
      perkId: body.perkId,
      buyerName,
      buyerEmail,
      shippingCity,
      note: body.note,
      negotiatedPrice: body.negotiatedPrice,
      listPrice: body.listPrice,
      negotiationSummary: body.negotiationSummary,
      negotiated: body.negotiated ?? true,
      shopperId: shopper?.id,
      channel: ctx.source === "agent" ? "agent" : "web",
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Order failed" },
      { status: 400 }
    );
  }
}
