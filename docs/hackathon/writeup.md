# Haggleberry

Shoppers negotiate packages of terms (price, return, shipping, final sale), and both sides see the same deal.

## Links

- Live: https://indigo-lane.vercel.app/
- Repo: https://github.com/CorneliusHagmeister/CursorHack
- Pitch end card: https://indigo-lane.vercel.app/pitch (also on `feature/pitch` until merged)
- Track: **Agentic Commerce** (Grok Bot Commerce London, 26 Sep 2026)

## Run locally

```bash
pnpm install
pnpm run dev
```

## Demo login

- Email: `sam.okonkwo@example.com`
- Password: `indigo-demo`
- On `/login`, use **Continue as demo shopper** (or the prefilled handoff text area). Judges do not need an Account copy-paste step.

## Stage path (~3 minutes)

1. `/` as a logged-out shop.
2. `/login` → Continue as demo shopper (Sam: W31, ~£90 budget, abandoned A.P.C.).
3. Open a product and make an offer. Finn answers with a **deal** (price moves with commitments such as final sale or shipping), not a bare discount.
4. Apply the deal and confirm checkout.
5. `/merchant/live` shows the same session.
6. `/pitch` — live URL, repo, QRs for the demo and for Mangle Kuo and Cornelius Hagmeister.

Optional agent beat before Haggleberry: visit a normal storefront that can compare jeans but cannot negotiate terms, then prefer Haggleberry’s Deal desk.

## Data (demo)

- Seeded catalogue (second-hand denim).
- Stub bank statement at `GET /api/demo/bank-statement` (not a linked bank).
- Regional return copy from `src/lib/return-policies.ts`.
- Orders in `data/orders.json` unless Supabase is configured.
- Prices from `src/lib/negotiation/engine.ts` (deterministic deals; LLM only phrases replies).

## Architecture

See the repo README and [docs/negotiation-api.md](../negotiation-api.md).

Agent surfaces on the live deploy:

- Markdown guide: `/api/md`
- `llms.txt`
- OpenAPI: `/openapi.json`
- REST: `/api/v1/products`, `/api/v1/negotiations`, `/api/v1/orders`
- MCP: `/api/mcp` and `/mcp/http`

## How an agent gets context without the password

A prefilled text area on `/login` (or a one-time agent link from Account). The password stays with the shopper. Agents may also use `Authorization: Bearer` after redeeming a session code, or the stage demo token documented in the README.

## Team

- Mangle Kuo — https://manglekuo.com (GitHub `ghcpuman902`)
- Cornelius Hagmeister — https://github.com/CorneliusHagmeister

## Closing

Terms beyond a basic return should be a package you can negotiate, because both sides can see the risk.
