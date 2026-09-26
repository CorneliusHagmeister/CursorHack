import { RETURNING_SHOPPER } from "@/lib/shopper";

/** Fake linked-card data for the demo. No real bank, no Plaid. */
export type BankTransaction = {
  id: string;
  date: string;
  merchant: string;
  amountGbp: number;
  category: "denim" | "clothing" | "groceries" | "transport";
  cardLast4: string;
};

export type BankStatement = {
  demo: true;
  bank: string;
  cardLast4: string;
  from: string;
  to: string;
  transactions: BankTransaction[];
  denim: {
    count: number;
    totalGbp: number;
    largestGbp: number;
  };
};

const SAM_CARD = "4417";

const SAM_TRANSACTIONS: Omit<BankTransaction, "cardLast4">[] = [
  { id: "tx_0922_tfl", date: "2026-09-22", merchant: "TfL", amountGbp: 34.2, category: "transport" },
  { id: "tx_0915_waitrose", date: "2026-09-15", merchant: "Waitrose", amountGbp: 48.1, category: "groceries" },
  { id: "tx_0912_nudie", date: "2026-09-12", merchant: "Nudie Jeans Repair Shop", amountGbp: 18, category: "denim" },
  { id: "tx_0830_uniqlo", date: "2026-08-30", merchant: "Uniqlo Oxford Street", amountGbp: 25, category: "clothing" },
  { id: "tx_0823_edwin", date: "2026-08-23", merchant: "Edwin Europe", amountGbp: 64, category: "denim" },
  { id: "tx_0730_apc", date: "2026-07-30", merchant: "A.P.C. Covent Garden", amountGbp: 88, category: "denim" },
  { id: "tx_0705_weekday", date: "2026-07-05", merchant: "Weekday Carnaby", amountGbp: 32, category: "denim" },
];

/** Statement for a shopper, or null when there is no linked card. Only Sam has one. */
export const demoBankStatement = (shopperId: string): BankStatement | null => {
  if (shopperId !== RETURNING_SHOPPER.id) return null;
  const transactions = SAM_TRANSACTIONS.map((tx) => ({ ...tx, cardLast4: SAM_CARD }));
  const denimSpends = transactions.filter((tx) => tx.category === "denim");
  return {
    demo: true,
    bank: "Demo Bank",
    cardLast4: SAM_CARD,
    from: "2026-06-28",
    to: "2026-09-26",
    transactions,
    denim: {
      count: denimSpends.length,
      totalGbp: denimSpends.reduce((sum, tx) => sum + tx.amountGbp, 0),
      largestGbp: Math.max(...denimSpends.map((tx) => tx.amountGbp)),
    },
  };
};
