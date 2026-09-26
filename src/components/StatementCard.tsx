"use client";

import { useEffect, useState } from "react";
import type { BankStatement } from "@/lib/demo-bank";
import { gbp } from "@/lib/format";

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(iso));

type StatementCardProps = {
  budgetMax?: number;
};

export const StatementCard = ({ budgetMax }: StatementCardProps) => {
  const [statement, setStatement] = useState<BankStatement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "none">("loading");

  useEffect(() => {
    fetch("/api/demo/bank-statement")
      .then(async (res) => {
        if (!res.ok) {
          setStatus("none");
          return;
        }
        setStatement((await res.json()) as BankStatement);
        setStatus("ready");
      })
      .catch(() => setStatus("none"));
  }, []);

  if (status !== "ready" || !statement) return null;

  const denimSpends = statement.transactions.filter((tx) => tx.category === "denim");

  return (
    <section aria-labelledby="statement-heading" className="mt-10">
      <h2 id="statement-heading" className="text-base font-semibold text-stone-900">
        Denim on your card ending {statement.cardLast4}
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        {gbp(statement.denim.totalGbp)} across {statement.denim.count} buys in 90 days. The
        most you paid for one was {gbp(statement.denim.largestGbp)}
        {budgetMax ? `, so your agent keeps offers under ${gbp(budgetMax)}.` : "."}
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {denimSpends.map((tx) => (
          <li key={tx.id} className="flex items-baseline justify-between gap-4">
            <span className="text-stone-800">
              <span className="inline-block w-14 text-stone-500 tabular-nums">
                {shortDate(tx.date)}
              </span>
              {tx.merchant}
            </span>
            <span className="tabular-nums text-stone-900">{gbp(tx.amountGbp)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-500">Demo data from a pretend linked card.</p>
    </section>
  );
};
