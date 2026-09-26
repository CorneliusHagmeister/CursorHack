import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PairAndPerk } from "@/components/PairAndPerk";
import { NegotiatePanel } from "@/components/NegotiatePanel";
import { ProductJsonLd } from "@/components/ProductJsonLd";
import { getPerkOptions, getProduct } from "@/lib/products";
import { resolveShopperContext, hasPersonalContext } from "@/lib/context";
import { gbp, productAlt } from "@/lib/format";
import { returnPolicyForCity } from "@/lib/return-policies";

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
  const ctx = await resolveShopperContext({ searchParams: sp });
  const shopper = ctx.shopper;
  const personal = hasPersonalContext(ctx);
  const perkOptions = getPerkOptions(id).slice().sort((a, b) => {
    if (!personal || !shopper) return a.price - b.price;
    const distance = (waist: number) => Math.abs(waist - shopper.waist);
    return distance(a.waist) - distance(b.waist) || a.price - b.price;
  });
  const waistDelta = shopper
    ? Math.abs(product.waist - shopper.waist)
    : 0;
  const overBudget =
    shopper != null ? product.price - shopper.budgetMax : 0;
  const returnPolicy = returnPolicyForCity(personal ? shopper?.city : undefined);

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

      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-10">
        <div className="relative h-[42vh] max-h-80 w-full overflow-hidden rounded-xl bg-stone-100 md:aspect-3/4 md:h-auto md:max-h-[calc(100vh-8rem)]">
          <Image
            src={product.image}
            alt={productAlt(product)}
            fill
            priority
            sizes="(min-width: 768px) 36rem, 100vw"
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

          <div className="mt-6 flex flex-wrap gap-3">
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
            <p className="mt-3 text-sm text-stone-500">
              <Link href="/login" className="underline">
                Sign in
              </Link>{" "}
              to bring fit and budget into the offer.
            </p>
          )}
          {personal && (
            <p className="mt-3 text-sm text-stone-500">
              <Link href="/account" className="underline">
                Let your agent shop as you
              </Link>
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

          <p className="mt-6 text-sm text-stone-600">
            Seller in {product.city} · ships UK-wide · {returnPolicy.badge}
          </p>

          <p className="mt-6 text-stone-600 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <NegotiatePanel primary={product} />
      </div>

      <div className="mt-10">
        <PairAndPerk
          primary={product}
          perkOptions={perkOptions}
          shopperWaist={personal && shopper ? shopper.waist : undefined}
        />
      </div>
    </div>
  );
}
