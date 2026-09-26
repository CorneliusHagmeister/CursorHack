import type { Product } from "@/lib/types";

export function gbp(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function productAlt(
  product: Pick<Product, "brand" | "name" | "wash" | "cut">
) {
  return `${product.brand} ${product.name}, ${product.wash.toLowerCase()} ${product.cut.toLowerCase()}`;
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(iso));
}
