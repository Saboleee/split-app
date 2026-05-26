import type { Metadata } from "next";
import "./globals.css";
import NetworkStatus from "@/components/NetworkStatus";

export const metadata: Metadata = {
  title: "StellarSplit — On-chain Invoice Splitting",
  description:
    "Create on-chain invoices on Stellar where multiple payers each owe a share. USDC auto-routes to recipients when fully funded.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased flex flex-col">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-800 px-4 py-2 flex justify-end">
          <NetworkStatus />
        </footer>
      </body>
    </html>
  );
}
