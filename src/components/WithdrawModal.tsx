import React, { useState } from 'react';
import { X, ArrowUpRight, AlertTriangle, Check } from 'lucide-react';
import { InventoryItem } from '../types';

interface WithdrawModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmWithdraw: (partNumber: string, qty: number, reason: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirmWithdraw,
}) => {
  const [withdrawQty, setWithdrawQty] = useState('1');
  const [jobNote, setJobNote] = useState('');

  if (!isOpen || !item) return null;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(withdrawQty, 10);
    if (isNaN(qty) || qty <= 0) return alert('Enter a valid quantity to withdraw.');
    if (qty > item.quantity) return alert(`Cannot withdraw ${qty} units. Only ${item.quantity} available on-hand.`);

    onConfirmWithdraw(item.partNumber, qty, jobNote.trim() || 'Field job dispatch');
    onClose();
  };

  const handleMax = () => {
    setWithdrawQty(item.quantity.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-500/5 dark:bg-amber-500/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Withdraw Stock for Field Rig</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Log consumable usage or tool assembly dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleWithdraw} className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{item.partNumber}</span>
              <span className="font-mono font-bold text-xs text-sky-600 dark:text-sky-400">On Hand: {item.quantity}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">{item.description}</p>
            <p className="text-[11px] text-slate-400">📍 {item.location}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Quantity to Withdraw *
              </label>
              <button
                type="button"
                onClick={handleMax}
                className="text-[11px] font-mono text-sky-600 dark:text-sky-400 hover:underline"
              >
                Withdraw All ({item.quantity})
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={item.quantity}
              value={withdrawQty}
              onChange={(e) => setWithdrawQty(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Reference / Well / Tool String *
            </label>
            <input
              type="text"
              value={jobNote}
              onChange={(e) => setJobNote(e.target.value)}
              placeholder="e.g. Well A-14 · Tool Head 5110 Run #2"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Withdrawal</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
