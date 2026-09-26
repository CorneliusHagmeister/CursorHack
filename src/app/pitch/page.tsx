import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Haggleberry · pitch",
  description:
    "Agentic commerce for second-hand denim: negotiate packages of terms, not bare discounts.",
};

const LIVE = "https://indigo-lane.vercel.app/";
const REPO = "https://github.com/CorneliusHagmeister/CursorHack";
const CLOSING =
  "Terms beyond a basic return should be a package you can negotiate, because both sides can see the risk.";

const qrs = [
  { src: "/pitch/demo.png", caption: LIVE, alt: "QR code for the live demo" },
  { src: "/pitch/mangle.png", caption: "Mangle Kuo", alt: "QR code for Mangle Kuo" },
  {
    src: "/pitch/cornelius.png",
    caption: "Cornelius Hagmeister",
    alt: "QR code for Cornelius Hagmeister",
  },
  { src: "/pitch/repo.png", caption: REPO, alt: "QR code for the GitHub repository" },
  { src: "/pitch/agents.png", caption: `${LIVE}api/md`, alt: "QR code for the agent markdown API" },
] as const;

export default function PitchPage() {
  return (
    <div className="px-3 pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl px-1">
        <h1 className="font-display text-5xl text-ink sm:text-7xl">Haggleberry</h1>
        <p className="mt-5 max-w-2xl text-base text-ink sm:text-lg">
          Second-hand denim where shopper and merchant agents negotiate packages of terms — returns,
          risk, shipping, final sale — not just a discount, so both sides can verify risk and land a
          fairer deal.
        </p>

        <dl className="mt-8 space-y-3 text-sm text-ink">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <dt className="text-muted">Live</dt>
            <dd>
              <a className="underline decoration-hairline underline-offset-4 hover:text-berry" href={LIVE}>
                {LIVE}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <dt className="text-muted">Repo</dt>
            <dd>
              <a className="underline decoration-hairline underline-offset-4 hover:text-berry" href={REPO}>
                {REPO}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <dt className="text-muted">Track</dt>
            <dd>Agentic Commerce</dd>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <dt className="text-muted">Team</dt>
            <dd>Mangle Kuo · Cornelius Hagmeister</dd>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <dt className="text-muted">Agents</dt>
            <dd className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/api/md" className="underline decoration-hairline underline-offset-4 hover:text-berry">
                /api/md
              </Link>
              <a
                href={`${LIVE}llms.txt`}
                className="underline decoration-hairline underline-offset-4 hover:text-berry"
              >
                /llms.txt
              </a>
              <Link
                href="/openapi.json"
                className="underline decoration-hairline underline-offset-4 hover:text-berry"
              >
                OpenAPI
              </Link>
              <Link href="/mcp" className="underline decoration-hairline underline-offset-4 hover:text-berry">
                MCP
              </Link>
            </dd>
          </div>
        </dl>

        <p className="mt-10 max-w-2xl text-sm text-ink">{CLOSING}</p>

        <div className="mt-12 grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {qrs.map((qr) => (
            <figure key={qr.src} className="flex flex-col items-center gap-3">
              <Image
                src={qr.src}
                alt={qr.alt}
                width={180}
                height={180}
                className="rounded-tile bg-white p-2"
                unoptimized
              />
              <figcaption className="max-w-[12rem] break-all text-center text-xs text-muted">
                {qr.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        <section className="mt-14 max-w-2xl space-y-3 text-sm text-ink">
          <h2 className="font-display text-2xl text-ink">Stage path</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open the shop logged out.</li>
            <li>Continue as demo shopper (Sam) on /login.</li>
            <li>Make an offer — Finn answers with a deal package, not a bare discount.</li>
            <li>Apply and confirm checkout.</li>
            <li>Flip to /merchant/live for the same session.</li>
            <li>Hold this /pitch screen for the QRs.</li>
          </ol>
          <p className="text-muted">
            Full writeup:{" "}
            <a
              href={`${REPO}/blob/feature/pitch/docs/hackathon/writeup.md`}
              className="underline decoration-hairline underline-offset-4 hover:text-berry"
            >
              docs/hackathon/writeup.md
            </a>
            . Demo login stays on /login — do not read passwords aloud.
          </p>
        </section>
      </div>
    </div>
  );
}
