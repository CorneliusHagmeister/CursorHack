import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PairAndPerk } from "@/components/PairAndPerk";
import { productAlt } from "@/components/ProductCard";
import { NegotiatePanel } from "@/components/NegotiatePanel";
import { getPerkOptions, getProduct } from "@/lib/products";
import { getShopper } from "@/lib/shopper";
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
  const shopper = getShopper();
  const waistDelta = Math.abs(product.waist - shopper.waist);
  const overBudget = product.price - shopper.budgetMax;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="hover:text-indigo-800">
          Shop
        </Link>{" "}
        / {product.brand}
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-stone-200 shadow-inner">
          <Image
            src={product.image}
            alt={productAlt(product)}
            fill
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-950/75 to-transparent px-6 pb-6 pt-16">
            <p className="text-3xl font-semibold text-white">{product.brand}</p>
            <p className="mt-1 text-sm text-white/80">{product.city} seller</p>
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-semibold tracking-tight text-indigo-950 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-indigo-950">
            {gbp(product.price)}
          </p>
          {waistDelta !== 0 && (
            <p className="mt-3 text-base text-indigo-950">
              You usually wear W{shopper.waist}. This is W{product.waist}.
            </p>
          )}
          {overBudget > 0 && (
            <p className="mt-1 text-base text-indigo-950">
              {gbp(overBudget)} over your {gbp(shopper.budgetMax)} ceiling.
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            {[
              ["Waist", `W${product.waist}`],
              ["Length", `L${product.length}`],
              ["Condition", product.condition],
              ["Brand", product.brand],
              ["Cut", product.cut],
              ["Wash", product.wash],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-stone-500">{k}</dt>
                <dd className="font-medium text-indigo-950">{v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-6 text-stone-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#negotiate"
              className="inline-flex rounded-full bg-indigo-950 px-5 py-2.5 text-sm font-medium text-amber-50 hover:bg-indigo-900"
            >
              Negotiate live
            </a>
            <a
              href="#new-ways"
              className="inline-flex rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-white"
            >
              Static Pair &amp; Perk
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <NegotiatePanel primary={product} />
      </div>

      <div className="mt-10">
        <PairAndPerk primary={product} perkOptions={perkOptions} />
      </div>
    </div>
  );
}
