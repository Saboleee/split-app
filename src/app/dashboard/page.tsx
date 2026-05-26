"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { splitClient } from "@/lib/stellar";
import { getFreighterPublicKey } from "@/lib/freighter";
import { formatAmount } from "@stellar-split/sdk";
import InvoiceCard from "@/components/InvoiceCard";
import type { Invoice } from "@stellar-split/sdk";

function exportCSV(invoices: Invoice[], from: string, to: string) {
  const fromTs = from ? new Date(from).getTime() / 1000 : 0;
  const toTs = to ? new Date(to).getTime() / 1000 : Infinity;
  const rows = invoices.filter((inv) => inv.deadline >= fromTs && inv.deadline <= toTs);
  const header = "ID,Status,Total (USDC),Funded (USDC),Deadline,Recipient Count";
  const lines = rows.map((inv) => {
    const total = inv.recipients.reduce((s, r) => s + r.amount, 0n);
    const deadline = new Date(inv.deadline * 1000).toISOString().slice(0, 10);
    return [inv.id, inv.status, formatAmount(total), formatAmount(inv.funded), deadline, inv.recipients.length].join(",");
  });
  const csv = [header, ...lines].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "invoices.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Dashboard — lists invoices where the connected wallet is creator or recipient.
 */
export default function DashboardPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  useEffect(() => {
    getFreighterPublicKey()
      .then(setPublicKey)
      .catch(() => setError("Connect your Freighter wallet to view your dashboard."));
  }, []);

  useEffect(() => {
    if (!publicKey) return;

    // Fetch invoices 1–50 and filter by creator or recipient.
    // In production this would use an indexer; here we scan a range.
    const fetchInvoices = async () => {
      setLoading(true);
      const results: Invoice[] = [];
      for (let id = 1; id <= 50; id++) {
        try {
          const inv = await splitClient.getInvoice(String(id));
          const isCreator = inv.creator === publicKey;
          const isRecipient = inv.recipients.some((r) => r.address === publicKey);
          if (isCreator || isRecipient) results.push(inv);
        } catch {
          // Invoice doesn't exist — stop scanning.
          break;
        }
      }
      setInvoices(results);
      setLoading(false);
    };

    fetchInvoices().catch((e) => {
      setError(String(e));
      setLoading(false);
    });
  }, [publicKey]);

  if (error) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={exportFrom}
            onChange={(e) => setExportFrom(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
            aria-label="Export from date"
          />
          <span className="text-gray-500 text-xs">–</span>
          <input
            type="date"
            value={exportTo}
            onChange={(e) => setExportTo(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
            aria-label="Export to date"
          />
          <button
            onClick={() => exportCSV(invoices, exportFrom, exportTo)}
            disabled={invoices.length === 0}
            className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-semibold transition-colors disabled:opacity-40"
          >
            Export CSV
          </button>
          <Link
            href="/invoice/new"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-400">No invoices found. Create your first one!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoice/${inv.id}`}>
              <InvoiceCard invoice={inv} />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
