import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Haggleberry · pitch",
  description: "A shop where everything takes an offer. Finn haggles for the store.",
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
        <h1 className="font-slab text-5xl font-bold text-ink sm:text-7xl">Haggleberry</h1>
        <p className="mt-5 max-w-2xl text-base text-ink sm:text-lg">
          A shop where everything takes an offer. Finn works for the store. Your agent works for
          you. A cheaper price costs you something, often final sale or slower shipping, and both of
          you can read the same deal.
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
          <h2 className="font-display text-2xl text-ink">The demo</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open the shop logged out.</li>
            <li>On /login, continue as demo shopper. That is Sam.</li>
            <li>Start an offer. Finn comes back with a deal, say £42 if you take final sale.</li>
            <li>Apply it and confirm checkout.</li>
            <li>Open /merchant/live. Same thread.</li>
            <li>Stay here so people can scan the QRs.</li>
          </ol>
          <p className="text-muted">
            Writeup is{" "}
            <a
              href={`${REPO}/blob/feature/pitch/docs/hackathon/writeup.md`}
              className="underline decoration-hairline underline-offset-4 hover:text-berry"
            >
              docs/hackathon/writeup.md
            </a>
            . Sign in on /login. Do not read the password out loud.
          </p>
        </section>
      </div>
    </div>
  );
}
