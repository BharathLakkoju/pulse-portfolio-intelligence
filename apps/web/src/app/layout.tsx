import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse: Your Portfolio Intelligence",
  description: "Know the pulse of your money: what you own, how it performs, where the risk is, and what deserves attention.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport = { themeColor: "#0b0f14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-pulse-bg font-sans text-pulse-text antialiased">{children}</body>
    </html>
  );
}
