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
        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-950">
          Abandoned A.P.C. cart, £95
        </span>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-indigo-950 sm:text-2xl">
          Welcome back, {s.name}
        </h2>
        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          Visit {s.returningVisits} · {s.city}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        {[
          ["Fit", `W${s.waist} / L${s.length}`],
          ["Brands", s.preferredBrands.join(", ")],
          ["Condition floor", `≥ ${s.minCondition}`],
          ["Budget", `≤ ${gbp(s.budgetMax)}`],
          ["Email", s.email],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-sm text-stone-500">{k}</dt>
            <dd className="font-medium text-indigo-950">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-indigo-950">Style likes</p>
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
          <p className="text-sm font-medium text-indigo-950">Past purchases</p>
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

      <p className="mt-4 text-sm text-amber-950">
        <span className="font-medium">Last session.</span> {s.lastSeenNote}
      </p>
    </section>
  );
}
