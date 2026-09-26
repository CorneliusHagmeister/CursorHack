import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { createOrder, listOrders } from "@/lib/store";
import { getShopper } from "@/lib/shopper";
import type { OrderItem } from "@/lib/types";

export async function GET() {
  const orders = await listOrders();
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
  };

  if (!primaryId || !buyerName || !buyerEmail || !shippingCity) {
    return NextResponse.json(
      { error: "primaryId, buyerName, buyerEmail, shippingCity required" },
      { status: 400 }
    );
  }

  const primary = getProduct(primaryId);
  if (!primary) {
    return NextResponse.json({ error: "Primary product not found" }, { status: 404 });
  }

  const shopper = getShopper();
  const listed = listPrice ?? primary.price;
  let paid = typeof negotiatedPrice === "number" ? negotiatedPrice : primary.price;
  // Guard: never below 80% of list for demo sanity
  const floor = Math.round(primary.price * 0.8);
  if (paid < floor) paid = floor;
  if (paid > primary.price) paid = primary.price;

  const items: OrderItem[] = [
    {
      productId: primary.id,
      name: primary.name,
      brand: primary.brand,
      price: paid,
      role: "primary",
    },
  ];

  let perkSavings = 0;
  if (perkId) {
    const perk = getProduct(perkId);
    if (!perk || !perk.perkEligible) {
      return NextResponse.json({ error: "Invalid perk" }, { status: 400 });
    }
    if (perk.price >= primary.price) {
      return NextResponse.json(
        { error: "Perk must be cheaper than primary list" },
        { status: 400 }
      );
    }
    items.push({
      productId: perk.id,
      name: perk.name,
      brand: perk.brand,
      price: 0,
      role: "perk",
    });
    perkSavings = perk.price;
  }

  const discount = Math.max(0, listed - paid);
  const subtotal = listed + perkSavings;
  const isNegotiated = Boolean(negotiated) || discount > 0 || Boolean(negotiationSummary);

  const order = await createOrder({
    buyerName,
    buyerEmail,
    shippingCity,
    items,
    subtotal,
    perkSavings,
    total: paid,
    listPrice: listed,
    discount,
    mechanic: isNegotiated ? "negotiated-pair-and-perk" : "pair-and-perk",
    note,
    negotiationSummary:
      negotiationSummary ||
      (concessions ? `Concessions: ${concessions}` : undefined),
    shopperId: shopper.id,
  });

  return NextResponse.json({ order }, { status: 201 });
}
