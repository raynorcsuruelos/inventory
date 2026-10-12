export interface InventoryItem {
  partNumber: string;
  description: string;
  location: string;
  quantity: number;
  threshold: number;
  remarks?: string;
  category?: string;
  lastModified?: string;
  modifiedBy?: string;
}

export interface HistoryEntry {
  id: string;
  ts: string;
  action: string;
  partNumber: string;
  description: string;
  qty: number | string;
  note: string;
  user?: string;
}

export interface SecurityCredential {
  saltHex: string;
  hashHex: string;
  iterations: number;
  algorithm: string;
  updatedAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'editing';
  activePart?: string;
  lastSeen: string;
  color: string;
}

export interface OfflineAction {
  id: string;
  type: 'adjust' | 'edit' | 'add' | 'delete' | 'import' | 'bulk';
  timestamp: string;
  summary: string;
  payload: any;
}

export interface SharePointConfig {
  siteUrl: string;
  libraryName: string;
  fileName: string;
  autoSync: boolean;
  lastSyncTime?: string;
  status: 'idle' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
}

export interface ItemComment {
  id: string;
  partNumber: string;
  author: string;
  text: string;
  timestamp: string;
}
