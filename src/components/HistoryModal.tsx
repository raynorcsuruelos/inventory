import React, { useState } from 'react';
import { X, BarChart3, Clock, Download, Trash2, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { HistoryEntry } from '../types';
import { triggerFileDownload } from '../utils/sharepoint';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [filterText, setFilterText] = useState('');

  if (!isOpen) return null;

  // Calculate usage trends (top withdrawn items)
  const withdrawalTotals: Record<string, { desc: string; total: number }> = {};
  history.forEach(entry => {
    const isWithdrawal = entry.action.toLowerCase().includes('withdraw') || 
      (entry.action.toLowerCase().includes('sub') && !entry.action.toLowerCase().includes('add'));
    
    if (isWithdrawal && entry.partNumber) {
      if (!withdrawalTotals[entry.partNumber]) {
        withdrawalTotals[entry.partNumber] = { desc: entry.description, total: 0 };
      }
      const qty = typeof entry.qty === 'number' ? entry.qty : parseInt(String(entry.qty), 10) || 0;
      withdrawalTotals[entry.partNumber].total += qty;
    }
  });

  const sortedTrends = Object.entries(withdrawalTotals)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  const maxWithdrawal = sortedTrends.length > 0 ? Math.max(...sortedTrends.map(t => t[1].total), 1) : 1;

  const filteredHistory = history.filter(h => 
    h.partNumber.toLowerCase().includes(filterText.toLowerCase()) ||
    h.description.toLowerCase().includes(filterText.toLowerCase()) ||
    h.action.toLowerCase().includes(filterText.toLowerCase()) ||
    (h.note && h.note.toLowerCase().includes(filterText.toLowerCase()))
  );

  const handleExportHistoryCSV = () => {
    if (history.length === 0) return alert('No history entries to export.');
    const header = 'Timestamp,Action,PartNumber,Description,Quantity,TechnicianUser,RemarksNote';
    const rows = history.map(h => {
      const clean = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
      return [
        clean(h.ts),
        clean(h.action),
        clean(h.partNumber),
        clean(h.description),
        clean(h.qty),
        clean(h.user || 'Technician'),
        clean(h.note || ''),
      ].join(',');
    });
    const csv = [header, ...rows].join('\r\n');
    triggerFileDownload(csv, `WL_Lab_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-600/10 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Inventory History &amp; Usage Trends</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wireline Consumable Depletion Analytics &amp; Complete Audit Trail
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Withdrawn Items / Usage Trends */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Usage Velocity (Top Consumed Parts)
            </h3>
            
            {sortedTrends.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No consumption records logged yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedTrends.map(([pn, data]) => {
                  const percentage = Math.round((data.total / maxWithdrawal) * 100);
                  return (
                    <div 
                      key={pn}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{pn}</span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{data.total} units dispatched</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={data.desc}>
                        {data.desc}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Audit Trail Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Transaction Audit Trail ({filteredHistory.length})
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter audit log..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-48"
                />
                <button
                  onClick={handleExportHistoryCSV}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No matching audit records found.</div>
              ) : (
                filteredHistory.map((item) => {
                  const isNegative = item.action.toLowerCase().includes('withdraw') || item.action.toLowerCase().includes('sub');
                  return (
                    <div key={item.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{item.partNumber || 'Catalog'}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.description}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-600 dark:text-slate-400">{item.action}</span>
                          {item.qty !== '' && (
                            <span className="font-mono font-semibold ml-1">
                              ({isNegative ? '-' : '+'}{item.qty})
                            </span>
                          )}
                          {item.note && <span className="ml-1 italic text-slate-400">— {item.note}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-[11px] text-slate-400 font-mono">
                        <div>{new Date(item.ts).toLocaleDateString()}</div>
                        <div>{new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (confirm('Clear all audit logs? This cannot be undone.')) {
                onClearHistory();
              }
            }}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
