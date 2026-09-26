import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { AssistChat } from "@/components/AssistChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indigo Lane — Second-hand denim · Pair & Perk",
  description:
    "Fleek London hackathon demo: UK second-hand jeans with Pair & Perk New Ways to Buy and size/condition AI assist.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f3ec] text-stone-900">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-stone-200/80 py-6 text-center text-xs text-stone-500">
          Indigo Lane · Grok Bot Commerce × Fleek London hackathon demo · freeze
          16:30 London
        </footer>
        <AssistChat />
      </body>
    </html>
  );
}
