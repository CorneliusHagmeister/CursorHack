import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/products";

export default function HomePage() {
  const products = listProducts();
  const heroes = products.filter((p) => !p.perkEligible);
  const perks = products.filter((p) => p.perkEligible);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-200/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#c7d2fe_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_#fde68a_0%,_transparent_45%)] opacity-70" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-800">
            Fleek · New Ways to Buy
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-indigo-950 sm:text-5xl">
            Second-hand jeans with a sharper deal:{" "}
            <span className="text-indigo-700">Pair &amp; Perk</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-stone-600 sm:text-lg">
            Pay full price for one pair. Unlock a complementary denim piece free.
            Fit desk chat matches waist &amp; condition against a real catalogue —
            merchant dashboard sees every order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#catalogue"
              className="rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-medium text-amber-50 hover:bg-indigo-900"
            >
              Browse {products.length} pairs
            </a>
            <Link
              href={`/product/${heroes[0]?.id ?? products[0].id}#new-ways`}
              className="rounded-full border border-indigo-300 bg-white/70 px-5 py-2.5 text-sm font-medium text-indigo-950 hover:bg-white"
            >
              Try Pair &amp; Perk
            </Link>
          </div>
        </div>
      </section>

      <section id="catalogue" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-950">Hero pairs</h2>
            <p className="text-sm text-stone-600">
              Full-price unlocks — pick one to open New Ways to Buy
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mb-6 mt-14 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-950">
              Perk pool
            </h2>
            <p className="text-sm text-stone-600">
              Complementary add-ons — free when you Pair &amp; Perk a hero
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
