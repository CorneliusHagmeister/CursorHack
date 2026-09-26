import Link from "next/link";
import { productAlt } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { defaultPolicy } from "@/lib/negotiation/policies";
import { DealBuilder, type BuilderTerm } from "./DealBuilder";

/** Shopper words for the commitments Finn trades price for */
const SHORT_LABELS: Record<string, string> = {
  final_sale: "Skip returns",
  store_credit: "Store credit, not a refund",
  standard_shipping: "Slower shipping",
  fit_review: "Post a fit review",
  collect_london: "Collect in London",
};

/** How businesses get their discounts, and the version you get here */
const PLAYBOOK = [
  { theirs: "Commit to the order, no cancellations", yours: "Skip returns you'd never use" },
  { theirs: "Take credit notes instead of refunds", yours: "Store credit instead of your money back" },
  { theirs: "Accept flexible delivery windows", yours: "Wait five days instead of next-day" },
  { theirs: "Give a case study or a reference", yours: "Post a fit review with photos" },
];

const STEPS = [
  {
    title: "Make an offer",
    body: "Name a price on anything in the shop, or send your AI assistant to do it.",
  },
  {
    title: "Trade what you don't need",
    body: "Finn, who runs the shop, comes back with a deal: a lower price for things you can live without.",
  },
  {
    title: "Check out at your price",
    body: "Take the deal and it's locked in. No codes, no waiting for a sale.",
  },
];

function Builder() {
  const product = getProduct("apc-petit-new");
  if (!product) return null;
  const policy = defaultPolicy(product);
  const terms: BuilderTerm[] = Object.entries(policy.terms)
    .filter(([, t]) => t.enabled && t.discount > 0)
    .map(([id, t]) => ({ id, label: SHORT_LABELS[id] ?? id, discount: t.discount }));
  return (
    <div className="relative">
      <p
        className="haggle-tag absolute -top-5 right-6 z-10 rounded-md bg-stitch px-3 py-1 font-slab text-sm font-bold text-rinse shadow-sm"
        aria-hidden
      >
        Deals, not discounts
      </p>
      <DealBuilder
        product={{
          id: product.id,
          brand: product.brand,
          name: product.name,
          image: product.image,
          alt: productAlt(product),
          listPrice: product.price,
        }}
        floorPrice={policy.floorPrice}
        terms={terms}
      />
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="border-b border-stone-200 pb-14 pt-4 sm:pt-10">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_29rem]">
        <div className="max-w-xl">
          <h1 className="font-slab text-5xl font-bold leading-[1.02] text-rinse sm:text-6xl">
            Big companies never pay list price.
          </h1>
          <p className="mt-4 font-slab text-2xl font-semibold text-berry sm:text-3xl">Now you don&apos;t have to either.</p>
          <p className="mt-5 text-lg leading-relaxed text-stone-700">
            Businesses get better prices by giving up things they don&apos;t need. Haggleberry lets you
            do the same on clothes: skip returns, take store credit instead of a refund, wait a few
            days for delivery. Finn takes each one off the price.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="#shop"
              className="rounded-full bg-rinse px-5 py-2.5 text-sm font-medium text-white hover:bg-rinse/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch"
            >
              Start shopping
            </Link>
            <Link
              href="#agents"
              className="text-sm font-medium text-rinse underline decoration-stitch decoration-2 underline-offset-4 hover:decoration-rinse"
            >
              Send your AI assistant
            </Link>
          </div>
        </div>
        <Builder />
      </div>

      <div className="mt-20">
        <h2 className="font-slab text-3xl font-bold text-rinse">Same playbook, smaller basket</h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          Procurement teams have always traded terms for price. Here is how each move translates when
          you&apos;re buying a single outfit.
        </p>
        <table className="mt-6 w-full max-w-4xl text-left">
          <thead>
            <tr className="text-sm text-stone-500">
              <th scope="col" className="pb-2 font-normal">What a big buyer gives up</th>
              <th scope="col" className="w-10 pb-2" aria-hidden />
              <th scope="col" className="pb-2 font-normal">What you give up on Haggleberry</th>
            </tr>
          </thead>
          <tbody>
            {PLAYBOOK.map((row) => (
              <tr key={row.yours} className="border-t border-stone-200">
                <td className="py-3.5 pr-3 align-top text-stone-500">{row.theirs}</td>
                <td className="py-3.5 align-top text-stitch" aria-hidden>
                  <svg viewBox="0 0 28 12" className="mt-1.5 h-3 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 6h24M20 1l5 5-5 5" />
                  </svg>
                </td>
                <td className="py-3.5 align-top font-medium text-rinse">{row.yours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="mt-16 grid gap-8 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-4">
            <span className="font-slab text-3xl font-bold leading-none text-stitch tabular-nums" aria-hidden>
              {i + 1}
            </span>
            <div>
              <h3 className="font-semibold text-rinse">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div id="shops" className="mt-16 grid scroll-mt-24 gap-8 rounded-2xl bg-rinse px-6 py-8 text-white sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div>
          <h2 className="font-slab text-3xl font-bold">Run a shop? Put Finn on your counter.</h2>
          <p className="mt-3 leading-relaxed text-white/80">
            You set the rules and Finn haggles inside them, with shoppers and with their AI
            assistants. A Shopify app is on the way, so any Shopify store can switch Finn on
            without rebuilding its checkout.
          </p>
          <Link
            href="/merchant/live"
            className="mt-6 inline-block rounded-full bg-stitch px-5 py-2.5 text-sm font-medium text-rinse hover:bg-stitch/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            See the merchant desk
          </Link>
        </div>
        <ul className="space-y-4 text-sm leading-relaxed text-white/85">
          <li>
            <p className="font-semibold text-white">A floor Finn never goes below</p>
            <p>Set a target and a walk-away price per product. Finn opens high and gives ground slowly.</p>
          </li>
          <li>
            <p className="font-semibold text-white">Only trades that save you money</p>
            <p>Choose what each commitment is worth to you: no returns, store credit, slower shipping, a review.</p>
          </li>
          <li>
            <p className="font-semibold text-white">Every haggle, live</p>
            <p>Watch negotiations as they happen and see which deals turn into orders.</p>
          </li>
        </ul>
      </div>

      <div
        id="agents"
        className="mt-14 scroll-mt-24 rounded-2xl border-2 border-dashed border-stitch/50 px-5 py-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-6"
      >
        <div className="max-w-2xl">
          <h2 className="font-slab text-xl font-semibold text-rinse">Shopping with ChatGPT, Claude or Grok?</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-600">
            Your assistant can search the catalogue, haggle with Finn and buy what you agreed on, at the
            price you agreed.
          </p>
        </div>
        <Link
          href="/llms.txt"
          className="mt-4 inline-block shrink-0 rounded-full border border-rinse px-4 py-2 text-sm font-medium text-rinse hover:bg-rinse hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stitch sm:mt-0"
        >
          Connect an assistant
        </Link>
      </div>
    </section>
  );
}
