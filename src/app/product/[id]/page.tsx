import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PairAndPerk } from "@/components/PairAndPerk";
import { gbp, productAlt } from "@/lib/format";
import { NegotiatePanel } from "@/components/NegotiatePanel";
import { ProductJsonLd } from "@/components/ProductJsonLd";
import { getPerkOptions, getProduct } from "@/lib/products";
import { resolveShopperContext, hasPersonalContext } from "@/lib/context";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Search;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const product = getProduct(id);
  if (!product) notFound();
  const perkOptions = getPerkOptions(id);
  const ctx = await resolveShopperContext({ searchParams: sp });
  const shopper = ctx.shopper;
  const personal = hasPersonalContext(ctx);
  const waistDelta = shopper
    ? Math.abs(product.waist - shopper.waist)
    : 0;
  const overBudget =
    shopper != null ? product.price - shopper.budgetMax : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <ProductJsonLd product={product} />
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="hover:text-stone-800">
          Shop
        </Link>{" "}
        / {product.brand}
      </p>

      {ctx.source === "ad" && ctx.campaign && (
        <p className="mb-4 text-sm text-stone-600">
          From the {ctx.campaign} campaign.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100">
          <Image
            src={product.image}
            alt={productAlt(product)}
            fill
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-stone-500">{product.brand}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-stone-900">
            {gbp(product.price)}
          </p>

          {personal && shopper && waistDelta !== 0 && (
            <p className="mt-3 text-base text-stone-800">
              You usually wear W{shopper.waist}. This is W{product.waist}.
            </p>
          )}
          {personal && shopper && overBudget > 0 && (
            <p className="mt-1 text-base text-stone-800">
              {gbp(overBudget)} over your {gbp(shopper.budgetMax)} ceiling.
            </p>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Size", `W${product.waist} / L${product.length}`],
              ["Condition", product.condition],
              ["Cut", product.cut],
              ["Wash", product.wash],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-stone-500">{k}</dt>
                <dd className="font-medium text-stone-900">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-medium text-stone-900">Seller in {product.city}</p>
            <p className="mt-0.5 text-stone-500">Member · ships UK-wide</p>
          </div>

          <p className="mt-6 text-stone-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/checkout?primary=${product.id}`}
              className="inline-flex rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
            >
              Buy now
            </Link>
            <a
              href="#negotiate"
              className="inline-flex rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Make an offer
            </a>
          </div>

          {!personal && (
            <p className="mt-3 text-xs text-stone-500">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to bring fit and budget into the offer.
            </p>
          )}
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
