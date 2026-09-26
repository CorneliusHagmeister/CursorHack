import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { resolveShopperContext } from "@/lib/context";
import {
  serviceGetOrder,
  serviceGetProduct,
  serviceNegotiate,
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
      description: "Search the Indigo Lane second-hand denim catalogue.",
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
        "Start or continue a live offer on a product. Pass an empty message to open.",
      inputSchema: z.object({
        productId: z.string(),
        message: z.string().default(""),
        authorization: z
          .string()
          .optional()
          .describe("Bearer token for the shopper agent"),
      }),
    },
    async ({ productId, message, authorization }) => {
      const ctx = await resolveShopperContext({
        authorization: authorization
          ? `Bearer ${authorization.replace(/^Bearer\s+/i, "")}`
          : null,
      });
      const result = serviceNegotiate({
        productId,
        message,
        history: [],
        shopper: ctx.shopper ?? null,
        campaign: ctx.campaign ?? null,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
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
      }),
    },
    async (input) => {
      const ctx = await resolveShopperContext({
        authorization: input.authorization
          ? `Bearer ${input.authorization.replace(/^Bearer\s+/i, "")}`
          : null,
      });
      const shopper = ctx.shopper ?? RETURNING_SHOPPER;
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
