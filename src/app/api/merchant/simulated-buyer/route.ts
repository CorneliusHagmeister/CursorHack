import { after } from "next/server";
import { handle, optionalString, readJson } from "@/lib/negotiation/http";
import { runSimulatedBuyer, startSimulatedBuyer } from "@/lib/negotiation/simulated-buyer";

/**
 * Start a scripted buyer agent haggling through the real negotiation API.
 * Returns once the chat is open; the remaining turns play out in the
 * background so the dashboard can watch them arrive.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson(req).catch(() => ({}) as Record<string, unknown>);
    const started = await startSimulatedBuyer(optionalString(body, "productId"));
    after(() => runSimulatedBuyer(started));
    return { negotiationId: started.negotiationId, productId: started.productId, buyerName: started.buyerName };
  }, 202);
}
