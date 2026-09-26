import { NegotiationError, requireProduct } from "@/lib/negotiation/engine";
import { handle, readJson } from "@/lib/negotiation/http";
import { resetPolicy, savePolicy } from "@/lib/negotiation/policies";
import type { ProductPolicy } from "@/lib/negotiation/types";

export async function PUT(req: Request, ctx: RouteContext<"/api/merchant/policies/[productId]">) {
  const { productId } = await ctx.params;
  return handle(async () => {
    const product = requireProduct(productId);
    const body = await readJson(req);
    try {
      return { policy: await savePolicy(product, body.policy as ProductPolicy) };
    } catch (err) {
      throw new NegotiationError(400, err instanceof Error ? err.message : "Invalid policy");
    }
  });
}

/** Back to the default rules */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/merchant/policies/[productId]">) {
  const { productId } = await ctx.params;
  return handle(async () => ({ policy: await resetPolicy(requireProduct(productId)) }));
}
