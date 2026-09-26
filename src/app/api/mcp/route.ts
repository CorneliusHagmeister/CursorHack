import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { resolveShopperContext } from "@/lib/context";
import { compatPurchase, compatStateless } from "@/lib/negotiation/compat";
import {
  serviceGetOrder,
  serviceGetProduct,
  servicePlaceOrder,
  serviceSearchProducts,
} from "@/lib/services";
import { RETURNING_SHOPPER } from "@/lib/shopper";
import type { Condition } from "@/lib/types";

const handler = createMcpHandler((server) => {
  server.registerTool(
    "search_products",
    {
      title: "Search products",
      description: "Search the Haggleberry catalogue. Everything takes offers.",
      inputSchema: z.object({
        q: z.string().optional(),
        waist: z.number().int().optional(),
        brand: z.string().optional(),
        condition: z.string().optional(),
        max_price: z.number().optional(),
      }),
    },
    async (input) => {
      const products = serviceSearchProducts({
        q: input.q,
        waist: input.waist,
        brand: input.brand,
        condition: input.condition as Condition | undefined,
        maxPrice: input.max_price,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ count: products.length, products }, null, 2),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "Fetch one catalogue item by id.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const product = serviceGetProduct(id);
      if (!product) {
        return {
          content: [{ type: "text", text: "Product not found" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
      };
    }
  );

  server.registerTool(
    "negotiate",
    {
      title: "Negotiate",
      description:
        "Start or continue a deal on a product. Pass an empty message to open. The merchant sells deals, not discounts: it trades price for commitments (final sale, store credit instead of refunds, standard shipping, fit review, collect in London) and adds value (free Pair & Perk pair, free hemming). Pass back deal.negotiationId to continue the same negotiation.",
      inputSchema: z.object({
        productId: z.string(),
        message: z.string().default(""),
        authorization: z
          .string()
          .optional()
          .describe("Bearer token for the shopper agent"),
        negotiationId: z
          .string()
          .optional()
          .describe("Continue this negotiation (from deal.negotiationId)"),
        counterOffer: z.number().optional().describe("Price in GBP the shopper proposes"),
        offerTerms: z
          .array(z.enum(["final_sale", "store_credit", "standard_shipping", "fit_review", "collect_london"]))
          .optional()
          .describe("Commitments the shopper will make"),
        includePerk: z.boolean().optional().describe("Negotiate the Pair & Perk bundle"),
        acceptOfferId: z.string().optional().describe("Accept one of negotiation.offers[].offerId"),
      }),
    },
    async ({ productId, message, authorization, negotiationId, counterOffer, offerTerms, includePerk, acceptOfferId }) => {
      const ctx = await resolveShopperContext({
        authorization: authorization
          ? `Bearer ${authorization.replace(/^Bearer\s+/i, "")}`
          : null,
      });
      const structured = {
        ...(counterOffer != null ? { counterOffer } : {}),
        ...(offerTerms?.length ? { offerTerms } : {}),
        ...(includePerk != null ? { includePerk } : {}),
        ...(acceptOfferId ? { acceptOfferId } : {}),
      };
      try {
        const result = await compatStateless({
          productId,
          message,
          negotiationId: negotiationId ?? null,
          shopper: ctx.shopper ?? null,
          structured: Object.keys(structured).length ? structured : undefined,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: err instanceof Error ? err.message : "Negotiation failed" }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "place_order",
    {
      title: "Place order",
      description: "Place an order from a negotiated or full-price deal.",
      inputSchema: z.object({
        primaryId: z.string(),
        perkId: z.string().optional(),
        negotiatedPrice: z.number().optional(),
        listPrice: z.number().optional(),
        negotiationSummary: z.string().optional(),
        authorization: z.string().optional(),
        negotiationId: z
          .string()
          .optional()
          .describe("Buy the deal from this negotiation (from deal.negotiationId); price comes from the agreed deal"),
      }),
    },
    async (input) => {
      const ctx = await resolveShopperContext({
        authorization: input.authorization
          ? `Bearer ${input.authorization.replace(/^Bearer\s+/i, "")}`
          : null,
      });
      const shopper = ctx.shopper ?? RETURNING_SHOPPER;
      if (input.negotiationId) {
        try {
          const { order } = await compatPurchase({
            negotiationId: input.negotiationId,
            buyerName: shopper.name,
            buyerEmail: shopper.email,
            shippingCity: shopper.city,
            note: "Ordered via MCP connector",
          });
          return { content: [{ type: "text", text: JSON.stringify({ order }, null, 2) }] };
        } catch (err) {
          return {
            content: [{ type: "text", text: err instanceof Error ? err.message : "Order failed" }],
            isError: true,
          };
        }
      }
      const order = await servicePlaceOrder({
        primaryId: input.primaryId,
        perkId: input.perkId,
        buyerName: shopper.name,
        buyerEmail: shopper.email,
        shippingCity: shopper.city,
        negotiatedPrice: input.negotiatedPrice,
        listPrice: input.listPrice,
        negotiationSummary: input.negotiationSummary,
        negotiated: true,
        shopperId: shopper.id,
        channel: "agent",
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ order }, null, 2) }],
      };
    }
  );

  server.registerTool(
    "get_order",
    {
      title: "Get order",
      description: "Fetch an order by id.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const order = await serviceGetOrder(id);
      if (!order) {
        return {
          content: [{ type: "text", text: "Order not found" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ order }, null, 2) }],
      };
    }
  );
});

export { handler as GET, handler as POST, handler as DELETE };
