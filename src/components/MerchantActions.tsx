"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@/lib/types";

const FLOW: Order["status"][] = ["confirmed", "packed", "shipped"];

export function MerchantActions({
  orderId,
  status,
}: {
  orderId: string;
  status: Order["status"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const idx = FLOW.indexOf(status);
  const next = FLOW[idx + 1];

  if (!next) {
    return (
      <p className="mt-3 text-xs font-medium text-emerald-700">Shipped ✓</p>
    );
  }

  async function advance() {
    setBusy(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void advance()}
      className="mt-3 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
    >
      Mark {next}
    </button>
  );
}
