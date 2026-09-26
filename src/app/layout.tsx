import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/Header";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indigo Lane · second-hand denim",
  description:
    "Buy second-hand jeans from UK sellers. Make an offer, unlock a free bundle pair, or shop through your own agent.",
};

const FOOTER_LINKS = [
  { href: "/", label: "Shop" },
  { href: "/account", label: "Account" },
  { href: "/merchant", label: "Sell" },
  { href: "/api/md", label: "For agents" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-floor text-ink">
        <Suspense fallback={<div className="mx-3 mt-3 h-14 rounded-tile bg-white" />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="m-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-tile bg-white px-4 py-3">
          <span className="text-caps">Indigo Lane · second-hand denim</span>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-caps text-muted hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </body>
    </html>
  );
}
