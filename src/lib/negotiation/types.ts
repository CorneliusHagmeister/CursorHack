export type NegotiationStatus = "open" | "agreed" | "purchased";

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
};

export type TranscriptEntry = {
  role: "buyer" | "merchant";
  text: string;
  counterOffer?: number;
  at: string;
};

/** Persisted session. Floor prices are never stored here — they come from merchant rules. */
export type Negotiation = {
  id: string;
  productId: string;
  listPrice: number;
  buyerName?: string;
  status: NegotiationStatus;
  round: number; // number of buyer counter-offers processed
  merchantAsk: number; // current cash ask
  finalOfferMade: boolean;
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
  includePerk?: boolean;
  perkId?: string;
  acceptOfferId?: string;
};

/** What the engine decided — the LLM only turns this into words */
export type Decision =
  | { type: "opening" }
  | { type: "accept_offer"; offer: Offer } // buyer accepted one of our offers
  | { type: "accept_counter"; offer: Offer } // we accepted the buyer's number
  | { type: "counter"; lowball: boolean } // we moved, new offers on the table
  | { type: "final" } // we moved to our best and final
  | { type: "hold" } // we won't move further
  | { type: "info" }; // no price action, just conversation
