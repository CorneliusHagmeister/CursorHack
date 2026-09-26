# Indigo Lane — project context

Durable context for Cursor agents working in this repo.

## Event

- **Hackathon:** Grok Bot Commerce London (Fleek HQ)
- **When:** Saturday 26 September 2026 · doors 09:00 · hacking from 09:45 · **code freeze 16:30** · top-5 demos 17:30 (3 min each) · close 18:00
- **Venue:** Fleek, 20–22 Commercial St, London E1 6LP
- **Official page:** https://gb-ecommerce-hackathon-09-2026.teamdeel.workers.dev/hackathon
- **Track fit:** New Ways to Buy + Agentic Commerce (also touches Storefront / Buyer)

### Judging criteria

Problem · Experience · Execution · AI / Grok Bot use · Commerce depth · Originality · Impact

### Judges (angles)

| Judge | Role | Show them |
|-------|------|-----------|
| Josh Warwick | Wassist | Real shopper conversation that reaches a relevant item / next step |
| Alex Nikityuk | Fleek AI | Workflow that saves reseller/operator steps; clear before/after |
| Nuan Zhang | Episode 1 | Who needs it, how often, why it can become more than a demo |
| Maria Luque Anguita | EF | Why this team understands the customer and can keep building |
| Jim Tattersall | Huge | Fits a real merchant storefront/catalogue/ops without fantasy rebuild |

### Partners to lean on

Fleek (wholesale vintage marketplace) · Wassist (WhatsApp shopping agent) · Huge (composable commerce) · Vercel · Supabase · Tavily · Cursor · Grok Bot

## Product

**Indigo Lane** — two-sided second-hand **denim / jeans** shop.

- **Consumer:** browse comparable UK-priced second-hand jeans; discover; buy via a distinctive mechanic.
- **Merchant:** see inventory interest / orders that prove both sides share one system.
- **New Ways to Buy:** **Pair & Perk** — pay full price for a hero pair → complementary perk free (negotiation/bundle, not fake % off).
- **Agent touch:** Fit assist + (in flight) live **Negotiate** using personal shopper context.

### Demo spine (locked)

1. **Personal context from the past** — returning shopper (size, brands, condition prefs, prior buys) visible in UI.
2. **Live negotiation** — on-stage multi-turn interaction that proposes/counters Pair & Perk deals and can apply them into checkout.
3. **Two-sided proof** — merchant dashboard shows the same negotiated order.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS v4
- Shared catalogue: `src/lib/products.ts` (~12 UK-priced jeans)
- Orders: `data/orders.json` (file) with in-memory fallback
- Assist/negotiate: rule-based APIs under `src/app/api/` — **no required API keys**
- Optional placeholders only in `.env.example` (Supabase etc.) — never commit secrets

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Consumer home / catalogue |
| `/product/[id]` | PDP + Pair & Perk (`#new-ways`) + negotiate UI |
| `/checkout` | Confirm Pair & Perk order |
| `/order/[id]` | Confirmation |
| `/merchant` | Merchant dashboard (same orders) |
| `/api/assist` | Fit assist chat |
| `/api/negotiate` | Live negotiation (in flight / present) |
| `/api/orders` | Order create/list |

## Key source files

- `src/lib/products.ts` — seeded jeans
- `src/lib/shopper.ts` — returning shopper profile (personal context)
- `src/lib/negotiate.ts` — negotiation logic
- `src/components/ShopperContext.tsx` — show remembered context
- `src/components/NegotiatePanel.tsx` — live negotiation UI
- `src/components/Header.tsx`
- `README.md` — run + 3-min script

## Repo

- Local: `/Users/manglekuo/dev/CursorHack`
- Remote: https://github.com/CorneliusHagmeister/CursorHack
- Working branch: **`dev`** (also pushed `main` at initial scaffold)
- Auth for push on this machine: `gh` as **ghcpuman902** (WRITE on the repo)

## Run

```bash
cd /Users/manglekuo/dev/CursorHack
npm install
npm run dev    # http://localhost:3000
npm run build  # must stay green before freeze
```

Prefer **npm** (lockfile present). Ignore stray `pnpm-*` unless you deliberately switch.
