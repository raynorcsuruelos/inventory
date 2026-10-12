import React from 'react';
import { 
  X, 
  HelpCircle, 
  Mail, 
  ExternalLink, 
  ShieldCheck, 
  WifiOff, 
  FileSpreadsheet, 
  Lock 
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-600/10 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Wireline Laboratory Support &amp; Docs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                WL Lab Inventory · SLB Wireline
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Contact Card */}
          <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 text-center space-y-2">
            <div className="inline-flex p-2.5 rounded-xl bg-sky-600 text-white shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Technical Support &amp; Upgrades
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              For system help, feature requests, catalog expansion, or SAP integration queries, contact:
            </p>
            <a
              href="mailto:rsuruelos@slb.com"
              className="inline-block text-base font-mono font-bold text-sky-600 dark:text-sky-400 hover:underline pt-1"
            >
              rsuruelos@slb.com
            </a>
            <div className="text-[11px] text-slate-400">
              SLB Wireline Laboratory Systems
            </div>
          </div>

          {/* Quick Links & BlueMM */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">SLB BlueMM Material Master</div>
              <div className="text-[11px] text-slate-500">Access corporate SLB parts catalog &amp; global inventory</div>
            </div>
            <a
              href="https://www.bluemm.slb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Open BlueMM</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* System Feature Notes */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Architecture &amp; Security Highlights
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Robust Salted PBKDF2</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Master password is protected with 32-byte non-deterministic cryptographic salt and 100,000 rounds of HMAC-SHA256.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline First &amp; Auto-Sync</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Operates reliably downhole or in offshore environments without network connection. Queued actions automatically sync when online.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>SharePoint Ready</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Includes embed code for SharePoint Modern Pages Web Parts and one-click SharePoint Document Library CSV export.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-sky-600 dark:text-sky-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Multi-User Collaboration</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Real-time cross-tab state broadcast with live engineer presence and technical notes threading.
                </p>
              </div>
            </div>
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
