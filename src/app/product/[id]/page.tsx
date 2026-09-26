import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PairAndPerk } from "@/components/PairAndPerk";
import { NegotiatePanel } from "@/components/NegotiatePanel";
import { ProductJsonLd } from "@/components/ProductJsonLd";
import { getPerkOptions, getProduct, listProducts } from "@/lib/products";
import { PHOTO_SOURCES } from "@/lib/photo-sources";
import { resolveShopperContext, hasPersonalContext } from "@/lib/context";
import { gbp, productAlt } from "@/lib/format";
import { returnPolicyForCity } from "@/lib/return-policies";

type Search = Promise<Record<string, string | string[] | undefined>>;

const pad = (value: number) => String(value).padStart(2, "0");

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

  const catalogue = listProducts();
  const position = catalogue.findIndex((p) => p.id === product.id) + 1;
  const photo = PHOTO_SOURCES[product.id];
  const details = [
    ["Size", `W${product.waist} / L${product.length}`],
    ["Condition", product.condition],
    ["Cut", product.cut],
    ["Wash", product.wash],
  ];

  return (
    <div className="px-3 pb-10 pt-6">
      <ProductJsonLd product={product} />
      <nav aria-label="Breadcrumb" className="text-caps px-1 text-ink">
        <Link href="/" className="hover:underline">
          Denim
        </Link>{" "}
        <span className="tabular-nums text-muted">
          {pad(position)} / {pad(catalogue.length)}
        </span>
      </nav>

      {ctx.source === "ad" && ctx.campaign && (
        <p className="mt-2 px-1 text-sm text-ink">From the {ctx.campaign} campaign.</p>
      )}

      <div className="mt-4 grid items-start gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10">
        <figure>
          <div className="relative h-[46vh] max-h-96 w-full md:aspect-3/4 md:h-auto md:max-h-[calc(100vh-9rem)]">
            <Image
              src={product.image}
              alt={productAlt(product)}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-contain mix-blend-multiply"
            />
          </div>
          {photo && (
            <figcaption className="text-caps mt-2 px-1 text-muted">
              Photo{" "}
              <a href={photo.href} className="underline underline-offset-2 hover:text-ink" rel="noreferrer" target="_blank">
                {photo.label}
              </a>
            </figcaption>
          )}
        </figure>

        <div className="flex flex-col md:sticky md:top-20">
          <p className="text-caps text-muted">{product.brand}</p>
          <h1 className="font-display mt-2 text-4xl text-ink sm:text-5xl">{product.name}</h1>

          {personal && shopper && waistDelta !== 0 && (
            <p className="mt-4 text-sm text-ink">
              You usually wear W{shopper.waist}. This is W{product.waist}.
            </p>
          )}
          {personal && shopper && overBudget > 0 && (
            <p className="mt-1 text-sm text-ink">
              {gbp(overBudget)} over your {gbp(shopper.budgetMax)} ceiling.
            </p>
          )}

          <div className="mt-6 space-y-1">
            <Link
              href={`/checkout?primary=${product.id}`}
              className="text-caps flex items-center justify-between rounded-tile bg-ink px-4 py-3.5 text-white hover:bg-black"
            >
              <span>Buy now</span>
              <span className="tabular-nums">{gbp(product.price)}</span>
            </Link>
            <a
              href="#negotiate"
              className="text-caps flex items-center justify-between rounded-tile bg-white px-4 py-3.5 text-ink hover:bg-hairline"
            >
              <span>Make an offer</span>
              <span className="text-muted">Haggle live</span>
            </a>
          </div>

          <p className="text-caps mt-3 text-muted">
            {personal ? (
              <Link href="/account" className="underline underline-offset-2 hover:text-ink">
                Let your agent shop as you
              </Link>
            ) : (
              <>
                <Link href="/login" className="underline underline-offset-2 hover:text-ink">
                  Sign in
                </Link>{" "}
                to bring fit and budget into the offer
              </>
            )}
          </p>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-tile bg-hairline">
            {details.map(([label, value]) => (
              <div key={label} className="bg-white px-3 py-2.5">
                <dt className="text-caps text-muted">{label}</dt>
                <dd className="text-caps mt-0.5 text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-caps mt-4 text-ink">
            Seller in {product.city} <span className="text-muted">· ships UK-wide · {returnPolicy.badge}</span>
          </p>

          <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink">{product.description}</p>
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
