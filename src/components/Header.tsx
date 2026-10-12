import React from 'react';
import { 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Lock, 
  Bell, 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  HelpCircle,
  Database
} from 'lucide-react';
import { Collaborator } from '../types';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onTriggerSync: () => void;
  isSyncing: boolean;
  lowStockCount: number;
  collaborators: Collaborator[];
  onOpenAdmin: () => void;
  onOpenAlerts: () => void;
  onOpenHistory: () => void;
  onOpenCollab: () => void;
  onOpenSharePoint: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleTheme,
  isOnline,
  pendingSyncCount,
  onTriggerSync,
  isSyncing,
  lowStockCount,
  collaborators,
  onOpenAdmin,
  onOpenAlerts,
  onOpenHistory,
  onOpenCollab,
  onOpenSharePoint,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark & Laboratory Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-600 text-white font-bold shadow-sm shadow-sky-600/20">
              <span className="tracking-tighter font-mono text-sm">WL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  WL Lab Inventory
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Wireline Laboratory · Parts &amp; Consumables Management
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation & Status Indicators */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Network & Offline Sync Status */}
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                !isOnline 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                  : pendingSyncCount > 0 
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {!isOnline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Offline Mode</span>
                  {pendingSyncCount > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20">
                      {pendingSyncCount} queued
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 shrink-0" />
                  <span>{pendingSyncCount > 0 ? `${pendingSyncCount} changes to sync` : 'Online &amp; Synced'}</span>
                  {pendingSyncCount > 0 && (
                    <button
                      onClick={onTriggerSync}
                      disabled={isSyncing}
                      className="ml-1 p-0.5 hover:text-sky-400 transition-colors"
                      title="Sync Now"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Real-time Collaboration Strip */}
            <button
              onClick={onOpenCollab}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 transition-colors"
              title="View Active Team Collaborators"
            >
              <div className="flex -space-x-1.5 overflow-hidden">
                {collaborators.slice(0, 3).map((collab) => (
                  <div
                    key={collab.id}
                    className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                    style={{ backgroundColor: collab.color }}
                    title={`${collab.name} (${collab.role})`}
                  >
                    {collab.name.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="font-mono tabular-nums">{collaborators.length}</span>
              <span className="text-slate-500">Live</span>
            </button>

            {/* SharePoint Modern Integration */}
            <button
              onClick={onOpenSharePoint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 transition-colors"
              title="SharePoint Document Library & Embed Settings"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>SharePoint</span>
            </button>

            {/* Inventory History & Trends */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-800 transition-colors"
              title="Usage Trends & Audit Log"
            >
              <BarChart3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>Trends</span>
            </button>
          </div>

          {/* Zone 3: Actions (Alerts, Theme, Admin, Help) */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Low-Stock Alerts Bell */}
            <button
              onClick={onOpenAlerts}
              className={`relative p-2 rounded-lg border text-slate-700 dark:text-slate-300 transition-colors ${
                lowStockCount > 0
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'
              }`}
              title={`${lowStockCount} Low-stock items need attention`}
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-mono font-bold text-white ring-2 ring-white dark:ring-slate-950">
                  {lowStockCount}
                </span>
              )}
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Dark/Light Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Help Dialog */}
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
              title="Help & Contact"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Admin Console Access */}
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 dark:border-slate-700 shadow-sm transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Admin</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
