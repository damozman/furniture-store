import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

/*
 * Fraunces carries the display voice: a soft serif with enough warmth and
 * character to sit beside leather and hardwood, where a cold high-contrast
 * Didone would read as fashion rather than craft. Inter handles UI, where
 * legibility at small sizes matters more than personality.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves the relative OG image paths the file conventions generate.
  metadataBase: new URL(site.url),
  title: {
    default: "Saddle & Hide — Handcrafted leather furniture",
    template: "%s — Saddle & Hide",
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
