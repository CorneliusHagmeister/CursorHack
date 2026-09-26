import type { Metadata } from "next";
import { Geist, Geist_Mono, Zilla_Slab } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const zillaSlab = Zilla_Slab({
  variable: "--font-zilla",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Haggleberry · clothes, open to offers",
  description:
    "A clothes shop where everything takes offers. Haggle yourself or send your AI assistant, and get a deal back instead of a flat no.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} ${zillaSlab.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#faf9f7] text-stone-900">
        <Suspense fallback={<div className="h-14 border-b border-stone-200 bg-white" />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500">
          Haggleberry · clothes, open to offers
        </footer>
      </body>
    </html>
  );
}
