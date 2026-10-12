import React from 'react';
import { X, AlertTriangle, MapPin, CheckCircle, Package } from 'lucide-react';
import { InventoryItem } from '../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lowStockItems: InventoryItem[];
  onOpenQuickWithdraw: (item: InventoryItem) => void;
  onSelectPartForAdjustment: (pn: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  lowStockItems,
  onOpenQuickWithdraw,
  onSelectPartForAdjustment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-500/5 dark:bg-amber-500/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-amber-700 dark:text-amber-400">
                Low-Stock &amp; Critical Depletion Alerts
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lowStockItems.length} items currently at or below minimum safety stock threshold
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {lowStockItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">All inventory levels are nominal!</p>
              <p className="text-xs text-slate-400">No items are currently below their configured safety stock thresholds.</p>
            </div>
          ) : (
            lowStockItems.map((item) => {
              const isOut = item.quantity <= 0;
              return (
                <div
                  key={item.partNumber}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                    isOut
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.partNumber}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isOut 
                          ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-300' 
                          : 'bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300'
                      }`}>
                        {isOut ? 'Depleted (0 Units)' : 'Low Stock'}
                      </span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.location}
                      </span>
                      <span>·</span>
                      <span>Safety Min: <strong className="font-mono text-slate-700 dark:text-slate-300">{item.threshold}</strong></span>
                    </div>

                    {item.remarks && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                        Note: {item.remarks}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block">Current Qty</span>
                      <span className={`text-base font-mono font-bold ${
                        isOut ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {item.quantity} units
                      </span>
                    </div>

                    <div className="flex gap-1.5 mt-1">
                      <button
                        onClick={() => {
                          onClose();
                          onSelectPartForAdjustment(item.partNumber);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:bg-sky-100"
                      >
                        Adjust / Restock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close Alerts
          </button>
        </div>

      </div>
    </div>
  );
};
