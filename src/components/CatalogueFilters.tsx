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
      <span className="rounded-full px-3 py-1.5 text-xs text-stone-300" aria-hidden>
        {label}
      </span>
    );
  }
  return (
    <Link
      href={option.href}
      scroll={false}
      aria-label={optionLabel(option, label)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
        option.active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      }`}
    >
      {label}
      <span className="tabular-nums opacity-60">{option.count}</span>
    </Link>
  );
};

const FilterGroup = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <div role="group" aria-labelledby={id}>
    <h3 id={id} className="text-sm font-medium text-stone-900">
      {title}
    </h3>
    <div className="mt-2">{children}</div>
  </div>
);

export const CatalogueFilters = ({ facets, idPrefix, shopperWaist, budgetMax }: CatalogueFiltersProps) => {
  const shownBrands = facets.brands.slice(0, VISIBLE_BRANDS);
  const moreBrands = facets.brands.slice(VISIBLE_BRANDS);

  return (
    <div className="space-y-6">
      <FilterGroup id={`${idPrefix}-size`} title="Waist">
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-2">
          {facets.cuts.map((option) => (
            <FilterChip key={option.label} option={option} />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup id={`${idPrefix}-condition`} title="Condition">
        <div className="flex overflow-hidden rounded-full border border-stone-200">
          {facets.conditions.map((option) => {
            const empty = !option.active && option.count === 0;
            const tone = option.active
              ? "bg-stone-900 text-white"
              : empty
                ? "pointer-events-none text-stone-300"
                : "bg-white text-stone-700 hover:bg-stone-100";
            return (
              <Link
                key={option.label}
                href={option.href}
                scroll={false}
                aria-label={optionLabel(option, option.label)}
                aria-disabled={empty || undefined}
                tabIndex={empty ? -1 : undefined}
                className={`flex flex-1 flex-col items-center justify-center border-r border-stone-200 px-1 py-1.5 text-center text-[11px] leading-tight last:border-r-0 ${tone}`}
              >
                {option.label}
                <span className="tabular-nums opacity-60">{option.count}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between px-1 text-[11px] text-stone-400" aria-hidden>
          <span>Newer</span>
          <span>More worn</span>
        </div>
      </FilterGroup>

      <FilterGroup id={`${idPrefix}-price`} title="Price">
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-wrap gap-2">
          {shownBrands.map((option) => (
            <FilterChip key={option.label} option={option} />
          ))}
        </div>
        {moreBrands.length > 0 && (
          <details className="group mt-2">
            <summary className="cursor-pointer list-none text-xs text-stone-600 underline group-open:hidden">
              {moreBrands.length} more brands
            </summary>
            <div className="flex flex-wrap gap-2">
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
