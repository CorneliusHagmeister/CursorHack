"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, KeyboardEvent, useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { CUT_FAMILIES, catalogueHref } from "@/lib/catalogue";
import { gbp } from "@/lib/format";

type Suggestion = {
  key: string;
  label: string;
  kind: string;
  href: string;
};

const MAX_SUGGESTIONS = 7;

const emptyQuery = { waists: [], brands: [], cuts: [], conditions: [] };

const unique = (values: string[]) => [...new Set(values)];

const suggestionsFor = (input: string): Suggestion[] => {
  const needle = input.trim().toLowerCase();
  if (needle.length < 2) return [];
  const hit = (value: string) => value.toLowerCase().includes(needle);

  const brands = unique(PRODUCTS.map((p) => p.brand))
    .filter(hit)
    .map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      kind: "Brand",
      href: catalogueHref({ ...emptyQuery, brands: [brand] }),
    }));
  const cuts = CUT_FAMILIES.filter(hit).map((cut) => ({
    key: `cut-${cut}`,
    label: `${cut} cut`,
    kind: "Cut",
    href: catalogueHref({ ...emptyQuery, cuts: [cut] }),
  }));
  const pairs = PRODUCTS.filter((p) => hit(`${p.brand} ${p.name}`) || hit(p.wash)).map((p) => ({
    key: `pair-${p.id}`,
    label: `${p.brand} ${p.name}`,
    kind: `W${p.waist} · ${gbp(p.price)}`,
    href: `/product/${p.id}`,
  }));
  const cities = unique(PRODUCTS.map((p) => p.city))
    .filter(hit)
    .map((city) => ({
      key: `city-${city}`,
      label: `Sellers in ${city}`,
      kind: "City",
      href: catalogueHref({ ...emptyQuery, q: city }),
    }));

  const wordStart = (label: string) =>
    Number(!label.toLowerCase().split(/[\s'.-]+/).some((word) => word.startsWith(needle)));
  const byWordStart = (a: Suggestion, b: Suggestion) => wordStart(a.label) - wordStart(b.label);

  return [
    ...brands.sort(byWordStart),
    ...cuts,
    ...pairs.sort(byWordStart),
    ...cities,
  ].slice(0, MAX_SUGGESTIONS);
};

export const SearchBox = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(() => suggestionsFor(value), [value]);
  const expanded = open && suggestions.length > 0;
  const activeSuggestion = expanded && activeIndex >= 0 ? suggestions[activeIndex] : undefined;

  const handleGo = (href: string) => {
    setOpen(false);
    setActiveIndex(-1);
    router.push(href);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (activeSuggestion) {
      handleGo(activeSuggestion.href);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    const search = params.toString();
    handleGo(search ? `/?${search}` : "/");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === "Enter" && activeSuggestion) {
      e.preventDefault();
      handleGo(activeSuggestion.href);
      return;
    }
    if (!suggestions.length || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    setOpen(true);
    setActiveIndex((index) => {
      if (e.key === "ArrowDown") return index + 1 >= suggestions.length ? 0 : index + 1;
      return index <= 0 ? suggestions.length - 1 : index - 1;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative order-last flex w-full basis-full items-center gap-2 rounded-tile bg-floor px-3 py-2 sm:order-0 sm:min-w-40 sm:max-w-md sm:flex-1 sm:basis-0"
      role="search"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder="Search brand, wash, city"
        aria-label="Search the catalogue"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-activedescendant={activeSuggestion ? `${listboxId}-${activeSuggestion.key}` : undefined}
        autoComplete="off"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
      />
      <ul
        id={listboxId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!expanded}
        className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-tile bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={suggestion.key}
            id={`${listboxId}-${suggestion.key}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => handleGo(suggestion.href)}
            className={`flex cursor-pointer items-baseline justify-between gap-4 px-3 py-2 text-sm ${
              index === activeIndex ? "bg-floor" : ""
            }`}
          >
            <span className="truncate text-ink">{suggestion.label}</span>
            <span className="text-caps shrink-0 text-muted">{suggestion.kind}</span>
          </li>
        ))}
      </ul>
    </form>
  );
};
