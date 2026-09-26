/** Demo return rules by shopper region. UK and EU get a shorter window, refunded as store credit. */
export type ReturnRegion = "US" | "UK" | "EU";

export type ReturnPolicy = {
  region: ReturnRegion;
  windowDays: number;
  refundAs: "cash" | "credit";
  /** Short badge, e.g. "14-day returns, store credit". */
  badge: string;
  /** One sentence for checkout. */
  detail: string;
};

export const RETURN_POLICIES: Record<ReturnRegion, ReturnPolicy> = {
  US: {
    region: "US",
    windowDays: 30,
    refundAs: "cash",
    badge: "30-day returns, refunded",
    detail: "Send it back within 30 days for a refund to your card.",
  },
  UK: {
    region: "UK",
    windowDays: 14,
    refundAs: "credit",
    badge: "14-day returns, store credit",
    detail: "Send it back within 14 days and we add the full price to your store credit.",
  },
  EU: {
    region: "EU",
    windowDays: 14,
    refundAs: "credit",
    badge: "14-day returns, store credit",
    detail: "Send it back within 14 days and we add the full price to your store credit.",
  },
};

const US_CITIES = ["new york", "los angeles", "san francisco", "chicago", "austin", "seattle"];
const EU_CITIES = ["paris", "berlin", "amsterdam", "madrid", "milan", "dublin", "lisbon", "copenhagen"];

/** The shop sells from the UK, so an unknown city counts as UK. */
export const regionForCity = (city?: string | null): ReturnRegion => {
  const normalized = city?.trim().toLowerCase() ?? "";
  if (US_CITIES.includes(normalized)) return "US";
  if (EU_CITIES.includes(normalized)) return "EU";
  return "UK";
};

export const returnPolicyForCity = (city?: string | null): ReturnPolicy =>
  RETURN_POLICIES[regionForCity(city)];
