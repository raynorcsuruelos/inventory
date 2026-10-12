import React from 'react';
import { 
  Package, 
  MapPin, 
  Plus, 
  Minus, 
  MessageSquare, 
  ArrowUpRight, 
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { InventoryItem, Collaborator } from '../types';

interface InventoryTableProps {
  items: InventoryItem[];
  collaborators: Collaborator[];
  onQuickAdjust: (partNumber: string, delta: number) => void;
  onOpenItemComments: (partNumber: string) => void;
  onOpenQuickWithdraw: (item: InventoryItem) => void;
  onOpenAdminEdit: (item: InventoryItem) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  collaborators,
  onQuickAdjust,
  onOpenItemComments,
  onOpenQuickWithdraw,
  onOpenAdminEdit,
}) => {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
        <Package className="w-10 h-10 mx-auto text-slate-400 mb-3" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No matching inventory items</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Try adjusting your search criteria, clearing the active category, or add a new part through the Admin console.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px]">Part Number &amp; Category</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px]">Description &amp; Specifications</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px]">Location</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px] text-center">Stock Level</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px] text-center">Min Safety</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px]">Status</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px]">Remarks &amp; Collab</th>
              <th className="py-3 px-4 font-semibold tracking-wider uppercase text-[11px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
            {items.map((item) => {
              const isOut = item.quantity <= 0;
              const isLow = !isOut && item.quantity <= item.threshold;
              
              // Check if any collaborator is active on this part
              const activeCollaborator = collaborators.find(c => c.activePart === item.partNumber);

              return (
                <tr 
                  key={item.partNumber}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    isOut ? 'bg-rose-500/5' : isLow ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Part Number & Category */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.partNumber}
                      </span>
                    </div>
                    {item.category && (
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.category}
                      </div>
                    )}
                    {/* Live Collaborator Badge */}
                    {activeCollaborator && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeCollaborator.color }}></span>
                        <span>{activeCollaborator.name.split(' ')[0]} viewing</span>
                      </div>
                    )}
                  </td>

                  {/* Description & Specs */}
                  <td className="py-3 px-4 align-top max-w-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                      {item.description}
                    </div>
                    {item.lastModified && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Modified {new Date(item.lastModified).toLocaleDateString()} by {item.modifiedBy || 'Lab Tech'}
                      </div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{item.location}</span>
                    </div>
                  </td>

                  {/* Stock Quantity with Quick Stepper */}
                  <td className="py-3 px-4 align-top text-center">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                      <button
                        onClick={() => onQuickAdjust(item.partNumber, -1)}
                        disabled={item.quantity <= 0}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Subtract 1 unit"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-8 font-mono font-bold text-center tabular-nums text-sm ${
                        isOut ? 'text-rose-600 dark:text-rose-400' : isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onQuickAdjust(item.partNumber, 1)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title="Add 1 unit"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Min Safety Threshold */}
                  <td className="py-3 px-4 align-top text-center">
                    <span className="font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {item.threshold}
                    </span>
                  </td>

                  {/* Status Indicator (Accessible text + symbol, unboxed) */}
                  <td className="py-3 px-4 align-top whitespace-nowrap">
                    {isOut ? (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Out of Stock</span>
                      </div>
                    ) : isLow ? (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Low Stock</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>In Stock</span>
                      </div>
                    )}
                  </td>

                  {/* Remarks & Notes */}
                  <td className="py-3 px-4 align-top max-w-xs">
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2">
                      {item.remarks || <span className="text-slate-400 italic">No notes</span>}
                    </p>
                  </td>

                  {/* Quick Row Actions */}
                  <td className="py-3 px-4 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenItemComments(item.partNumber)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Document notes & collaboration thread"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenQuickWithdraw(item)}
                        className="px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-md transition-colors whitespace-nowrap"
                        title="Withdraw stock for rig run"
                      >
                        Withdraw
                      </button>
                      <button
                        onClick={() => onOpenAdminEdit(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit in Admin Panel"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
