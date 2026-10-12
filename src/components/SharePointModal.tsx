import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  RefreshCw, 
  Check, 
  Copy, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { InventoryItem, SharePointConfig } from '../types';
import { 
  exportToSharePointCSV, 
  triggerFileDownload, 
  generateSharePointEmbedCode, 
  syncWithSharePoint 
} from '../utils/sharepoint';

interface SharePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  config: SharePointConfig;
  onUpdateConfig: (cfg: SharePointConfig) => void;
}

export const SharePointModal: React.FC<SharePointModalProps> = ({
  isOpen,
  onClose,
  inventory,
  config,
  onUpdateConfig,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncWithSharePoint(inventory, config);
      onUpdateConfig({
        ...config,
        lastSyncTime: res.timestamp,
        status: 'synced',
      });
      setSyncResult({ success: true, msg: res.message });
    } catch (err: any) {
      setSyncResult({ success: false, msg: err.message || 'SharePoint synchronization failed' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCSV = () => {
    const csv = exportToSharePointCSV(inventory);
    triggerFileDownload(csv, `SharePoint_List_WL_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleCopyEmbed = () => {
    const code = generateSharePointEmbedCode(window.location.href);
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-500/5 dark:bg-emerald-500/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                Microsoft SharePoint Document Collaboration
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shared Document Library Sync &amp; Modern Pages Embed
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
        <div className="p-6 space-y-5 text-xs">
          
          {/* Target SharePoint Library Info */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Active Document Destination</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
              <div className="truncate"><strong>Site:</strong> {config.siteUrl}</div>
              <div><strong>Library:</strong> {config.libraryName}</div>
              <div><strong>Target File:</strong> {config.fileName}</div>
              {config.lastSyncTime && (
                <div className="text-slate-400">
                  Last Synced: {new Date(config.lastSyncTime).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Sync Trigger */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Synchronize Document Library
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing...' : 'Sync Now with SharePoint'}</span>
              </button>
            </div>

            {syncResult && (
              <div className={`p-2.5 rounded-lg flex items-center gap-2 ${
                syncResult.success 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              }`}>
                {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{syncResult.msg}</span>
              </div>
            )}
          </div>

          {/* Download SharePoint List CSV */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Export SharePoint List CSV</div>
              <div className="text-[11px] text-slate-500">Formatted with Title, SafetyStock, and Location schemas</div>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Embed in SharePoint Modern Pages */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                SharePoint Embed Web Part Code
              </span>
              <button
                onClick={handleCopyEmbed}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>
            <pre className="p-2 rounded bg-slate-900 text-sky-300 font-mono text-[10px] overflow-x-auto select-all">
              {generateSharePointEmbedCode(window.location.href)}
            </pre>
            <p className="text-[10px] text-slate-500">
              Add the <strong>Embed Web Part</strong> to your modern team site page and paste this code.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end shrink-0">
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
