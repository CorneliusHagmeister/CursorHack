import { DealSettings } from "@/components/DealSettings";
import { perkOptionsFor } from "@/lib/negotiation/merchant";
import { EXTRA_CATALOG, TERM_CATALOG, defaultPolicy, listPolicies } from "@/lib/negotiation/policies";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deal settings · Indigo Lane" };

export default async function DealSettingsPage() {
  const items = (await listPolicies()).map(({ product, policy }) => ({
    product: {
      id: product.id,
      brand: product.brand,
      name: product.name,
      price: product.price,
      image: product.image,
      condition: product.condition,
      waist: product.waist,
      length: product.length,
    },
    policy,
    defaults: defaultPolicy(product),
    perks: perkOptionsFor(product.id),
  }));
  return <DealSettings items={items} termCatalog={TERM_CATALOG} extraCatalog={EXTRA_CATALOG} />;
}
