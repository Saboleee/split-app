"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { splitClient } from "@/lib/stellar";
import { getFreighterPublicKey } from "@/lib/freighter";
import { deadlineFromDays, parseAmount } from "@stellar-split/sdk";
import RecipientForm from "@/components/RecipientForm";

interface RecipientRow {
  address: string;
  amount: string; // human-readable USDC
}

/**
 * New Invoice page — form to create an on-chain StellarSplit invoice.
 */
export default function NewInvoicePage() {
  const router = useRouter();
  const [recipients, setRecipients] = useState<RecipientRow[]>([
    { address: "", amount: "" },
  ]);
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [token, setToken] = useState(
    process.env.NEXT_PUBLIC_USDC_ADDRESS ?? ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const creator = await getFreighterPublicKey();

      const { invoiceId } = await splitClient.createInvoice({
        creator,
        recipients: recipients.map((r) => ({
          address: r.address,
          amount: parseAmount(r.amount),
        })),
        token,
        deadline: deadlineFromDays(deadlineDays),
      });

      router.push(`/invoice/${invoiceId}`);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Create Invoice</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recipients &amp; Amounts (USDC)
          </label>
          <RecipientForm recipients={recipients} onChange={setRecipients} />
        </div>

        {/* Token address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            USDC Token Contract Address
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="C..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Deadline (days from now)
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={deadlineDays}
            onChange={(e) => setDeadlineDays(Number(e.target.value))}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create Invoice"}
        </button>
      </form>
    </main>
  );
}
