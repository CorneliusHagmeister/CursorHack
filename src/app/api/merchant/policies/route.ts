import { perkOptionsFor } from "@/lib/negotiation/merchant";
import { handle } from "@/lib/negotiation/http";
import { listPolicies } from "@/lib/negotiation/policies";

/** Every product with its negotiation policy (merchant dashboard; includes floors) */
export async function GET() {
  return handle(async () => ({
    policies: (await listPolicies()).map(({ product, policy }) => ({
      productId: product.id,
      policy,
      eligiblePerks: perkOptionsFor(product.id),
    })),
  }));
}
