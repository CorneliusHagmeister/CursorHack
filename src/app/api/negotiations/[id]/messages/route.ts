import { NegotiationError } from "@/lib/negotiation/engine";
import { handle, optionalPrice, optionalString, readJson } from "@/lib/negotiation/http";
import { sendMessage } from "@/lib/negotiation/service";

export async function POST(req: Request, ctx: RouteContext<"/api/negotiations/[id]/messages">) {
  const { id } = await ctx.params;
  return handle(async () => {
    const body = await readJson(req);
    const counterOffer = optionalPrice(body, "counterOffer");
    const acceptOfferId = optionalString(body, "acceptOfferId");
    if (counterOffer != null && acceptOfferId) {
      throw new NegotiationError(400, "Send either counterOffer or acceptOfferId, not both");
    }
    return sendMessage(id, {
      message: optionalString(body, "message") ?? "",
      counterOffer,
      acceptOfferId,
      includePerk: body.includePerk === true,
      perkId: optionalString(body, "perkId"),
    });
  });
}
