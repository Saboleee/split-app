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
  const [recurring, setRecurring] = useState(false);
  const [intervalDays, setIntervalDays] = useState<7 | 30>(7);
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
        ...(recurring && { recurring, intervalDays }),
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

        {/* Recurring */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-4 h-4 accent-indigo-500"
            />
            <span className="text-sm font-medium text-gray-300">Recurring invoice</span>
          </label>

          {recurring && (
            <div className="flex flex-col gap-2 pl-6">
              <label className="block text-sm font-medium text-gray-300">Interval</label>
              <select
                value={intervalDays}
                onChange={(e) => setIntervalDays(Number(e.target.value) as 7 | 30)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={7}>Weekly (every 7 days)</option>
                <option value={30}>Monthly (every 30 days)</option>
              </select>
              <p className="text-xs text-indigo-300">
                Next invoice:{" "}
                {new Date(
                  Date.now() + (deadlineDays + intervalDays) * 86400_000
                ).toLocaleDateString()}
              </p>
            </div>
          )}
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
