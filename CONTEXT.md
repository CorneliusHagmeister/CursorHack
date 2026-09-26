# Indigo Lane hackathon context

Event: Grok Bot Commerce x Fleek London. Freeze 16:30 Europe/London.
Product: two-sided second-hand jeans marketplace, shopper and merchant.
Repo: `/Users/manglekuo/dev/CursorHack`, branch `dev`, remote `https://github.com/CorneliusHagmeister/CursorHack.git`.

## What judges need to see

Sam Okonkwo is a returning shopper, not a cold start. W31 L32, prefers A.P.C., Nudie, and Edwin, condition at least Good, budget at most £90, past purchases, and an abandoned £95 A.P.C. cart. That shows in the header, the home banner, the product fit line, and checkout prefill.

The product page has a multi-turn deal desk at `#negotiate`. Assistant lines appear one after another. It uses Sam's history and counters on price, a better perk, or condition. Apply deal sends it to checkout.

The same order lands on `/merchant` with mechanic `negotiated-pair-and-perk` or `pair-and-perk`, plus the negotiation summary.

Pair & Perk: pay full or negotiated price on a hero pair, and a perk-eligible pair is free.

## Stack

Next.js App Router 16, TypeScript, Tailwind CSS v4, npm.
Catalogue is seeded in `src/lib/products.ts` (12 UK-priced jeans). Orders are file or memory in `src/lib/store.ts` and `data/orders.json`.
No API keys. Assist and negotiate are rule-based. Supabase placeholders live only in `.env.example`.

## Routes

| Route | Role |
| --- | --- |
| `/` | Storefront, shopper banner, heroes and perks |
| `/product/[id]` | Product, fit vs Sam, negotiate panel, static Pair & Perk |
| `/checkout` | Prefills Sam and shows the negotiated deal |
| `/order/[id]` | Confirmation |
| `/merchant` | Orders and catalogue. Status moves Confirmed, Packed, Shipped |
| `/api/negotiate` | Live negotiation turns |
| `/api/orders` | Create and list orders |
| `/api/assist` | Fit desk chat |
| `/api/products` | Catalogue |

## Source

- `src/lib/shopper.ts` holds `RETURNING_SHOPPER`
- `src/lib/negotiate.ts` is the deal engine
- `src/components/NegotiatePanel.tsx` is the live UI
- `src/components/ShopperContext.tsx` is the remembered profile
- `src/lib/products.ts` is the seed catalogue
- `src/lib/types.ts` is where an order stores list price, discount, negotiation summary, shopper id, and mechanic

## Run

```bash
cd ~/dev/CursorHack
npm install
npm run dev
npm run build
```

## Stage click path

Open `/`. Point at the Sam strip and the abandoned £95 A.P.C. cart, then the Petit New Standard on the page. Go to `/product/apc-petit-new#negotiate`. Start live negotiation. The first lines are W31 against listed W30, then £5 over the £90 ceiling. Quick reply "Knock £10 off" (lands at £85). Apply deal to checkout. Confirm as Sam. Open `/merchant`. A shipped Nudie order is already there so GMV is not £0 if you stop mid-flow.
