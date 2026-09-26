# Indigo Lane — Hackathon Context

**Event:** Grok Bot Commerce × Fleek London · freeze **16:30 Europe/London**  
**Product:** Two-sided second-hand **jeans/denim** marketplace (consumer + merchant)  
**Repo:** `/Users/manglekuo/dev/CursorHack` · branch **`dev`** · remote `https://github.com/CorneliusHagmeister/CursorHack.git`

## Demo spine (what judges must see)

1. **Personal context from the past** — not a cold start. Seeded returning shopper **Sam Okonkwo** (W31 L32, prefers A.P.C. / Nudie / Edwin, condition ≥ Good, budget ≤ £90, past purchases + abandoned £95 APC cart). Shown in header strip + home banner + product fit callout + checkout prefill.
2. **Live negotiation on stage** — multi-turn Deal desk on the product page (`#negotiate`). Stepwise visible assistant bubbles (typing → reveal). Uses shopper memory; counters on **price**, **better perk**, **condition trade-off**; **Apply deal → checkout**.
3. **Merchant proof** — same order lands on `/merchant` with mechanic `negotiated-pair-and-perk` (or `pair-and-perk`) + negotiation summary / concessions.

**New Ways to Buy mechanic:** **Pair & Perk** — pay (full or negotiated) on a hero pair → complementary perk-eligible pair **free**.

## Stack

- Next.js App Router 16 · TypeScript · Tailwind CSS v4 · npm
- Data: seeded catalogue `src/lib/products.ts` (12 UK-priced jeans); orders file/memory `src/lib/store.ts` + `data/orders.json`
- No required API keys. Assist/negotiate are **rule-based** (demo-safe). Optional Supabase placeholders only in `.env.example`.

## Key routes

| Route | Role |
|-------|------|
| `/` | Storefront + full **ShopperContext** banner + heroes/perks |
| `/product/[id]` | PDP · fit vs Sam · **NegotiatePanel** · static Pair & Perk |
| `/checkout?primary&perk&price&…` | Prefills Sam; shows negotiated deal card |
| `/order/[id]` | Confirmation |
| `/merchant` | Orders + catalogue; status Confirmed → Packed → Shipped |
| `/api/negotiate` | Live negotiation turns |
| `/api/orders` | Create/list orders (negotiated fields) |
| `/api/assist` | Fit desk chat (global FAB) |
| `/api/products` | Catalogue |

## Important source files

- `src/lib/shopper.ts` — `RETURNING_SHOPPER`
- `src/lib/negotiate.ts` — deal engine (price / perk / condition / accept)
- `src/components/NegotiatePanel.tsx` — live UI
- `src/components/ShopperContext.tsx` — remembered profile UI
- `src/lib/products.ts` — seed jeans + perk eligibility
- `src/lib/types.ts` — Order includes `listPrice`, `discount`, `negotiationSummary`, `shopperId`, mechanic union

## Run

```bash
cd ~/dev/CursorHack   # or /Users/manglekuo/dev/CursorHack
npm install
npm run dev           # http://localhost:3000
npm run build         # must pass before freeze
```

## Exact stage click-path

`/` (show Sam’s remembered context) → **Negotiate on A.P.C.** (or `/product/apc-petit-new#negotiate`) → **Start live negotiation** → quick reply **Too pricey — knock £10 off** → optional **Better free perk?** → **Accept / Apply deal → checkout** → Confirm as Sam → `/order/[id]` → `/merchant` (see negotiated order).
