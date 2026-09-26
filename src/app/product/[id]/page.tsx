import Link from "next/link";
import { notFound } from "next/navigation";
import { PairAndPerk } from "@/components/PairAndPerk";
import { getPerkOptions, getProduct } from "@/lib/products";
import { gbp } from "@/lib/format";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();
  const perkOptions = getPerkOptions(id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="hover:text-indigo-800">
          Shop
        </Link>{" "}
        / {product.brand}
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-inner"
          style={{
            background: `linear-gradient(160deg, ${product.accent} 0%, #0f172a 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 4px)",
            }}
          />
          <div className="absolute bottom-6 left-6 right-6">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">
              {product.city} seller
            </p>
            <p className="mt-1 text-3xl font-semibold text-white">
              {product.brand}
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            {product.cut} · {product.wash}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-indigo-950 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-indigo-950">
            {gbp(product.price)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Waist", `W${product.waist}`],
              ["Length", `L${product.length}`],
              ["Condition", product.condition],
              ["Brand", product.brand],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2"
              >
                <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                  {k}
                </dt>
                <dd className="font-medium text-indigo-950">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-stone-600 leading-relaxed">
            {product.description}
          </p>

          <a
            href="#new-ways"
            className="mt-8 inline-flex w-fit rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-medium text-amber-50 hover:bg-indigo-900"
          >
            Open New Ways to Buy →
          </a>
        </div>
      </div>

      <div className="mt-12">
        <PairAndPerk primary={product} perkOptions={perkOptions} />
      </div>
    </div>
  );
}
