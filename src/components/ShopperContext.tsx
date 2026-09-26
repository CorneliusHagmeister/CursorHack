import { getShopper } from "@/lib/shopper";
import { gbp } from "@/lib/format";

export function ShopperContextBanner({ compact = false }: { compact?: boolean }) {
  const s = getShopper();
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-900">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Returning · {s.name.split(" ")[0]}
        </span>
        <span className="rounded-full bg-white/80 px-2 py-1 text-stone-600">
          W{s.waist} L{s.length}
        </span>
        <span className="hidden rounded-full bg-white/80 px-2 py-1 text-stone-600 sm:inline">
          {s.preferredBrands.slice(0, 2).join(" · ")}
        </span>
        <span className="hidden rounded-full bg-white/80 px-2 py-1 text-stone-600 md:inline">
          budget {gbp(s.budgetMax)}
        </span>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">
            Personal context · not a cold start
          </p>
          <h2 className="mt-1 text-xl font-semibold text-indigo-950 sm:text-2xl">
            Welcome back, {s.name}
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            {s.city} · visit #{s.returningVisits} · {s.email}
          </p>
        </div>
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          Remembered profile
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          ["Fit", `W${s.waist} / L${s.length}`],
          ["Brands", s.preferredBrands.join(", ")],
          ["Condition floor", `≥ ${s.minCondition}`],
          ["Budget", `≤ ${gbp(s.budgetMax)}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-stone-500">{k}</dt>
            <dd className="font-medium text-indigo-950">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Style likes
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {s.styleLikes.map((t) => (
              <span
                key={t}
                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-900"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            Past purchases
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-stone-700">
            {s.pastPurchases.map((p) => (
              <li key={`${p.brand}-${p.purchasedAt}`}>
                <span className="font-medium text-indigo-950">
                  {p.brand} {p.name}
                </span>{" "}
                · W{p.waist} · {gbp(p.price)} · {p.purchasedAt.slice(0, 7)}
                <span className="block text-stone-500">{p.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
        <strong>Last session:</strong> {s.lastSeenNote}
      </p>
    </section>
  );
}
