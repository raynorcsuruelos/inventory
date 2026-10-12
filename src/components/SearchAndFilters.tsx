import React from 'react';
import { Search, X, Filter, AlertTriangle, CheckCircle2, XCircle, Layers } from 'lucide-react';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  statusFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  onStatusFilterChange: (status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') => void;
  categories: string[];
  totalCount: number;
  filteredCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyCount: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  categories,
  totalCount,
  filteredCount,
  lowStockCount,
  outOfStockCount,
  healthyCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Metric Telemetry Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Catalog</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">SKUs</span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <span>Healthy Stock</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {healthyCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Nominal</span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
            <span>Low Stock</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {lowStockCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Near threshold</span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <span>Critical / Out</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
              {outOfStockCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">0 units</span>
          </div>
        </div>
      </div>

      {/* Main Search Bar & Quick Filters */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search part number (e.g. WL-1001), description, shelf location..."
              className="w-full pl-10 pr-9 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Status Segmented Control */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 shrink-0 overflow-x-auto">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => onStatusFilterChange('low_stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'low_stock'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => onStatusFilterChange('out_of_stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'out_of_stock'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            onClick={() => onCategoryChange('all')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="ml-auto text-[11px] text-slate-400 shrink-0 pl-2">
            Showing <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{filteredCount}</span> of {totalCount}
          </div>
        </div>
      </div>
    </div>
  );
};
