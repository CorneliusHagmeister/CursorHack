import type { ShopperProfile } from "./types";

export const RETURNING_SHOPPER: ShopperProfile = {
  id: "shopper_sam_okonkwo",
  name: "Sam Okonkwo",
  email: "sam.okonkwo@example.com",
  city: "London",
  waist: 31,
  length: 32,
  preferredBrands: ["A.P.C.", "Nudie Jeans", "Edwin"],
  minCondition: "Good",
  budgetMax: 90,
  styleLikes: ["raw indigo", "slim taper", "organic cotton", "minimal branding"],
  pastPurchases: [
    {
      productId: "nudie-lean-dean",
      brand: "Nudie Jeans",
      name: "Lean Dean (prior season)",
      waist: 31,
      condition: "Very Good",
      price: 52,
      purchasedAt: "2026-03-14",
      note: "Loved the taper. Asked for the same waist next time",
    },
    {
      brand: "A.P.C.",
      name: "New Standard (sold)",
      waist: 30,
      condition: "Good",
      price: 78,
      purchasedAt: "2025-11-02",
      note: "Wanted a size up. Now locks W31",
    },
    {
      brand: "Weekday",
      name: "Ace Organic",
      waist: 31,
      condition: "Good",
      price: 28,
      purchasedAt: "2025-08-19",
      note: "Weekend beater. Liked the organic hand-feel",
    },
  ],
  returningVisits: 7,
  lastSeenNote:
    "Browsed A.P.C. Petit New Standard last week; abandoned cart at full £95.",
};

export function getShopper(): ShopperProfile {
  return RETURNING_SHOPPER;
}
