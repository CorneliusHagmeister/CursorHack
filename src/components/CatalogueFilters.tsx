"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const WAISTS = [28, 29, 30, 31, 32, 33, 34, 36];
const BRANDS = ["A.P.C.", "Nudie Jeans", "Levi's", "Edwin", "Carhartt WIP"];
const CONDITIONS = ["Like New", "Excellent", "Very Good", "Good", "Fair"];
const MAX_PRICES = [
  { label: "Under £40", value: 40 },
  { label: "Under £60", value: 60 },
  { label: "Under £90", value: 90 },
];

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-stone-900 text-white"
          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      }`}
    >
      {children}
    </Link>
  );
}

export function CatalogueFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const withParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value == null || searchParams.get(key) === value) params.delete(key);
    else params.set(key, value);
    return `/?${params.toString()}`;
  };

  const clear = () => router.push("/");

  const hasFilters = [
    "waist",
    "brand",
    "condition",
    "max_price",
    "cut",
    "q",
  ].some((k) => searchParams.get(k));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {WAISTS.map((w) => (
          <Chip
            key={w}
            href={withParam("waist", String(w))}
            active={searchParams.get("waist") === String(w)}
          >
            W{w}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {BRANDS.map((b) => (
          <Chip
            key={b}
            href={withParam("brand", b)}
            active={searchParams.get("brand") === b}
          >
            {b}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {CONDITIONS.map((c) => (
          <Chip
            key={c}
            href={withParam("condition", c)}
            active={searchParams.get("condition") === c}
          >
            {c}
          </Chip>
        ))}
        {MAX_PRICES.map((p) => (
          <Chip
            key={p.value}
            href={withParam("max_price", String(p.value))}
            active={searchParams.get("max_price") === String(p.value)}
          >
            {p.label}
          </Chip>
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
