# Haggleberry hackathon context

Event: Grok Bot Commerce x Fleek London.
Product: a negotiation layer (Finn) that any shop can switch on, e.g. via a Shopify app. The second-hand denim store is the demo storefront.
Tagline: the negotiator Mark Twain would've been proud of.
Repo branch: `feature/generic-shop-agents-il1` (merge into `dev`).

## What judges need to see

1. **Generic shop on `/`.** No personalisation. Search, filter chips, denser photo grid.
2. **Context arrives later.** Ad link, Sign in (demo Sam), or a shopper agent bearer token.
3. **Product page is the hack.** Buy now, Make an offer (live negotiation), Bundle (Pair & Perk). Fit and budget lines only when logged in or agent-authenticated.
4. **Merchant proof.** Orders show channel `web` or `agent`. A shipped seed order keeps GMV non-zero.

## Agent surfaces

REST `/api/v1/*`, MCP `/api/mcp`, OpenAPI `/openapi.json`, `llms.txt`, markdown via `Accept: text/markdown`, Product JSON-LD. Score with [is-agentic.com](https://is-agentic.com/).

## Run

```bash
pnpm install
pnpm run dev
pnpm run build
```

## Stage click path

`/` → Sign in (Continue as demo shopper) → `/product/apc-petit-new#negotiate` → Start offer → Knock £10 off (Finn answers with a deal, not a discount) → We'll take the deal → Apply → Confirm → `/merchant` (and `/merchant/live` shows the chat).
