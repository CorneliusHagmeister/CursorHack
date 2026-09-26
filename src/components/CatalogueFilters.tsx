import Link from "next/link";
import type { ReactNode } from "react";
import type { CatalogueFacets, FacetOption } from "@/lib/catalogue";

const VISIBLE_BRANDS = 6;

type CatalogueFiltersProps = {
  facets: CatalogueFacets;
  idPrefix: string;
  shopperWaist?: number;
  budgetMax?: number;
};

const optionLabel = (option: FacetOption, label: string) =>
  `${label}, ${option.count} ${option.count === 1 ? "pair" : "pairs"}${option.active ? ", selected" : ""}`;

const FilterChip = ({ option, label = option.label }: { option: FacetOption; label?: string }) => {
  if (!option.active && option.count === 0) {
    return (
      <span className="text-caps rounded-tile px-2 py-1.5 text-hairline" aria-hidden>
        {label}
      </span>
    );
  }
  return (
    <Link
      href={option.href}
      scroll={false}
      aria-label={optionLabel(option, label)}
      className={`text-caps inline-flex items-center gap-1.5 rounded-tile px-2 py-1.5 ${
        option.active ? "bg-ink text-white" : "bg-floor text-ink hover:bg-hairline"
      }`}
    >
      {label}
      <span className="tabular-nums opacity-50">{option.count}</span>
    </Link>
  );
};

const FilterGroup = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <div role="group" aria-labelledby={id}>
    <h3 id={id} className="text-caps text-muted">
      {title}
    </h3>
    <div className="mt-2">{children}</div>
  </div>
);

export const CatalogueFilters = ({ facets, idPrefix, shopperWaist, budgetMax }: CatalogueFiltersProps) => {
  const shownBrands = facets.brands.slice(0, VISIBLE_BRANDS);
  const moreBrands = facets.brands.slice(VISIBLE_BRANDS);

  return (
    <div className="space-y-5">
      <FilterGroup id={`${idPrefix}-size`} title="Waist">
        <div className="flex flex-wrap gap-1">
          {facets.waists.map((option) => (
            <FilterChip
              key={option.value}
              option={option}
              label={option.value === shopperWaist ? `${option.label} · yours` : option.label}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup id={`${idPrefix}-cut`} title="Cut">
        <div className="flex flex-wrap gap-1">
          {facets.cuts.map((option) => (
            <FilterChip key={option.label} option={option} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup id={`${idPrefix}-condition`} title="Condition">
        <div className="flex gap-px overflow-hidden rounded-tile bg-hairline">
          {facets.conditions.map((option) => {
            const empty = !option.active && option.count === 0;
            const tone = option.active
              ? "bg-ink text-white"
              : empty
                ? "pointer-events-none bg-floor text-hairline"
                : "bg-floor text-ink hover:bg-hairline";
            return (
              <Link
                key={option.label}
                href={option.href}
                scroll={false}
                aria-label={optionLabel(option, option.label)}
                aria-disabled={empty || undefined}
                tabIndex={empty ? -1 : undefined}
                className={`text-caps flex flex-1 flex-col items-center justify-center px-0.5 py-1.5 text-center text-[10px] leading-tight ${tone}`}
              >
                {option.label}
                <span className="tabular-nums opacity-60">{option.count}</span>
              </Link>
            );
          })}
        </div>
        <div className="text-caps mt-1 flex justify-between text-[10px] text-muted" aria-hidden>
          <span>Newer</span>
          <span>More worn</span>
        </div>
      </FilterGroup>

      <FilterGroup id={`${idPrefix}-price`} title="Price">
        <div className="flex flex-wrap gap-1">
          {facets.prices.map((option) => (
            <FilterChip
              key={option.value}
              option={option}
              label={option.value === budgetMax ? `${option.label} · your budget` : option.label}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup id={`${idPrefix}-brand`} title="Brand">
        <div className="flex flex-wrap gap-1">
          {shownBrands.map((option) => (
            <FilterChip key={option.label} option={option} />
          ))}
        </div>
        {moreBrands.length > 0 && (
          <details className="group mt-2">
            <summary className="text-caps mt-1 cursor-pointer list-none text-muted underline underline-offset-2 group-open:hidden">
              {moreBrands.length} more brands
            </summary>
            <div className="flex flex-wrap gap-1">
              {moreBrands.map((option) => (
                <FilterChip key={option.label} option={option} />
              ))}
            </div>
          </details>
        )}
      </FilterGroup>
    </div>
  );
};
