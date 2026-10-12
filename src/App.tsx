import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  InventoryItem, 
  HistoryEntry, 
  SecurityCredential, 
  Collaborator, 
  ItemComment, 
  SharePointConfig 
} from './types';
import { 
  loadInventory, 
  saveInventory, 
  loadHistory, 
  saveHistory,
  logHistory, 
  loadOfflineQueue, 
  saveOfflineQueue, 
  enqueueOfflineAction, 
  clearOfflineQueue, 
  getGlobalThreshold, 
  setGlobalThreshold, 
  loadComments, 
  saveComments, 
  broadcastCollabMessage, 
  subscribeCollabMessages, 
  INITIAL_COLLABORATORS,
  THEME_KEY
} from './utils/syncManager';
import { 
  getOrInitSecurityCredential, 
  saveSecurityCredential 
} from './utils/crypto';
import { 
  loadSharePointConfig, 
  saveSharePointConfig 
} from './utils/sharepoint';

import { Header } from './components/Header';
import { SearchAndFilters } from './components/SearchAndFilters';
import { InventoryTable } from './components/InventoryTable';
import { AdminModal } from './components/AdminModal';
import { CollaborationDrawer } from './components/CollaborationDrawer';
import { HistoryModal } from './components/HistoryModal';
import { AlertsModal } from './components/AlertsModal';
import { SharePointModal } from './components/SharePointModal';
import { WithdrawModal } from './components/WithdrawModal';
import { HelpModal } from './components/HelpModal';
import { CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';

export default function App() {
  // ── THEME STATE (Dark Mode default, toggleable) ──────────────────
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return true; // Modern dark mode default
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);

  // ── DATA STATE ──────────────────────────────────────────────────
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [comments, setComments] = useState<ItemComment[]>([]);
  const [securityCredential, setSecurityCredential] = useState<SecurityCredential | null>(null);
  const [globalThreshold, setGlobalThresholdState] = useState<number>(0);
  const [sharePointConfig, setSharePointConfig] = useState<SharePointConfig>(loadSharePointConfig);

  // ── NETWORK & OFFLINE QUEUE STATE ───────────────────────────────
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // ── REAL-TIME COLLABORATORS & SIMULATION ─────────────────────────
  const [collaborators, setCollaborators] = useState<Collaborator[]>(INITIAL_COLLABORATORS);
  const [simulateActivity, setSimulateActivity] = useState<boolean>(true);

  // ── SEARCH & FILTER STATE ───────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // ── MODAL STATES ────────────────────────────────────────────────
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCollabOpen, setIsCollabOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSharePointOpen, setIsSharePointOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [withdrawItem, setWithdrawItem] = useState<InventoryItem | null>(null);
  const [selectedPartForAdminEdit, setSelectedPartForAdminEdit] = useState<InventoryItem | null>(null);
  const [selectedPartForComment, setSelectedPartForComment] = useState<string>('');

  // ── TOAST NOTIFICATIONS ─────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warn' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3800);
  }, []);

  // ── INITIALIZATION ──────────────────────────────────────────────
  useEffect(() => {
    // 1. Load Inventory & Comments
    const loadedInv = loadInventory();
    setInventory(loadedInv);
    setHistory(loadHistory());
    setComments(loadComments());
    setGlobalThresholdState(getGlobalThreshold());
    setPendingSyncCount(loadOfflineQueue().length);

    // 2. Initialize PBKDF2 Cryptographic Security Credential
    getOrInitSecurityCredential().then(cred => {
      setSecurityCredential(cred);
    });

    // 3. Online/Offline Listeners
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connection restored. Auto-syncing pending changes...', 'success');
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('You are now in Offline Mode. All changes are securely cached locally and queued for sync.', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 4. Real-Time BroadcastChannel Subscription
    const unsubscribeCollab = subscribeCollabMessages(msg => {
      if (msg.type === 'INVENTORY_MUTATION') {
        setInventory(msg.inventory);
        setHistory(loadHistory());
        showToast(`Teammate (${msg.user}): ${msg.lastAction}`, 'info');
      } else if (msg.type === 'ITEM_COMMENT_ADDED') {
        setComments(loadComments());
      } else if (msg.type === 'REQUEST_SYNC') {
        setInventory(loadInventory());
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeCollab();
    };
  }, [showToast]);

  // ── SIMULATED LAB TEAM ROTATION (When enabled) ───────────────────
  useEffect(() => {
    if (!simulateActivity) return;

    const interval = setInterval(() => {
      if (inventory.length === 0) return;
      const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
      setCollaborators(prev => {
        const copy = [...prev];
        const randomCollabIdx = Math.floor(Math.random() * copy.length);
        const states: ('active' | 'idle' | 'editing')[] = ['active', 'editing', 'idle'];
        const randomState = states[Math.floor(Math.random() * states.length)];
        
        copy[randomCollabIdx] = {
          ...copy[randomCollabIdx],
          status: randomState,
          activePart: randomState === 'idle' ? undefined : randomItem.partNumber,
          lastSeen: 'Just now',
        };
        return copy;
      });
    }, 12000);

    return () => clearInterval(interval);
  }, [simulateActivity, inventory]);

  // ── OFFLINE SYNC HANDLER ─────────────────────────────────────────
  const syncOfflineQueue = useCallback(async () => {
    const queue = loadOfflineQueue();
    if (queue.length === 0) {
      showToast('Inventory is up to date with cloud master.', 'success');
      return;
    }

    setIsSyncing(true);
    // Simulate brief network batching
    await new Promise(r => setTimeout(r, 800));

    clearOfflineQueue();
    setPendingSyncCount(0);
    setIsSyncing(false);
    showToast(`Successfully synchronized ${queue.length} queued action(s) with master catalog!`, 'success');
  }, [showToast]);

  // ── INVENTORY MUTATION HANDLER ───────────────────────────────────
  const handleUpdateInventory = useCallback((newItems: InventoryItem[], actionDescription: string, user = 'Current User') => {
    setInventory(newItems);
    saveInventory(newItems);

    // If offline, enqueue for background sync
    if (!navigator.onLine) {
      enqueueOfflineAction({
        type: 'bulk',
        summary: actionDescription,
        payload: newItems,
      });
      setPendingSyncCount(loadOfflineQueue().length);
      showToast('Saved offline. Queued for synchronization.', 'info');
    } else {
      showToast(actionDescription, 'success');
    }

    // Broadcast in real-time across tabs / collaborators
    broadcastCollabMessage({
      type: 'INVENTORY_MUTATION',
      inventory: newItems,
      lastAction: actionDescription,
      user,
    });
  }, [showToast]);

  // ── QUICK ADJUST HANDLER (+ / -) ─────────────────────────────────
  const handleQuickAdjust = useCallback((partNumber: string, delta: number) => {
    const target = inventory.find(i => i.partNumber === partNumber);
    if (!target) return;

    const newQty = Math.max(0, target.quantity + delta);
    const updated = inventory.map(item => {
      if (item.partNumber === partNumber) {
        return {
          ...item,
          quantity: newQty,
          lastModified: new Date().toISOString(),
          modifiedBy: 'Field Tech',
        };
      }
      return item;
    });

    logHistory(
      delta > 0 ? 'Adjustment (add)' : 'Adjustment (sub)',
      partNumber,
      target.description,
      Math.abs(delta),
      delta > 0 ? 'Quick Restock' : 'Quick Consumable Usage',
      'Field Tech'
    );
    setHistory(loadHistory());

    handleUpdateInventory(
      updated,
      `${delta > 0 ? 'Added' : 'Subtracted'} ${Math.abs(delta)} unit(s) of ${partNumber}`,
      'Field Tech'
    );
  }, [inventory, handleUpdateInventory]);

  // ── QUICK WITHDRAW HANDLER ───────────────────────────────────────
  const handleConfirmWithdraw = useCallback((partNumber: string, qty: number, reason: string) => {
    const target = inventory.find(i => i.partNumber === partNumber);
    if (!target) return;

    const newQty = Math.max(0, target.quantity - qty);
    const updated = inventory.map(item => {
      if (item.partNumber === partNumber) {
        return {
          ...item,
          quantity: newQty,
          lastModified: new Date().toISOString(),
          modifiedBy: 'Rig Dispatch',
        };
      }
      return item;
    });

    logHistory('Withdrawal', partNumber, target.description, qty, reason, 'Rig Dispatch');
    setHistory(loadHistory());

    handleUpdateInventory(
      updated,
      `Withdrew ${qty} unit(s) of ${partNumber} for "${reason}"`,
      'Rig Dispatch'
    );
  }, [inventory, handleUpdateInventory]);

  // ── COMMENTS HANDLER ─────────────────────────────────────────────
  const handleAddComment = useCallback((partNumber: string, text: string) => {
    const newComment: ItemComment = {
      id: 'c-' + Date.now(),
      partNumber,
      author: 'You (Lab Tech)',
      text,
      timestamp: new Date().toISOString(),
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    saveComments(updated);

    broadcastCollabMessage({
      type: 'ITEM_COMMENT_ADDED',
      comment: newComment,
    });
    showToast(`Note attached to part ${partNumber}`, 'success');
  }, [comments, showToast]);

  // ── SECURITY CREDENTIAL UPDATE ───────────────────────────────────
  const handleUpdateSecurityCredential = useCallback((newCred: SecurityCredential) => {
    setSecurityCredential(newCred);
    saveSecurityCredential(newCred);
    showToast('PBKDF2 security credentials and cryptographic salt updated.', 'success');
  }, [showToast]);

  // ── GLOBAL THRESHOLD UPDATE ──────────────────────────────────────
  const handleUpdateGlobalThreshold = useCallback((val: number) => {
    setGlobalThresholdState(val);
    setGlobalThreshold(val);
    showToast(`Global safety threshold set to ${val}`, 'info');
  }, [showToast]);

  // ── SHAREPOINT CONFIG UPDATE ─────────────────────────────────────
  const handleUpdateSharePointConfig = useCallback((cfg: SharePointConfig) => {
    setSharePointConfig(cfg);
    saveSharePointConfig(cfg);
    showToast('SharePoint connection settings saved.', 'success');
  }, [showToast]);

  // ── CATEGORIES & FILTER COMPUTATIONS ─────────────────────────────
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach(i => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventory]);

  const thresholdOf = useCallback((item: InventoryItem) => {
    return item.threshold !== undefined && item.threshold !== null
      ? item.threshold
      : globalThreshold;
  }, [globalThreshold]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inventory.filter(item => {
      // Query search
      const matchesSearch = !q || 
        item.partNumber.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.remarks && item.remarks.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      const thr = thresholdOf(item);
      const isOut = item.quantity <= 0;
      const isLow = !isOut && item.quantity <= thr;

      if (statusFilter === 'out_of_stock' && !isOut) return false;
      if (statusFilter === 'low_stock' && !isLow) return false;
      if (statusFilter === 'in_stock' && (isOut || isLow)) return false;

      return true;
    });
  }, [inventory, searchQuery, selectedCategory, statusFilter, thresholdOf]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(i => i.quantity <= thresholdOf(i));
  }, [inventory, thresholdOf]);

  const outOfStockCount = useMemo(() => {
    return inventory.filter(i => i.quantity <= 0).length;
  }, [inventory]);

  const lowStockOnlyCount = useMemo(() => {
    return inventory.filter(i => i.quantity > 0 && i.quantity <= thresholdOf(i)).length;
  }, [inventory, thresholdOf]);

  const healthyCount = useMemo(() => {
    return inventory.filter(i => i.quantity > thresholdOf(i)).length;
  }, [inventory, thresholdOf]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border backdrop-blur-md ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              : toast.type === 'warn'
              ? 'bg-amber-950/90 text-amber-200 border-amber-800'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-slate-900/95 text-slate-100 border-slate-700'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'warn' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header Component */}
      <Header
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={syncOfflineQueue}
        isSyncing={isSyncing}
        lowStockCount={lowStockItems.length}
        collaborators={collaborators}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCollab={() => setIsCollabOpen(true)}
        onOpenSharePoint={() => setIsSharePointOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Search, Stats, & Category Filters */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          categories={categories}
          totalCount={inventory.length}
          filteredCount={filteredItems.length}
          lowStockCount={lowStockOnlyCount}
          outOfStockCount={outOfStockCount}
          healthyCount={healthyCount}
        />

        {/* Precision Inventory Table */}
        <InventoryTable
          items={filteredItems}
          collaborators={collaborators}
          onQuickAdjust={handleQuickAdjust}
          onOpenItemComments={(pn) => {
            setSelectedPartForComment(pn);
            setIsCollabOpen(true);
          }}
          onOpenQuickWithdraw={(item) => setWithdrawItem(item)}
          onOpenAdminEdit={(item) => {
            setSelectedPartForAdminEdit(item);
            setIsAdminOpen(true);
          }}
        />

      </main>

      {/* Quiet Technical Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950/60 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>SLB Wireline Laboratory Systems</span>
            <span>·</span>
            <span>PBKDF2-SHA256 Cryptographic Core</span>
            <span>·</span>
            <span>SharePoint Sync Compliant</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.bluemm.slb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-500 flex items-center gap-1 transition-colors"
            >
              <span>BlueMM Catalog</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="hover:text-sky-500 transition-colors"
            >
              Support &amp; Contact
            </button>
          </div>
        </div>
      </footer>

      {/* ── MODALS & DRAWERS ──────────────────────────────────────── */}

      {/* Admin Console Modal */}
      {securityCredential && (
        <AdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          inventory={inventory}
          onUpdateInventory={handleUpdateInventory}
          securityCredential={securityCredential}
          onUpdateSecurityCredential={handleUpdateSecurityCredential}
          globalThreshold={globalThreshold}
          onUpdateGlobalThreshold={handleUpdateGlobalThreshold}
          sharePointConfig={sharePointConfig}
          onUpdateSharePointConfig={handleUpdateSharePointConfig}
          selectedPartForEdit={selectedPartForAdminEdit}
          onClearSelectedPartForEdit={() => setSelectedPartForAdminEdit(null)}
        />
      )}

      {/* Real-Time Team Collaboration Drawer */}
      <CollaborationDrawer
        isOpen={isCollabOpen}
        onClose={() => setIsCollabOpen(false)}
        collaborators={collaborators}
        comments={comments}
        onAddComment={handleAddComment}
        inventory={inventory}
        selectedPartForComment={selectedPartForComment}
        onSelectPartForComment={setSelectedPartForComment}
        simulateActivity={simulateActivity}
        onToggleSimulateActivity={() => setSimulateActivity(p => !p)}
      />

      {/* Inventory History & Trends Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => {
          setHistory([]);
          saveHistory([]);
          showToast('History log cleared.', 'info');
        }}
      />

      {/* Low-Stock Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        lowStockItems={lowStockItems}
        onOpenQuickWithdraw={(item) => {
          setIsAlertsOpen(false);
          setWithdrawItem(item);
        }}
        onSelectPartForAdjustment={(pn) => {
          const it = inventory.find(i => i.partNumber === pn);
          if (it) {
            setSelectedPartForAdminEdit(it);
            setIsAdminOpen(true);
          }
        }}
      />

      {/* SharePoint Integration Modal */}
      <SharePointModal
        isOpen={isSharePointOpen}
        onClose={() => setIsSharePointOpen(false)}
        inventory={inventory}
        config={sharePointConfig}
        onUpdateConfig={handleUpdateSharePointConfig}
      />

      {/* Quick Withdraw Modal */}
      <WithdrawModal
        item={withdrawItem}
        isOpen={!!withdrawItem}
        onClose={() => setWithdrawItem(null)}
        onConfirmWithdraw={handleConfirmWithdraw}
      />

      {/* Help & Support Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

    </div>
  );
}
