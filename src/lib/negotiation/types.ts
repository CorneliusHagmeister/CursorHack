export type NegotiationStatus = "open" | "agreed" | "purchased";

/** Commitments a buyer can give in exchange for a lower price */
export type TermId = "final_sale" | "standard_shipping" | "fit_review" | "collect_london";

/** Value the merchant can add instead of cutting price */
export type ExtraId = "free_hemming";

export type Term = {
  id: TermId;
  label: string;
  discount: number; // GBP off the list price for this product
};

export type PerkSummary = {
  productId: string;
  brand: string;
  name: string;
  listPrice: number; // GBP
};

/** A concrete, acceptable deal the merchant has put on the table */
export type Offer = {
  offerId: string;
  kind: "cash" | "pair-and-perk";
  price: number; // GBP the buyer pays
  perk: PerkSummary | null; // free complementary pair, if any
  terms: TermId[]; // what the buyer commits to in return
  extras?: ExtraId[]; // value the merchant adds (e.g. free hemming)
};

export type TranscriptEntry = {
  role: "buyer" | "merchant";
  text: string;
  counterOffer?: number;
  offerTerms?: TermId[];
  decision?: Decision["type"]; // merchant lines: what the engine decided
  offer?: Offer | null; // merchant lines: the offer this message is about
  at: string;
};

/** Persisted session. Floor prices are never stored here — they come from merchant rules. */
export type Negotiation = {
  id: string;
  productId: string;
  listPrice: number;
  buyerName?: string;
  /** Known shopper (signed in or agent token): lets the merchant talk fit and budget */
  buyerProfile?: { waist: number; length: number; budgetMax: number; preferredBrands: string[] } | null;
  status: NegotiationStatus;
  round: number; // number of buyer price moves (counters or proposed terms)
  pressure?: number; // times the buyer pushed below what we'd do; unlocks smaller and smaller concessions
  offers: Offer[]; // currently acceptable offers
  agreed: (Offer & { agreedAt: string }) | null;
  orderId: string | null;
  transcript: TranscriptEntry[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type BuyerTurn = {
  message: string;
  counterOffer?: number;
  offerTerms?: TermId[];
  includePerk?: boolean;
  perkId?: string;
  acceptOfferId?: string;
};

/** What the engine decided — the LLM only turns this into words */
export type Decision =
  | { type: "opening" }
  | { type: "accept_offer"; offer: Offer } // buyer accepted one of our offers
  | { type: "accept_counter"; offer: Offer } // buyer's price + terms work, deal done
  | { type: "conditional"; offer: Offer } // "that price works if you give us X"
  | { type: "quote"; offer: Offer } // price for the terms the buyer proposed
  | { type: "counter"; offer: Offer; final: boolean } // too low: our counter (with terms + extras); final = at walk-away
  | { type: "info" }; // no price action, just conversation

export type Priority = "hold" | "normal" | "clear";
export type RiskLevel = "low" | "medium" | "high";

/** Merchant-editable negotiation rules for one product. Never sent to buyers or the LLM. */
export type ProductPolicy = {
  negotiable: boolean; // false: price holds at list; only value-adds are offered
  targetPrice: number; // where we'd like deals to land
  floorPrice: number; // walk-away price, only approached under sustained pressure
  priority: Priority; // hold = never below target; clear = start lower, push bundles
  clearBy: string | null; // optional ISO date we want it sold by
  returnRisk: RiskLevel; // how likely it comes back (final sale is worth more when high)
  highValue: boolean; // no free extras on high-value / fraud-prone items
  terms: Record<TermId, { enabled: boolean; discount: number }>; // GBP a buyer commitment is worth to us
  extras: Record<ExtraId, { enabled: boolean; cost: number; value: number }>; // our cost vs buyer's perceived value
  perkEnabled: boolean;
  perkIds: string[] | null; // allowed free pairs; null = every eligible pair
  pushPerkIds: string[]; // overstock pairs we'd most like to give away
  sellingPoints: string; // talking points for the merchant voice
  avoidSaying: string; // things the merchant voice must not say
};

export type PricingContext = {
  product: import("@/lib/types").Product;
  policy: ProductPolicy;
};
