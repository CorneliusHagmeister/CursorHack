export type NegotiationStatus = "open" | "agreed" | "purchased";

/** Commitments a buyer can give in exchange for a lower price */
export type TermId = "final_sale" | "standard_shipping" | "fit_review";

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
};

export type TranscriptEntry = {
  role: "buyer" | "merchant";
  text: string;
  counterOffer?: number;
  offerTerms?: TermId[];
  at: string;
};

/** Persisted session. Floor prices are never stored here — they come from merchant rules. */
export type Negotiation = {
  id: string;
  productId: string;
  listPrice: number;
  buyerName?: string;
  status: NegotiationStatus;
  round: number; // number of buyer price moves (counters or proposed terms)
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
  | { type: "hold"; best: Offer } // too low even with every term; best possible shown
  | { type: "info" }; // no price action, just conversation

/** Merchant-editable negotiation rules for one product */
export type ProductPolicy = {
  negotiable: boolean; // false: price holds at list, only Pair & Perk (if on) is offered
  floorPrice: number; // lowest GBP the merchant will ever accept (hidden from buyers)
  terms: Record<TermId, { enabled: boolean; discount: number }>; // GBP off list per term
  perkEnabled: boolean;
  perkIds: string[] | null; // allowed free pairs; null = every eligible pair
  sellingPoints: string; // talking points for the merchant voice, never pricing
};

export type PricingContext = {
  product: import("@/lib/types").Product;
  policy: ProductPolicy;
};
