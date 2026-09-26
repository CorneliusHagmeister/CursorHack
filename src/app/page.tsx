import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { ShopperContextBanner } from "@/components/ShopperContext";
import { listProducts } from "@/lib/products";
import { getShopper } from "@/lib/shopper";

export default function HomePage() {
  const products = listProducts();
  const heroes = products.filter((p) => !p.perkEligible);
  const perks = products.filter((p) => p.perkEligible);
  const shopper = getShopper();
  const recommended =
    heroes.find((p) =>
      shopper.preferredBrands.some(
        (b) =>
          p.brand.toLowerCase().includes(b.toLowerCase().replace(" jeans", "")) ||
          b.toLowerCase().includes(p.brand.toLowerCase())
      )
    ) ?? heroes[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-200/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#c7d2fe_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_#fde68a_0%,_transparent_45%)] opacity-70" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-800">
            Fleek · New Ways to Buy · remembered shopper
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-indigo-950 sm:text-5xl">
            Negotiate live — with{" "}
            <span className="text-indigo-700">context from the past</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-stone-600 sm:text-lg">
            Sam is a returning shopper (W{shopper.waist}, {shopper.preferredBrands[0]}
            /{shopper.preferredBrands[1]}). Open a hero pair, run a visible
            back-and-forth on Pair &amp; Perk, land the deal, merchant sees it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/product/${recommended?.id ?? heroes[0].id}#negotiate`}
              className="rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-medium text-amber-50 hover:bg-indigo-900"
            >
              Negotiate on {recommended?.brand ?? "hero"} →
            </Link>
            <a
              href="#catalogue"
              className="rounded-full border border-indigo-300 bg-white/70 px-5 py-2.5 text-sm font-medium text-indigo-950 hover:bg-white"
            >
              Browse {products.length} pairs
            </a>
          </div>

          <div className="mt-10">
            <ShopperContextBanner />
          </div>
        </div>
      </section>

      <section id="catalogue" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-indigo-950">Hero pairs</h2>
            <p className="text-sm text-stone-600">
              Full-price unlocks — open one and start live negotiation
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mb-6 mt-14">
          <h2 className="text-2xl font-semibold text-indigo-950">Perk pool</h2>
          <p className="text-sm text-stone-600">
            Complementary add-ons — free via Pair &amp; Perk / negotiation
          </p>
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
