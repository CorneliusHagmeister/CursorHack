import type { Product } from "./types";

export function gbp(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}

/** Image alt text for a product; shared by server and client components */
export function productAlt(
  product: Pick<Product, "brand" | "name" | "wash" | "cut">
) {
  return `${product.brand} ${product.name}, ${product.wash.toLowerCase()} ${product.cut.toLowerCase()}`;
}
