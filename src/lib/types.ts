export type Condition = "Like New" | "Excellent" | "Very Good" | "Good" | "Fair";

export type Product = {
  id: string;
  name: string;
  brand: string;
  price: number; // GBP
  waist: number;
  length: number;
  wash: string;
  cut: string;
  condition: Condition;
  description: string;
  city: string;
  perkEligible: boolean; // can be claimed free via Pair & Perk
  accent: string; // CSS colour for card art
  tags: string[];
};

export type OrderItem = {
  productId: string;
  name: string;
  brand: string;
  price: number;
  role: "primary" | "perk";
};

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
  mechanic: "pair-and-perk";
  status: "confirmed" | "packed" | "shipped";
  note?: string;
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
