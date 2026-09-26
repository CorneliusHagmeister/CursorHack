export type Condition =
  | "Like New"
  | "Excellent"
  | "Very Good"
  | "Good"
  | "Fair";

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  waist: number;
  length: number;
  wash: string;
  cut: string;
  condition: Condition;
  description: string;
  city: string;
  perkEligible: boolean;
  accent: string;
  /** Public path, e.g. /products/levi-501-indigo.jpg. Swap the file to replace the stock shot. */
  image: string;
  tags: string[];
};

export type PastPurchase = {
  productId?: string;
  brand: string;
  name: string;
  waist: number;
  condition: Condition;
  price: number;
  purchasedAt: string;
  note: string;
};

export type ShopperProfile = {
  id: string;
  name: string;
  email: string;
  city: string;
  waist: number;
  length: number;
  preferredBrands: string[];
  minCondition: Condition;
  budgetMax: number;
  styleLikes: string[];
  pastPurchases: PastPurchase[];
  returningVisits: number;
  lastSeenNote: string;
};

export type ShopperSource = "anonymous" | "ad" | "login" | "agent";

export type ShopperContext = {
  source: ShopperSource;
  shopper?: ShopperProfile;
  campaign?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  role: "primary" | "perk";
};

export type OrderChannel = "web" | "agent";

export type Order = {
  id: string;
  createdAt: string;
  buyerName: string;
  buyerEmail: string;
  shippingCity: string;
  items: OrderItem[];
  subtotal: number;
  perkSavings: number;
  total: number;
  listPrice: number;
  discount: number;
  mechanic: "pair-and-perk" | "negotiated-pair-and-perk";
  status: "confirmed" | "packed" | "shipped";
  note?: string;
  negotiationSummary?: string;
  shopperId?: string;
  channel?: OrderChannel;
};

export type AssistMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistRequest = {
  message: string;
  waist?: number;
  preferredCondition?: Condition;
  productId?: string;
};

export type NegotiatedDeal = {
  primaryId: string;
  perkId: string | null;
  listPrice: number;
  negotiatedPrice: number;
  perkLabel: string | null;
  summary: string;
  concessions: string[];
};

export type NegotiateMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type NegotiateRequest = {
  productId: string;
  message: string;
  history: NegotiateMessage[];
  deal?: NegotiatedDeal | null;
  shopper?: ShopperProfile | null;
  campaign?: string | null;
};

export type NegotiateResponse = {
  steps: string[];
  deal: NegotiatedDeal;
  quickReplies: string[];
  canApply: boolean;
};

export type ProductFilters = {
  q?: string;
  waist?: number;
  brand?: string;
  condition?: Condition;
  cut?: string;
  maxPrice?: number;
  perkEligible?: boolean;
};
