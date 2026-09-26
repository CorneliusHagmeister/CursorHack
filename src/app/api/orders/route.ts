import { NextResponse } from "next/server";
import { resolveShopperContext } from "@/lib/context";
import { serviceListOrders, servicePlaceOrder } from "@/lib/services";
import { getProduct } from "@/lib/products";

export async function GET() {
  const orders = await serviceListOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    primaryId,
    perkId,
    buyerName,
    buyerEmail,
    shippingCity,
    note,
    negotiatedPrice,
    listPrice,
    negotiationSummary,
    concessions,
    negotiated,
    channel,
  } = body as {
    primaryId?: string;
    perkId?: string | null;
    buyerName?: string;
    buyerEmail?: string;
    shippingCity?: string;
    note?: string;
    negotiatedPrice?: number;
    listPrice?: number;
    negotiationSummary?: string;
    concessions?: string;
    negotiated?: boolean;
    channel?: "web" | "agent";
  };

  if (!primaryId || !buyerName || !buyerEmail || !shippingCity) {
    return NextResponse.json(
      {
        error: "primaryId, buyerName, buyerEmail, shippingCity required",
        hint: "Send the buyer fields and a primary catalogue id",
      },
      { status: 400 }
    );
  }

  const primary = getProduct(primaryId);
  if (!primary) {
    return NextResponse.json(
      { error: "Primary product not found", hint: "Use GET /api/v1/products" },
      { status: 404 }
    );
  }

  const ctx = await resolveShopperContext({
    authorization: req.headers.get("authorization"),
  });

  const listed = listPrice ?? primary.price;
  let paid =
    typeof negotiatedPrice === "number" ? negotiatedPrice : primary.price;
  const floor = Math.round(primary.price * 0.8);
  if (paid < floor) paid = floor;
  if (paid > primary.price) paid = primary.price;

  if (perkId) {
    const perk = getProduct(perkId);
    if (!perk || !perk.perkEligible) {
      return NextResponse.json({ error: "Invalid perk" }, { status: 400 });
    }
  }

  try {
    const order = await servicePlaceOrder({
      primaryId,
      perkId,
      buyerName,
      buyerEmail,
      shippingCity,
      note,
      negotiatedPrice: paid,
      listPrice: listed,
      negotiationSummary:
        negotiationSummary ||
        (concessions ? `Concessions: ${concessions}` : undefined),
      negotiated: Boolean(negotiated) || paid < listed,
      shopperId: ctx.shopper?.id,
      channel: channel ?? (ctx.source === "agent" ? "agent" : "web"),
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Order failed" },
      { status: 400 }
    );
  }
}
