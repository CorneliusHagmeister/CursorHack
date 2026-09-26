# Indigo Lane

Fleek London × Grok Bot Commerce — **second-hand jeans** with **Pair & Perk** and a **live negotiation** desk that uses a **returning shopper’s remembered context**.

See **CONTEXT.md** / **HANDOFF.md** for the durable spine and IDE handoff.

## Stack

Next.js App Router · TypeScript · Tailwind v4 · npm · file/memory orders · **no API keys required**

## Run

```bash
cd ~/dev/CursorHack
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Env vars

Optional only — copy `.env.example`. Demo runs without Supabase keys.

## 3-minute demo script

**User:** Sam Okonkwo — returning London shopper (W31, APC/Nudie, budget £90). Abandoned £95 APC last week.

**Pain:** Cold-start marketplaces ignore fit history; “deals” are static coupons, not live negotiation.

**Live flow:**

1. **Home** — point at the **Remembered profile** banner (fit, brands, past purchases, last session).
2. **Negotiate on A.P.C.** → `/product/apc-petit-new#negotiate` → **Start live negotiation** (desk greets Sam with past context).
3. On stage: **Too pricey — knock £10 off** → optional **Better free perk?** → **Apply deal → checkout**.
4. Checkout prefilled as Sam → **Confirm negotiated order**.
5. **Merchant** — order shows `negotiated-pair-and-perk` + negotiation summary.

**Benefit:** Past personal context + visible back-and-forth → landed Pair & Perk the merchant can see.

## Exact click-path

`/` → Sam banner → `/product/apc-petit-new#negotiate` → Start → counter on price/perk → Apply deal → Confirm → `/merchant`
