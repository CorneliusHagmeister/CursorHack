/**
 * OpenAPI 3.1 spec for agent clients (ChatGPT GPT Actions, Claude tool use, etc.).
 * Import https://<host>/api/openapi.json as an Action schema.
 */

const termIds = ["final_sale", "standard_shipping", "fit_review", "collect_london"];

const offer = {
  type: "object",
  properties: {
    offerId: { type: "string", description: "Pass as acceptOfferId to accept this exact deal." },
    kind: { type: "string", enum: ["cash", "pair-and-perk"] },
    price: { type: "number", description: "GBP the buyer pays." },
    perk: {
      type: ["object", "null"],
      description: "Extra pair included free (Pair & Perk), or null.",
      properties: {
        productId: { type: "string" },
        brand: { type: "string" },
        name: { type: "string" },
        listPrice: { type: "number" },
      },
    },
    terms: {
      type: "array",
      items: { type: "string", enum: termIds },
      description: "What the buyer commits to in return for this deal. Tell the user before accepting.",
    },
    extras: {
      type: "array",
      items: { type: "string", enum: ["free_hemming"] },
      description: "Value the merchant adds to this deal.",
    },
    dealValue: { type: "number", description: "GBP of value on top of the pair: savings + free pair + extras." },
  },
};

const negotiation = {
  type: "object",
  properties: {
    negotiationId: { type: "string" },
    status: { type: "string", enum: ["open", "agreed", "purchased"] },
    merchantReply: { type: "string", description: "What the merchant said. Relay it to the user." },
    decision: {
      type: "string",
      enum: ["accept_offer", "accept_counter", "conditional", "quote", "counter", "info"],
    },
    currency: { type: "string", enum: ["GBP"] },
    product: { type: "object" },
    round: { type: "integer" },
    negotiables: {
      type: "object",
      description: "What the merchant will flex on: commitments it trades price for, value it can add, and free pairs it can include. Floors are never shown.",
    },
    availableTerms: {
      type: "array",
      description: "Commitments the buyer can offer for a better deal, with GBP each is worth.",
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: termIds },
          label: { type: "string" },
          discount: { type: "number" },
        },
      },
    },
    offers: { type: "array", items: offer, description: "Deals currently on the table." },
    agreedDeal: { ...offer, type: ["object", "null"] },
    orderId: { type: ["string", "null"] },
    expiresAt: { type: "string", format: "date-time" },
    guidance: { type: "string", description: "What you can do next." },
  },
};

const error = {
  description: "Error",
  content: {
    "application/json": {
      schema: { type: "object", properties: { error: { type: "string" } } },
    },
  },
};

const idParam = {
  name: "negotiationId",
  in: "path",
  required: true,
  schema: { type: "string" },
};

function spec(origin: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Indigo Lane Negotiation API",
      version: "0.1.0",
      description:
        "Haggle with Indigo Lane, a London second-hand denim shop, on behalf of a shopper. Flow: listProducts → startNegotiation → sendNegotiationMessage (counter or accept) → purchaseNegotiatedDeal. All prices are GBP. The merchant sells deals, not discounts: better deals are traded for commitments (final sale, standard shipping, fit review, collect in London) and it adds value (free Pair & Perk pairs, free hemming) rather than just cutting price. Only the offers returned by the API are binding; the merchant's words are not.",
    },
    servers: [{ url: origin }],
    paths: {
      "/api/products": {
        get: {
          operationId: "listProducts",
          summary: "List jeans for sale",
          description: "Returns the catalogue with ids, list prices, sizes (waist/length) and condition. Use a product id to start a negotiation.",
          "x-openai-isConsequential": false,
          responses: {
            "200": {
              description: "Catalogue",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { products: { type: "array", items: { type: "object" } } },
                  },
                },
              },
            },
          },
        },
      },
      "/api/negotiations": {
        post: {
          operationId: "startNegotiation",
          summary: "Start haggling over a product",
          description: "Opens a negotiation session for one product. Returns the merchant's greeting and opening offers, usually list price and, if available, a Pair & Perk bundle with a free extra pair.",
          "x-openai-isConsequential": false,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["productId"],
                  properties: {
                    productId: { type: "string", description: "Product id from listProducts." },
                    buyerName: { type: "string", description: "Shopper's first name, for a friendlier chat." },
                    perkId: { type: "string", description: "Optional preferred free perk pair (product id)." },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Negotiation started", content: { "application/json": { schema: negotiation } } },
            "400": error,
            "404": error,
          },
        },
      },
      "/api/negotiations/{negotiationId}": {
        get: {
          operationId: "getNegotiation",
          summary: "Get negotiation state and transcript",
          description: "Returns current offers, status, any agreed deal and the full transcript.",
          "x-openai-isConsequential": false,
          parameters: [idParam],
          responses: {
            "200": { description: "Negotiation", content: { "application/json": { schema: negotiation } } },
            "404": error,
          },
        },
      },
      "/api/negotiations/{negotiationId}/messages": {
        post: {
          operationId: "sendNegotiationMessage",
          summary: "Talk to the merchant, counter-offer or accept",
          description: "Chat, counter or accept. Prices go in counterOffer (the merchant replies with a deal that works); commitments the user will make go in offerTerms. Accept with acceptOfferId. Relay merchantReply.",
          "x-openai-isConsequential": false,
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string", description: "What the shopper says to the merchant." },
                    counterOffer: { type: "number", description: "Price in GBP the shopper proposes. Omit if not making an offer." },
                    offerTerms: {
                      type: "array",
                      items: { type: "string", enum: termIds },
                      description: "Terms the user agrees to give (ids from availableTerms). Alone: get a quote. With counterOffer: propose a full deal.",
                    },
                    includePerk: { type: "boolean", description: "True if counterOffer is for the Pair & Perk bundle (with the free extra pair)." },
                    perkId: { type: "string", description: "Switch which free perk pair the bundle includes." },
                    acceptOfferId: { type: "string", description: "offerId from offers[] to accept. Do not combine with counterOffer. Only accept with the user's approval." },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Merchant response", content: { "application/json": { schema: negotiation } } },
            "400": error,
            "404": error,
            "409": error,
          },
        },
      },
      "/api/negotiations/{negotiationId}/purchase": {
        post: {
          operationId: "purchaseNegotiatedDeal",
          summary: "Buy at the agreed price",
          description: "Places the order for the agreed deal. Only call after the user explicitly confirms the price and their details. price must equal agreedDeal.price.",
          "x-openai-isConsequential": true,
          parameters: [idParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["price", "buyerName", "buyerEmail", "shippingCity"],
                  properties: {
                    price: { type: "number", description: "The agreed price in GBP (agreedDeal.price)." },
                    buyerName: { type: "string" },
                    buyerEmail: { type: "string" },
                    shippingCity: { type: "string" },
                    note: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Order placed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { order: { type: "object" }, negotiation: negotiation },
                  },
                },
              },
            },
            "400": error,
            "404": error,
            "409": error,
          },
        },
      },
    },
  };
}

export async function GET(req: Request) {
  const origin = process.env.PUBLIC_BASE_URL ?? new URL(req.url).origin;
  return Response.json(spec(origin));
}
