import { NegotiationError } from "@/lib/negotiation/engine";
import { handle, optionalPrice, optionalString, optionalTerms, readJson, requiredString } from "@/lib/negotiation/http";
import { simulate } from "@/lib/negotiation/merchant";
import type { Negotiation, ProductPolicy } from "@/lib/negotiation/types";

/** Try a policy without saving it: returns the engine's decision and best prices */
export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    if (!body.policy || typeof body.policy !== "object") {
      throw new NegotiationError(400, "policy is required");
    }
    const turn = body.turn as Record<string, unknown> | undefined;
    return simulate({
      productId: requiredString(body, "productId"),
      policy: body.policy as ProductPolicy,
      negotiation: (body.negotiation as Negotiation | undefined) ?? null,
      voice: body.voice === "llm" ? "llm" : "template",
      turn: turn
        ? {
            message: optionalString(turn, "message") ?? "",
            counterOffer: optionalPrice(turn, "counterOffer"),
            offerTerms: optionalTerms(turn, "offerTerms"),
            includePerk: turn.includePerk === true,
            acceptOfferId: optionalString(turn, "acceptOfferId"),
          }
        : null,
    });
  });
}
