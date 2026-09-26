# Indigo Lane

Fleek London × Grok Bot Commerce hackathon demo — **second-hand jeans** with a sharp **Pair & Perk** New Ways to Buy mechanic and a wired size/condition assist chat.

Two-sided: **consumer storefront** + **merchant dashboard**, shared catalogue and orders.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS v4
- File/memory order store (`data/orders.json` locally; in-memory fallback on read-only FS)
- No required API keys — assist is rule-based against the seeded catalogue

## Run locally

```bash
cd /Users/manglekuo/dev/CursorHack   # or your clone path
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build && npm start
```

## Env vars

Copy `.env.example` if you want placeholders. **Nothing is required for the demo.**

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Optional future wire-up |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Optional — never commit real keys |

## 3-minute demo script

**User:** London shopper who wants quality second-hand denim without guessing size/condition — and hates coupon theatre.

**Pain:** Marketplaces feel either “full price, hope it fits” or “fake 40% off.” Complementary pieces sit unsold.

**Live flow (happy path):**

1. **Home** (`/`) — skim hero pairs + perk pool.
2. Open **Fit assist** (bottom-right) → ask `W31 very good` → click a quick link (e.g. Nudie / Edwin).
3. On the **product** page → scroll to **New Ways to Buy → Pair & Perk** → select a free complementary perk → **Continue to checkout**.
4. **Checkout** — confirm prefilled buyer → **Confirm Pair & Perk order**.
5. **Order confirm** — see primary paid + perk free + savings.
6. **Merchant** (`/merchant`) — same order appears with `pair-and-perk` badge; advance status Confirmed → Packed → Shipped.

**Benefit:** One clear negotiation/bundle mechanic (pay full for hero → complementary add-on free) plus real assist UI that reads waist/condition and the live catalogue — merchants see the attribution.

## Exact click-path

`/` → product (e.g. `/product/apc-petit-new` or `/product/nudie-lean-dean`) → `#new-ways` Pair & Perk → pick perk → Checkout → Confirm → `/order/[id]` → `/merchant`

## Seeded catalogue

12 UK-priced second-hand jeans (heroes + perk-eligible). See `src/lib/products.ts`.

## Vercel

Push `dev` (or `main`), import the GitHub repo in Vercel, framework preset Next.js — no env vars required for the demo.
