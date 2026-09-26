import { optionalString, readJson, requiredString, handle } from "@/lib/negotiation/http";
import { startNegotiation } from "@/lib/negotiation/service";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req);
    return startNegotiation({
      productId: requiredString(body, "productId"),
      buyerName: optionalString(body, "buyerName"),
      perkId: optionalString(body, "perkId"),
    });
  }, 201);
}
