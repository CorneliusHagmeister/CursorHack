# Negotiation API

An HTTP API that lets an AI assistant (ChatGPT, Claude, …) haggle with Indigo Lane on a shopper's behalf, then buy at the agreed price.

This is separate from the on-site deal desk (`/api/negotiate` + `NegotiatePanel`). Neither touches the other.

## How it works

- **Prices are deterministic.** [`src/lib/negotiation/engine.ts`](../src/lib/negotiation/engine.ts) decides every number: a hidden floor per product (20% under list by default), a concession curve, and best-and-final after 4 counters. The bundle price that includes a free Pair & Perk pair is offered alongside the cash price as a second lever.
- **Claude only writes the words.** [`voice.ts`](../src/lib/negotiation/voice.ts) turns the engine's decision into a short reply from "Mo". Claude never sees the floor. If a reply mentions any £ amount or percentage the engine didn't produce, it is replaced by a template. Templates are also used when no key is set or the call fails.
- **Only structured fields are binding.** Prices go in `counterOffer` / `acceptOfferId`, never parsed from chat text. Purchase checks `price` against the server's agreed deal.

## Flow

```
listProducts → startNegotiation → sendNegotiationMessage (repeat) → purchaseNegotiatedDeal
```

Every response includes `offers` (what's on the table right now), `status` (`open` → `agreed` → `purchased`) and a `guidance` string telling the agent what it can do next.

## Endpoints

| Method | Path | operationId |
|---|---|---|
| GET | `/api/products` | `listProducts` |
| POST | `/api/negotiations` | `startNegotiation` |
| GET | `/api/negotiations/{id}` | `getNegotiation` (includes transcript) |
| POST | `/api/negotiations/{id}/messages` | `sendNegotiationMessage` |
| POST | `/api/negotiations/{id}/purchase` | `purchaseNegotiatedDeal` |
| GET | `/api/openapi.json` | OpenAPI 3.1 spec |

### Start

```bash
curl -X POST $HOST/api/negotiations -H 'content-type: application/json' \
  -d '{"productId":"apc-petit-new","buyerName":"Sam"}'
```

```json
{
  "merchantReply": "Hi Sam! The A.P.C. Petit New Standard is £95. Or pay £95 and I'll throw in the Dickies 872 Slim Fit Work Pant (normally £28) for free — that's our Pair & Perk. Happy to hear an offer.",
  "negotiationId": "neg_4b4d…",
  "status": "open",
  "offers": [
    { "offerId": "r0-cash", "kind": "cash", "price": 95, "perk": null },
    { "offerId": "r0-perk-dickies-872", "kind": "pair-and-perk", "price": 95,
      "perk": { "productId": "dickies-872", "brand": "Dickies", "name": "872 Slim Fit Work Pant", "listPrice": 28 } }
  ],
  "guidance": "Send a message with counterOffer …"
}
```

Optional: `perkId` picks a specific free pair.

### Message, counter or accept

Body fields: `message` (text), plus at most one of:

- `counterOffer`: GBP number. Add `includePerk: true` to counter on the bundle.
- `acceptOfferId`: one of the current `offers[].offerId`.

`perkId` switches which free pair the bundle includes.

```bash
curl -X POST $HOST/api/negotiations/$ID/messages -H 'content-type: application/json' \
  -d '{"message":"Would you do 75?","counterOffer":75}'
```

The response adds `decision`: `counter`, `final`, `hold`, `accept_counter`, `accept_offer` or `info`.

Example run on the £95 A.P.C.: counters of 50 / 75 / 78 / 70 got £92 / £87 / £84 / £81 (best and final, or £93 with the free Dickies).

### Purchase

Only after `status` is `agreed`. `price` must equal `agreedDeal.price`.

```bash
curl -X POST $HOST/api/negotiations/$ID/purchase -H 'content-type: application/json' \
  -d '{"price":93,"buyerName":"Sam","buyerEmail":"sam@example.com","shippingCity":"London"}'
```

This creates a normal order (`negotiated-pair-and-perk`, with list price, discount and a summary). It shows on `/merchant`.

### Errors

`{ "error": "…" }` with `400` (bad input), `404` (unknown product/session, or expired after 24h), or `409` (e.g. no deal yet, price mismatch, already purchased).

## Connecting an assistant

**ChatGPT:** create a GPT → Configure → Actions → Import from URL → `https://<host>/api/openapi.json`. Auth: none. `purchaseNegotiatedDeal` is marked `x-openai-isConsequential`, so ChatGPT asks the user before buying. Suggested GPT instruction: *"Negotiate for the user with the Indigo Lane actions. Relay merchantReply, put prices only in counterOffer, and get the user's OK before accepting or purchasing."*

**Claude:** use the same OpenAPI operations as tool definitions. An MCP wrapper around `src/lib/negotiation/service.ts` is the natural next step.

The host must be public (deployment or tunnel). ChatGPT can't reach localhost.

## Config

All optional; see `.env.example`.

| Variable | Effect |
|---|---|
| `AI_GATEWAY_API_KEY` | Merchant replies via Vercel AI Gateway (`anthropic/claude-opus-5`) |
| `ANTHROPIC_API_KEY` | Used when no gateway key is set; calls the Claude API directly |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_*`) | Sessions in Upstash Redis; otherwise in memory (lost on restart / across serverless instances) |
| `PUBLIC_BASE_URL` | Overrides the server URL in the OpenAPI spec |

Responses include `replySource: "llm" | "template"` so you can tell which voice answered.

## Known limits

- Orders use the shared file/memory store, so on serverless hosts they may not persist.
- No stock reservation: two agents can agree on the same pair.
- Endpoints are unauthenticated (demo only).
