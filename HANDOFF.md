# Handoff — continue in Cursor

**When:** Sat 26 Sep 2026 · mid-hack · freeze **16:30 London**  
**Repo:** `/Users/manglekuo/dev/CursorHack` · branch **`dev`** · https://github.com/CorneliusHagmeister/CursorHack

Read [CONTEXT.md](./CONTEXT.md) for event, judges, product spine and routes.

## Current state

Shipped on `dev` (commit `ee228d0` and later):

- Indigo Lane Next.js storefront + merchant dashboard
- 12 seeded UK second-hand jeans
- **Pair & Perk** New Ways to Buy end-to-end into checkout
- Fit assist chat (`/api/assist`)
- `npm run build` was green at scaffold

**In flight / likely dirty working tree** (personal context + live negotiation):

- `src/lib/shopper.ts`, `src/components/ShopperContext.tsx`
- `src/lib/negotiate.ts`, `src/components/NegotiatePanel.tsx`, `src/app/api/negotiate/`
- Edits to home, product PDP, checkout, header, orders API, types

Finish that path before polish: returning shopper visible → multi-turn negotiate → apply deal → merchant shows order.

## Demo click-path (target)

1. Open `/` as returning shopper — **show remembered size/brands/past buys**.
2. Open a hero product (e.g. `/product/apc-petit-new` or `/product/nudie-lean-dean`).
3. **Negotiate live** (panel/chat) — counters on perk / price / condition using personal context.
4. Lock Pair & Perk → checkout → confirm.
5. Flip to `/merchant` — same order, `pair-and-perk` (or negotiated) attribution.

## Do next (priority before freeze)

1. Land personal context + live negotiation; commit + push `dev`.
2. Keep one happy path bulletproof for a 3-minute stage demo.
3. Optional: Vercel preview URL; richer images; tighten README script to memory → negotiate → merchant.
4. Do **not** rewrite the app from scratch or add required API keys.

## Commands

```bash
cd /Users/manglekuo/dev/CursorHack
git checkout dev
npm run dev
npm run build
git add -A && git commit -m "…" && git push origin dev
```

## What not to rewrite

- Pair & Perk as the New Ways to Buy mechanic
- Two-sided consumer ↔ merchant shared orders
- Seeded denim catalogue approach
- Demo spine: **past personal context → live negotiation → merchant proof**

## Cloud agents note

Cursor cloud agents may lack GitHub app access to this repo even when local `gh` has WRITE. Prefer local / IDE Cursor on this clone, or grant repo access in Cursor’s GitHub integration if launching cloud agents.
