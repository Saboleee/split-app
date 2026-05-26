"use client";

import { useEffect, useRef, useState } from "react";
import { searchEntries, addEntry, type AddressEntry } from "@/lib/addressBook";

interface RecipientRow {
  address: string;
  amount: string;
}

interface Props {
  recipients: RecipientRow[];
  onChange: (rows: RecipientRow[]) => void;
}

/**
 * RecipientForm — dynamic add/remove rows for recipients and split amounts.
 * Address input auto-suggests saved addresses from the address book.
 */
export default function RecipientForm({ recipients, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<AddressEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const update = (index: number, field: keyof RecipientRow, value: string) => {
    const next = recipients.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    onChange(next);
  };

  const addRow = () => onChange([...recipients, { address: "", amount: "" }]);

  const removeRow = (index: number) =>
    onChange(recipients.filter((_, i) => i !== index));

  const handleAddressChange = (index: number, value: string) => {
    update(index, "address", value);
    setActiveIndex(index);
    if (value.trim().length >= 2) {
      setSuggestions(searchEntries(value.trim()));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (index: number, entry: AddressEntry) => {
    update(index, "address", entry.address);
    setSuggestions([]);
    setActiveIndex(null);
  };

  const handleAddressBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setSuggestions([]);
      setActiveIndex(null);
    }, 150);
  };

  // Save address to book when a valid G... address is entered
  const handleAddressSave = (address: string) => {
    if (address.startsWith("G") && address.length >= 56) {
      addEntry({ nickname: address.slice(0, 8) + "…", address });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {recipients.map((row, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="G... address"
              value={row.address}
              onChange={(e) => handleAddressChange(i, e.target.value)}
              onBlur={(e) => {
                handleAddressBlur();
                handleAddressSave(e.target.value);
              }}
              required
              aria-label={`Recipient ${i + 1} address`}
              aria-autocomplete="list"
              aria-expanded={activeIndex === i && suggestions.length > 0}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            {activeIndex === i && suggestions.length > 0 && (
              <ul
                ref={dropdownRef}
                role="listbox"
                className="absolute z-20 left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {suggestions.map((entry) => (
                  <li key={entry.address} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={() => selectSuggestion(i, entry)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-sm text-gray-200 font-semibold">
                        {entry.nickname}
                      </span>
                      <span className="block text-xs text-gray-400 font-mono truncate">
                        {entry.address}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="number"
            placeholder="USDC"
            step="0.0000001"
            min="0.0000001"
            value={row.amount}
            onChange={(e) => update(i, "amount", e.target.value)}
            required
            aria-label={`Recipient ${i + 1} amount`}
            className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {recipients.length > 1 && (
            <button
              type="button"
              onClick={() => removeRow(i)}
              aria-label={`Remove recipient ${i + 1}`}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-red-700 text-sm transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="self-start px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
      >
        + Add Recipient
      </button>
    </div>
  );
}
