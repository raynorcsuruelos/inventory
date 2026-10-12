import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Plus, 
  Upload, 
  Download, 
  Trash2, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Copy,
  Sliders,
  Database
} from 'lucide-react';
import { InventoryItem, SecurityCredential, SharePointConfig } from '../types';
import { 
  verifyPassword, 
  hashNewPassword, 
  assessPasswordStrength, 
  DEFAULT_ITERATIONS 
} from '../utils/crypto';
import { 
  exportToSharePointCSV, 
  triggerFileDownload, 
  generateSharePointEmbedCode 
} from '../utils/sharepoint';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  onUpdateInventory: (items: InventoryItem[], actionDescription: string) => void;
  securityCredential: SecurityCredential;
  onUpdateSecurityCredential: (newCred: SecurityCredential) => void;
  globalThreshold: number;
  onUpdateGlobalThreshold: (val: number) => void;
  sharePointConfig: SharePointConfig;
  onUpdateSharePointConfig: (cfg: SharePointConfig) => void;
  selectedPartForEdit?: InventoryItem | null;
  onClearSelectedPartForEdit: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  securityCredential,
  onUpdateSecurityCredential,
  globalThreshold,
  onUpdateGlobalThreshold,
  sharePointConfig,
  onUpdateSharePointConfig,
  selectedPartForEdit,
  onClearSelectedPartForEdit,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'adjust' | 'edit' | 'add' | 'import' | 'security' | 'sharepoint'>('adjust');

  // Adjust Tab State
  const [adjPart, setAdjPart] = useState('');
  const [adjAction, setAdjAction] = useState<'set' | 'add' | 'sub'>('add');
  const [adjQty, setAdjQty] = useState('');
  const [adjThreshold, setAdjThreshold] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Add Item State
  const [newPn, setNewPn] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newCategory, setNewCategory] = useState('O-Rings & Seals');
  const [newQty, setNewQty] = useState('0');
  const [newThreshold, setNewThreshold] = useState('0');
  const [newRemarks, setNewRemarks] = useState('');

  // Edit Tab State
  const [editSearch, setEditSearch] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Security Tab State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [targetIterations, setTargetIterations] = useState<number>(DEFAULT_ITERATIONS);
  const [securityStatusMsg, setSecurityStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [tempGlobalThreshold, setTempGlobalThreshold] = useState(globalThreshold.toString());

  // SharePoint Tab State
  const [spSiteUrl, setSpSiteUrl] = useState(sharePointConfig.siteUrl);
  const [spLibrary, setSpLibrary] = useState(sharePointConfig.libraryName);
  const [spFileName, setSpFileName] = useState(sharePointConfig.fileName);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Initialize or handle pre-selected edit part
  useEffect(() => {
    if (selectedPartForEdit && isAuthenticated) {
      setActiveTab('edit');
      setEditingItem({ ...selectedPartForEdit });
      onClearSelectedPartForEdit();
    }
  }, [selectedPartForEdit, isAuthenticated]);

  useEffect(() => {
    setTempGlobalThreshold(globalThreshold.toString());
  }, [globalThreshold]);

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setLoginError('Password is required.');
      return;
    }

    setIsVerifying(true);
    setLoginError('');

    try {
      const isValid = await verifyPassword(passwordInput, securityCredential);
      if (isValid) {
        setIsAuthenticated(true);
        setPasswordInput('');
        setLoginError('');
      } else {
        setLoginError('Invalid administrator credentials.');
      }
    } catch (err) {
      setLoginError('Verification error encountered.');
    } finally {
      setIsVerifying(false);
    }
  };

  // ── ADJUST STOCK ACTIONS ──────────────────────────────────────────
  const handleApplyAdjustment = () => {
    if (!adjPart) return alert('Please select a part number.');
    const qtyNum = parseInt(adjQty, 10);
    if (isNaN(qtyNum) || qtyNum < 0) return alert('Please enter a valid positive quantity.');

    const target = inventory.find(i => i.partNumber === adjPart);
    if (!target) return alert('Part not found.');

    let newQuantity = target.quantity;
    if (adjAction === 'set') newQuantity = qtyNum;
    else if (adjAction === 'add') newQuantity += qtyNum;
    else if (adjAction === 'sub') {
      if (qtyNum > target.quantity) return alert('Cannot subtract more than available on-hand stock.');
      newQuantity -= qtyNum;
    }

    const updatedItems = inventory.map(item => {
      if (item.partNumber === adjPart) {
        return {
          ...item,
          quantity: newQuantity,
          threshold: adjThreshold !== '' ? Math.max(0, parseInt(adjThreshold, 10) || 0) : item.threshold,
          lastModified: new Date().toISOString(),
          modifiedBy: 'Admin',
        };
      }
      return item;
    });

    onUpdateInventory(updatedItems, `Adjusted ${adjPart} (${adjAction} ${qtyNum}) - ${adjReason || 'Routine adjustment'}`);
    setAdjQty('');
    setAdjReason('');
    alert(`Updated ${adjPart}. New quantity: ${newQuantity}`);
  };

  const handleFullWithdraw = () => {
    if (!adjPart) return alert('Please select a part.');
    const target = inventory.find(i => i.partNumber === adjPart);
    if (!target) return alert('Part not found.');
    if (target.quantity <= 0) return alert('Stock is already depleted (0 units).');

    if (!confirm(`Are you sure you want to withdraw all ${target.quantity} unit(s) of ${target.partNumber} for field dispatch?`)) {
      return;
    }

    const withdrawnQty = target.quantity;
    const updatedItems = inventory.map(item => {
      if (item.partNumber === adjPart) {
        return {
          ...item,
          quantity: 0,
          lastModified: new Date().toISOString(),
          modifiedBy: 'Admin',
        };
      }
      return item;
    });

    onUpdateInventory(updatedItems, `Withdrew full stock of ${adjPart} (${withdrawnQty} units) - ${adjReason || 'Emergency field dispatch'}`);
    setAdjQty('');
    alert(`Withdrew ${withdrawnQty} unit(s) of ${adjPart}. Current stock is now 0.`);
  };

  // ── ADD NEW ITEM ──────────────────────────────────────────────────
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPn.trim() || !newDesc.trim() || !newLoc.trim()) {
      return alert('Part Number, Description, and Location are mandatory fields.');
    }

    const existing = inventory.find(i => i.partNumber.toLowerCase() === newPn.trim().toLowerCase());
    if (existing) {
      return alert(`Part ${newPn.trim()} already exists in catalog. Use Edit tab to modify.`);
    }

    const newItem: InventoryItem = {
      partNumber: newPn.trim().toUpperCase(),
      description: newDesc.trim(),
      location: newLoc.trim(),
      category: newCategory,
      quantity: Math.max(0, parseInt(newQty, 10) || 0),
      threshold: Math.max(0, parseInt(newThreshold, 10) || 0),
      remarks: newRemarks.trim(),
      lastModified: new Date().toISOString(),
      modifiedBy: 'Admin',
    };

    onUpdateInventory([...inventory, newItem], `Added new part ${newItem.partNumber} (${newItem.description})`);
    setNewPn('');
    setNewDesc('');
    setNewLoc('');
    setNewQty('0');
    setNewThreshold('0');
    setNewRemarks('');
    alert(`Part ${newItem.partNumber} successfully added to inventory.`);
  };

  // ── EDIT / DELETE ITEM ────────────────────────────────────────────
  const handleSaveEditedItem = () => {
    if (!editingItem) return;
    if (!editingItem.partNumber.trim() || !editingItem.description.trim() || !editingItem.location.trim()) {
      return alert('Part number, description, and location are required.');
    }

    const updatedItems = inventory.map(i => {
      if (i.partNumber === editingItem.partNumber) {
        return {
          ...editingItem,
          lastModified: new Date().toISOString(),
          modifiedBy: 'Admin',
        };
      }
      return i;
    });

    onUpdateInventory(updatedItems, `Edited part ${editingItem.partNumber}`);
    setEditingItem(null);
    alert(`Saved changes for ${editingItem.partNumber}`);
  };

  const handleDeleteItem = (pn: string) => {
    if (!confirm(`Are you certain you wish to delete part ${pn}? This action cannot be reversed.`)) return;
    const filtered = inventory.filter(i => i.partNumber !== pn);
    onUpdateInventory(filtered, `Deleted part ${pn}`);
    alert(`Part ${pn} deleted.`);
  };

  // ── CSV & JSON IMPORT / EXPORT ────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let imported: InventoryItem[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('JSON root must be an array of objects.');
          imported = parsed.map(item => ({
            partNumber: String(item.partNumber || item.PartNumber || item.Title || '').trim(),
            description: String(item.description || item.Description || item.PartDescription || '').trim(),
            location: String(item.location || item.Location || item.StorageLocation || '').trim(),
            quantity: Math.max(0, parseInt(item.quantity || item.QuantityOnHand || '0', 10) || 0),
            threshold: Math.max(0, parseInt(item.threshold || item.SafetyStockThreshold || '0', 10) || 0),
            category: String(item.category || item.Category || 'Consumables'),
            remarks: String(item.remarks || item.TechnicianRemarks || ''),
            lastModified: new Date().toISOString(),
            modifiedBy: 'Bulk Import',
          }));
        } else {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length < 2) throw new Error('CSV file requires at least a header and one data row.');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });

            const pn = obj.partnumber || obj.title || obj['part number'] || '';
            if (pn) {
              imported.push({
                partNumber: pn,
                description: obj.partdescription || obj.description || 'General Spare',
                location: obj.storagelocation || obj.location || 'Bin Default',
                quantity: parseInt(obj.quantityonhand || obj.quantity || '0', 10) || 0,
                threshold: parseInt(obj.safetystockthreshold || obj.threshold || '0', 10) || 0,
                category: obj.category || 'General',
                remarks: obj.technicianremarks || obj.remarks || '',
                lastModified: new Date().toISOString(),
                modifiedBy: 'CSV Import',
              });
            }
          }
        }

        if (imported.length === 0) throw new Error('No valid part records found.');

        // Merge with existing
        const merged = [...inventory];
        let added = 0;
        let updated = 0;

        imported.forEach(newItem => {
          const idx = merged.findIndex(existing => existing.partNumber.toLowerCase() === newItem.partNumber.toLowerCase());
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...newItem };
            updated++;
          } else {
            merged.push(newItem);
            added++;
          }
        });

        onUpdateInventory(merged, `Imported ${file.name} (${added} added, ${updated} updated)`);
        alert(`Successfully imported: ${added} added, ${updated} updated.`);
      } catch (err: any) {
        alert(`Failed to import file: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    const csv = exportToSharePointCSV(inventory);
    triggerFileDownload(csv, `WL_Lab_Inventory_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(inventory, null, 2);
    triggerFileDownload(jsonStr, `WL_Lab_Inventory_Backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  // ── CHANGE PASSWORD & SECURITY CONFIGURATION ──────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatusMsg(null);

    if (!currentPass) {
      setSecurityStatusMsg({ text: 'Current password is required.', type: 'error' });
      return;
    }

    const isCurrentValid = await verifyPassword(currentPass, securityCredential);
    if (!isCurrentValid) {
      setSecurityStatusMsg({ text: 'Current password does not match.', type: 'error' });
      return;
    }

    if (newPass !== confirmPass) {
      setSecurityStatusMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    if (newPass.length < 8) {
      setSecurityStatusMsg({ text: 'New password must contain at least 8 characters.', type: 'error' });
      return;
    }

    try {
      const newCred = await hashNewPassword(newPass, targetIterations);
      onUpdateSecurityCredential(newCred);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setSecurityStatusMsg({
        text: `Password securely updated! Salted with 32 cryptographically random bytes and hashed with ${targetIterations.toLocaleString()} PBKDF2 iterations.`,
        type: 'success',
      });
    } catch (err) {
      setSecurityStatusMsg({ text: 'Failed to compute cryptographic hash.', type: 'error' });
    }
  };

  const handleSaveGlobalThreshold = () => {
    const val = parseInt(tempGlobalThreshold, 10);
    if (isNaN(val) || val < 0) return alert('Enter a valid non-negative number.');
    onUpdateGlobalThreshold(val);
    alert(`Global safety stock threshold set to ${val}.`);
  };

  // ── SHAREPOINT CONFIGURATION ──────────────────────────────────────
  const handleSaveSharePointConfig = () => {
    const updated: SharePointConfig = {
      ...sharePointConfig,
      siteUrl: spSiteUrl.trim(),
      libraryName: spLibrary.trim(),
      fileName: spFileName.trim(),
    };
    onUpdateSharePointConfig(updated);
    alert('SharePoint connection parameters saved.');
  };

  const handleCopyEmbed = () => {
    const code = generateSharePointEmbedCode(window.location.href);
    navigator.clipboard.writeText(code);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2500);
  };

  const passwordStrength = assessPasswordStrength(newPass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-600/10 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Wireline Laboratory Admin Console</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authorized Personnel Only · Cryptographically Protected
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isAuthenticated ? (
            /* Authentication Screen */
            <div className="max-w-md mx-auto py-8">
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-3">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">Admin Authentication</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter master laboratory credentials to adjust inventory, manage parts, and configure integrations.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter administrator password"
                      autoFocus
                      className="w-full pl-3.5 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginError && (
                    <p className="mt-2 text-xs font-medium text-rose-500 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {loginError}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Cryptographic Verification Active</span>
                  </div>
                  <p>
                    Passwords are verified using client-side <strong>PBKDF2-HMAC-SHA256</strong> with a 256-bit random salt and 100,000 hashing rounds.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-500 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Cryptographic Hash...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Unlock Admin Console</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Authenticated Admin Hub with Tabs */
            <div className="space-y-6">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 overflow-x-auto text-xs font-medium">
                <button
                  onClick={() => setActiveTab('adjust')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'adjust'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust Stock</span>
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'edit'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Edit / Delete Parts</span>
                </button>
                <button
                  onClick={() => setActiveTab('add')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'add'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Item</span>
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'import'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import / Export</span>
                </button>
                <button
                  onClick={() => setActiveTab('sharepoint')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'sharepoint'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>SharePoint Hub</span>
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === 'security'
                      ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Security &amp; Hashing</span>
                </button>
              </div>

              {/* TAB: ADJUST STOCK */}
              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Select Part
                      </label>
                      <select
                        value={adjPart}
                        onChange={(e) => {
                          setAdjPart(e.target.value);
                          const item = inventory.find(i => i.partNumber === e.target.value);
                          if (item) setAdjThreshold(item.threshold.toString());
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      >
                        <option value="">— Select Catalog Item —</option>
                        {inventory.map(i => (
                          <option key={i.partNumber} value={i.partNumber}>
                            {i.partNumber} — {i.description} (Current: {i.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current On-Hand Stock
                      </label>
                      <div className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {adjPart ? inventory.find(i => i.partNumber === adjPart)?.quantity ?? 0 : '—'} units
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Adjustment Action
                      </label>
                      <select
                        value={adjAction}
                        onChange={(e) => setAdjAction(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <option value="add">Add Quantity (Receiving / Restock)</option>
                        <option value="sub">Subtract Quantity (Consumable usage)</option>
                        <option value="set">Set Exact Count (Physical audit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quantity Delta
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={adjQty}
                        onChange={(e) => setAdjQty(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Safety Stock Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={adjThreshold}
                        onChange={(e) => setAdjThreshold(e.target.value)}
                        placeholder="Leave blank to maintain current"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Alert triggers when stock ≤ this threshold.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Adjustment Reason &amp; Reference Notes
                      </label>
                      <input
                        type="text"
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        placeholder="e.g. PO #18449 delivered / Pre-job checkout"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={handleApplyAdjustment}
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Stock Adjustment</span>
                    </button>
                    <button
                      onClick={handleFullWithdraw}
                      className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Full Stock Withdraw</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: EDIT / DELETE PARTS */}
              {activeTab === 'edit' && (
                <div className="space-y-4">
                  {editingItem ? (
                    <div className="p-4 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                          Editing Part: {editingItem.partNumber}
                        </h4>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          Cancel Editing
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="font-semibold block mb-1">Part Number</label>
                          <input
                            type="text"
                            value={editingItem.partNumber}
                            onChange={(e) => setEditingItem({ ...editingItem, partNumber: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Category</label>
                          <input
                            type="text"
                            value={editingItem.category || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="font-semibold block mb-1">Description</label>
                          <input
                            type="text"
                            value={editingItem.description}
                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Storage Location</label>
                          <input
                            type="text"
                            value={editingItem.location}
                            onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Stock Quantity</label>
                          <input
                            type="number"
                            min="0"
                            value={editingItem.quantity}
                            onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Safety Threshold</label>
                          <input
                            type="number"
                            min="0"
                            value={editingItem.threshold}
                            onChange={(e) => setEditingItem({ ...editingItem, threshold: parseInt(e.target.value, 10) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-semibold block mb-1">Remarks &amp; Notes</label>
                          <input
                            type="text"
                            value={editingItem.remarks || ''}
                            onChange={(e) => setEditingItem({ ...editingItem, remarks: e.target.value })}
                            className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={handleSaveEditedItem}
                          className="px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="px-3 py-1.5 rounded text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Filterable Parts List */}
                  <div>
                    <input
                      type="text"
                      placeholder="Filter parts to edit or delete..."
                      value={editSearch}
                      onChange={(e) => setEditSearch(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 mb-3"
                    />

                    <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {inventory
                        .filter(i => 
                          i.partNumber.toLowerCase().includes(editSearch.toLowerCase()) ||
                          i.description.toLowerCase().includes(editSearch.toLowerCase())
                        )
                        .map(i => (
                          <div key={i.partNumber} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{i.partNumber}</span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-600 dark:text-slate-300">{i.description}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                📍 {i.location} · Stock: <strong className="font-mono text-slate-700 dark:text-slate-300">{i.quantity}</strong> · Safety Min: {i.threshold}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setEditingItem({ ...i })}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 border border-sky-200 dark:border-sky-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(i.partNumber)}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ADD NEW ITEM */}
              {activeTab === 'add' && (
                <form onSubmit={handleAddNewItem} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Part Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPn}
                        onChange={(e) => setNewPn(e.target.value)}
                        placeholder="e.g. WL-1011"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      >
                        <option value="O-Rings & Seals">O-Rings & Seals</option>
                        <option value="Sensors">Sensors & Electronics</option>
                        <option value="Mechanical">Mechanical Tooling</option>
                        <option value="Assemblies">Assemblies & Cartridges</option>
                        <option value="Fasteners">Fasteners & Pins</option>
                        <option value="Consumables">General Consumables</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Part Description &amp; Technical Specs *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="e.g. Viton Quad-Ring 1.75in OD high-pressure seal"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Storage Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={newLoc}
                        onChange={(e) => setNewLoc(e.target.value)}
                        placeholder="e.g. Shelf A-3 · Bin 08"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Initial Stock Quantity *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Safety Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newThreshold}
                        onChange={(e) => setNewThreshold(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Fires alert when on-hand quantity falls below or equals this.
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Technician Remarks &amp; Tool Compatibility
                      </label>
                      <input
                        type="text"
                        value={newRemarks}
                        onChange={(e) => setNewRemarks(e.target.value)}
                        placeholder="Optional notes or supplier part numbers"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register Part into Catalog</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB: IMPORT / EXPORT */}
              {activeTab === 'import' && (
                <div className="space-y-6">
                  {/* File Upload Zone */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-slate-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Upload Inventory File (JSON or CSV)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports SharePoint Modern List exports, SAP CSV files, and native JSON catalog arrays.
                      </p>
                    </div>
                    <div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors">
                        <span>Select File to Import</span>
                        <input
                          type="file"
                          accept=".json,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Export Catalog Data
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1.5 transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Export SharePoint CSV</span>
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export Native JSON Backup</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SHAREPOINT MODERN INTEGRATION */}
              {activeTab === 'sharepoint' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Microsoft SharePoint &amp; Teams Embedded Integration</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Wireline inventory records can synchronize seamlessly with your corporate SharePoint Document Library and Modern Pages Web Parts.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                        SharePoint Site Collection URL
                      </label>
                      <input
                        type="text"
                        value={spSiteUrl}
                        onChange={(e) => setSpSiteUrl(e.target.value)}
                        placeholder="https://tenant.sharepoint.com/teams/WirelineLab"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                        Target Document Library
                      </label>
                      <input
                        type="text"
                        value={spLibrary}
                        onChange={(e) => setSpLibrary(e.target.value)}
                        placeholder="InventoryMasterLists"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                        Target Document Workbook
                      </label>
                      <input
                        type="text"
                        value={spFileName}
                        onChange={(e) => setSpFileName(e.target.value)}
                        placeholder="WL_Lab_Inventory_Consolidated.xlsx"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveSharePointConfig}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Connection Parameters</span>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Download SharePoint List CSV
                    </button>
                  </div>

                  {/* Embed Snippet Generator */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        SharePoint Modern Page Embed Code
                      </span>
                      <button
                        onClick={handleCopyEmbed}
                        className="flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500"
                      >
                        {embedCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{embedCopied ? 'Copied to Clipboard' : 'Copy Embed Snippet'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto select-all">
                      {generateSharePointEmbedCode(window.location.href)}
                    </pre>
                    <p className="text-[11px] text-slate-500">
                      Paste this iframe code inside a SharePoint Modern Page using the standard <em>Embed Web Part</em>.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: SECURITY & SALTED HASHING */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Security Protocol Overview */}
                  <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-semibold text-xs">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cryptographic Protocol: PBKDF2-HMAC-SHA256</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      The admin authentication engine implements modern zero-trust standards with non-deterministic salting:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/60">
                        <span className="text-slate-400 block text-[10px]">SALT LENGTH</span>
                        <strong className="text-purple-600 dark:text-purple-400">32 Bytes (256 bits)</strong>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/60">
                        <span className="text-slate-400 block text-[10px]">HASHING ROUNDS</span>
                        <strong className="text-purple-600 dark:text-purple-400">{securityCredential.iterations.toLocaleString()} Iterations</strong>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-800/60">
                        <span className="text-slate-400 block text-[10px]">DERIVED KEY</span>
                        <strong className="text-purple-600 dark:text-purple-400">256-bit SHA-256</strong>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono break-all pt-1">
                      Active Salt (Hex): {securityCredential.saltHex}
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Update Master Password
                    </h4>

                    {securityStatusMsg && (
                      <div className={`p-3 rounded-lg text-xs font-medium ${
                        securityStatusMsg.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        {securityStatusMsg.text}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Current Master Password
                        </label>
                        <input
                          type="password"
                          value={currentPass}
                          onChange={(e) => setCurrentPass(e.target.value)}
                          placeholder="Verify current password"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          New Secure Password
                        </label>
                        <input
                          type="password"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          placeholder="Enter new strong password"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        />
                        {/* Live Strength Meter */}
                        {newPass && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Strength:</span>
                              <span className={`font-semibold ${passwordStrength.color}`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength.score <= 1
                                    ? 'bg-rose-500 w-1/4'
                                    : passwordStrength.score === 2
                                    ? 'bg-amber-500 w-2/4'
                                    : passwordStrength.score === 3
                                    ? 'bg-yellow-500 w-3/4'
                                    : 'bg-emerald-500 w-full'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          placeholder="Re-type new password"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          PBKDF2 Iteration Protocol Level
                        </label>
                        <select
                          value={targetIterations}
                          onChange={(e) => setTargetIterations(parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        >
                          <option value={100000}>100,000 Iterations (Standard OWASP Recommendation)</option>
                          <option value={200000}>200,000 Iterations (Ultra Hardened Defense)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Re-Hash with Fresh Salt</span>
                    </button>
                  </form>

                  {/* Global Threshold Config */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 max-w-lg space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Default Global Safety Stock Threshold
                    </h4>
                    <p className="text-xs text-slate-500">
                      Fallback threshold applied to catalog parts without explicit minimums.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={tempGlobalThreshold}
                        onChange={(e) => setTempGlobalThreshold(e.target.value)}
                        className="w-28 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                      />
                      <button
                        onClick={handleSaveGlobalThreshold}
                        className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        Save Default Threshold
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>SLB Wireline Safety &amp; Quality Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
