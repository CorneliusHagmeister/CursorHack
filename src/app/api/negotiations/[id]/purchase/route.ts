import { NegotiationError } from "@/lib/negotiation/engine";
import { handle, optionalPrice, optionalString, readJson, requiredString } from "@/lib/negotiation/http";
import { purchaseDeal } from "@/lib/negotiation/service";

export async function POST(req: Request, ctx: RouteContext<"/api/negotiations/[id]/purchase">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const body = await readJson(req);
    const price = optionalPrice(body, "price");
    if (price == null) throw new NegotiationError(400, "price is required (the agreed price)");
    return purchaseDeal(id, {
      price,
      buyerName: requiredString(body, "buyerName"),
      buyerEmail: requiredString(body, "buyerEmail"),
      shippingCity: requiredString(body, "shippingCity"),
      note: optionalString(body, "note"),
    });
  }, 201);
}
