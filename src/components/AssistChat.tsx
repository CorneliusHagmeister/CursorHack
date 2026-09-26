"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { Product } from "@/lib/types";
import { gbp, productAlt } from "@/lib/format";
import Link from "next/link";

type Msg = { role: "user" | "assistant"; content: string };

export function AssistChat() {
  const pathname = usePathname();
  const productId = useMemo(() => {
    const m = pathname?.match(/^\/product\/([^/]+)/);
    return m?.[1];
  }, [pathname]);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm the Haggleberry fit desk. Tell me a waist and a condition, like \"W32 excellent\", and I'll match the catalogue. On a product page I also suggest a free Pair & Perk add-on.\n\nRemembered shopper: Sam, W31, APC and Nudie.\n\nFor the demo, use Negotiate on the product page. Or ask \"W31 very good\", open a match, claim a perk, check out, then look at Merchant.",
    },
  ]);
  const [matches, setMatches] = useState<Product[]>([]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, productId }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply as string },
      ]);
      setMatches((data.matches as Product[]) ?? []);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-indigo-950 px-4 py-3 text-sm font-medium text-amber-50 shadow-lg shadow-indigo-950/25 hover:bg-indigo-900"
      >
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        Fit assist
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[min(560px,70vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-[#faf8f4] shadow-2xl">
          <div className="flex items-start justify-between gap-2 border-b border-stone-200 bg-white px-4 py-3">
            <div>
              <p className="font-semibold text-indigo-950">Size &amp; condition assist</p>
              <p className="text-xs text-stone-500">
                Wired to /api/assist · rule-based demo (no API keys)
                {productId ? ` · context: ${productId}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-stone-500 hover:bg-stone-100"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                  m.role === "user"
                    ? "ml-8 bg-indigo-950 text-amber-50"
                    : "mr-4 bg-white text-stone-800 shadow-sm"
                }`}
              >
                {m.content.replace(/\*\*(.+?)\*\*/g, "$1")}
              </div>
            ))}
            {matches.length > 0 && (
              <div className="space-y-2 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 p-2">
                <p className="text-sm font-medium text-indigo-950">Quick links</p>
                {matches.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs hover:bg-indigo-50"
                    onClick={() => setOpen(false)}
                  >
                    <Image
                      src={p.image}
                      alt={productAlt(p)}
                      width={32}
                      height={40}
                      className="h-10 w-8 rounded object-cover"
                    />
                    <span>
                      <span className="font-medium text-indigo-950">
                        {p.brand} {p.name}
                      </span>{" "}
                      <span className="text-stone-500">
                        W{p.waist} · {gbp(p.price)}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-stone-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["W32 excellent", "W30 good", "what pairs with this?"].map(
                (q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-stone-200 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-stone-50"
                  >
                    {q}
                  </button>
                )
              )}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Waist, condition, style…"
                className="flex-1 rounded-xl border border-stone-200 bg-[#faf8f4] px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-indigo-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
