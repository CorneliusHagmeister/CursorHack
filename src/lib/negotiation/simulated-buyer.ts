import { listProducts } from "@/lib/products";
import { purchaseDeal, sendMessage, startNegotiation } from "./service";

const TURN_DELAY_MS = 3500;
const BUYERS = [
  { name: "Priya", city: "London" },
  { name: "Tom", city: "Manchester" },
  { name: "Aisha", city: "Bristol" },
  { name: "Jonas", city: "Leeds" },
];

const pause = () => new Promise((r) => setTimeout(r, TURN_DELAY_MS));
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

type Started = {
  negotiationId: string;
  productId: string;
  listPrice: number;
  buyerName: string;
  city: string;
};

/** Open a negotiation as a shopper's AI agent would (hero pairs by default) */
export async function startSimulatedBuyer(productId?: string): Promise<Started> {
  const product =
    listProducts().find((p) => p.id === productId) ??
    pick(listProducts().filter((p) => !p.perkEligible));
  const buyer = pick(BUYERS);
  const buyerName = `${buyer.name} (ChatGPT agent)`;
  const opened = await startNegotiation({ productId: product.id, buyerName });
  return {
    negotiationId: opened.negotiationId,
    productId: product.id,
    listPrice: product.price,
    buyerName,
    city: buyer.city,
  };
}

/**
 * The rest of the scripted haggle: ask for a discount, counter at ~85% of
 * list, then take whatever terms the merchant asks for (or offer some if it
 * holds), accept, and buy.
 */
export async function runSimulatedBuyer(s: Started): Promise<void> {
  try {
    await pause();
    await sendMessage(s.negotiationId, {
      message: "Hi! My user loves these. Is there any wiggle room on the price?",
    });

    await pause();
    const target = Math.round(s.listPrice * 0.85);
    let res = await sendMessage(s.negotiationId, {
      message: `Would you take £${target}?`,
      counterOffer: target,
    });

    if (res.status === "open" && res.decision === "hold") {
      await pause();
      res = await sendMessage(s.negotiationId, {
        message: "Understood. We can do final sale and standard shipping — what would that come to?",
        offerTerms: ["final_sale", "standard_shipping"],
      });
    }

    if (res.status === "open") {
      const offer = res.offers.find((o) => o.terms.length > 0) ?? res.offers[0];
      await pause();
      res = await sendMessage(s.negotiationId, {
        message: offer.terms.length
          ? "That works for us — we'll take it on those terms."
          : "Alright, we'll take it.",
        acceptOfferId: offer.offerId,
      });
    }

    if (res.status === "agreed" && res.agreedDeal) {
      await pause();
      await purchaseDeal(s.negotiationId, {
        price: res.agreedDeal.price,
        buyerName: s.buyerName.replace(/ \(.*\)$/, ""),
        buyerEmail: "simulated.buyer@example.com",
        shippingCity: s.city,
        note: "Simulated agent buyer",
      });
    }
  } catch (err) {
    console.error("simulated buyer stopped", err);
  }
}
