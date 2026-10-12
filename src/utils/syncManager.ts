import { InventoryItem, HistoryEntry, OfflineAction, Collaborator, ItemComment } from '../types';

export const STORE_KEY = 'wllab_inventory';
export const HIST_KEY = 'wllab_history';
export const QUEUE_KEY = 'wllab_offline_queue';
export const GTHRESH_KEY = 'wllab_global_threshold';
export const THEME_KEY = 'wllab_theme';
export const SHAREPOINT_CONFIG_KEY = 'wllab_sharepoint_config';
export const COMMENTS_KEY = 'wllab_comments';

// Real-Time BroadcastChannel for cross-tab and multi-user document collaboration
const BROADCAST_CHANNEL_NAME = 'wllab_collab_v1';
let collabChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    collabChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment');
}

export const INITIAL_COLLABORATORS: Collaborator[] = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    role: 'Lead Wireline Specialist',
    status: 'active',
    activePart: 'WL-1002',
    lastSeen: 'Just now',
    color: '#0284c7', // Sky
  },
  {
    id: 'user-2',
    name: 'Marcus Vance',
    role: 'Lab Quality Inspector',
    status: 'editing',
    activePart: 'WL-1005',
    lastSeen: '1m ago',
    color: '#10b981', // Emerald
  },
  {
    id: 'user-3',
    name: 'Elena Rostova',
    role: 'Tooling & Assembly Tech',
    status: 'idle',
    activePart: undefined,
    lastSeen: '4m ago',
    color: '#f59e0b', // Amber
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    partNumber: 'WL-1001',
    description: 'O-Ring Kit 2" Standard Viton 90D',
    location: 'Shelf A-1 · Bin 04',
    quantity: 14,
    threshold: 4,
    category: 'O-Rings & Seals',
    remarks: 'Approved for 5110 & 5120 tool head assemblies',
    lastModified: new Date(Date.now() - 3600000 * 2).toISOString(),
    modifiedBy: 'Sarah Chen',
  },
  {
    partNumber: 'WL-1002',
    description: 'Centralizer Heavy Spring Pack (Titanium)',
    location: 'Rack B-3 · Tier 2',
    quantity: 2,
    threshold: 5,
    category: 'Mechanical',
    remarks: 'Critical: Re-order pending PO #49219',
    lastModified: new Date(Date.now() - 3600000 * 5).toISOString(),
    modifiedBy: 'Marcus Vance',
  },
  {
    partNumber: 'WL-1003',
    description: 'Pressure Transducer Quartz 10kpsi Module',
    location: 'Cabinet C-2 · Cleanroom',
    quantity: 0,
    threshold: 2,
    category: 'Sensors',
    remarks: 'Depleted · Urgent field shipment requested',
    lastModified: new Date(Date.now() - 3600000 * 18).toISOString(),
    modifiedBy: 'Lab Supervisor',
  },
  {
    partNumber: 'WL-1004',
    description: 'Fishing Tool Overshot Assembly 3.5" OD',
    location: 'Rack D-7 · Heavy Bay',
    quantity: 7,
    threshold: 3,
    category: 'Mechanical',
    remarks: 'NDT inspection certified through Q4',
    lastModified: new Date(Date.now() - 3600000 * 48).toISOString(),
    modifiedBy: 'Elena Rostova',
  },
  {
    partNumber: 'WL-1005',
    description: 'Cable Head Quick-Release Cartridge',
    location: 'Shelf A-2 · Safe 1',
    quantity: 2,
    threshold: 4,
    category: 'Assemblies',
    remarks: 'Inspect electrical continuity pins before deployment',
    lastModified: new Date(Date.now() - 3600000 * 1).toISOString(),
    modifiedBy: 'Marcus Vance',
  },
  {
    partNumber: 'WL-1006',
    description: 'High-Torque Anchor Slip Ring Set',
    location: 'Bin E-1 · Section 3',
    quantity: 18,
    threshold: 5,
    category: 'Fasteners',
    remarks: 'Compatible with standard wireline mandrels',
    lastModified: new Date(Date.now() - 3600000 * 12).toISOString(),
    modifiedBy: 'Sarah Chen',
  },
  {
    partNumber: 'WL-1007',
    description: 'Casing Collar Locator (CCL) Coil Module',
    location: 'Cabinet F · Sensor Lab',
    quantity: 1,
    threshold: 3,
    category: 'Sensors',
    remarks: 'Pre-calibrated at Aberdeen lab facility',
    lastModified: new Date(Date.now() - 3600000 * 8).toISOString(),
    modifiedBy: 'Elena Rostova',
  },
  {
    partNumber: 'WL-1008',
    description: 'Hydraulic Piston Dual-Lip Seal Kit',
    location: 'Shelf A-4 · Bin 12',
    quantity: 9,
    threshold: 3,
    category: 'O-Rings & Seals',
    remarks: 'High-temp rated to 175°C downhole',
    lastModified: new Date(Date.now() - 3600000 * 24).toISOString(),
    modifiedBy: 'Sarah Chen',
  },
  {
    partNumber: 'WL-1009',
    description: 'Gamma Ray Scintillator Crystal 1"x2"',
    location: 'Cabinet C-1 · Lead Shield',
    quantity: 4,
    threshold: 2,
    category: 'Sensors',
    remarks: 'Handle with anti-static wrist strap only',
    lastModified: new Date(Date.now() - 3600000 * 72).toISOString(),
    modifiedBy: 'Lab Supervisor',
  },
  {
    partNumber: 'WL-1010',
    description: 'Shear Pin Brass Standard 5/16" 3000lb',
    location: 'Bin B-1 · Drawer 4',
    quantity: 45,
    threshold: 15,
    category: 'Fasteners',
    remarks: 'Consumable pack · Verify shear rating batch stamp',
    lastModified: new Date(Date.now() - 3600000 * 10).toISOString(),
    modifiedBy: 'Sarah Chen',
  },
];

export const INITIAL_COMMENTS: ItemComment[] = [
  {
    id: 'c-1',
    partNumber: 'WL-1003',
    author: 'Sarah Chen',
    text: 'Transducer requisition submitted via SAP #88019. Delivery ETA Thursday 08:00.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'c-2',
    partNumber: 'WL-1002',
    author: 'Marcus Vance',
    text: 'Inspected titanium springs on shelf B-3; 2 units remain ready for rig mobilization.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'c-3',
    partNumber: 'WL-1005',
    author: 'Elena Rostova',
    text: 'Connector pins tested at 500V insulation resistance. Passes SLB Wireline Std 14.',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

// ── STORAGE ACCESSORS ──────────────────────────────────────────

export function loadInventory(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored inventory, using defaults.');
  }
  saveInventory(INITIAL_INVENTORY);
  return INITIAL_INVENTORY;
}

export function saveInventory(data: InventoryItem[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading history');
  }
  return [];
}

export function saveHistory(history: HistoryEntry[]): void {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(history.slice(0, 500)));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function logHistory(
  action: string,
  partNumber: string,
  description: string,
  qty: number | string,
  note: string,
  user = 'Current User'
): HistoryEntry {
  const history = loadHistory();
  const entry: HistoryEntry = {
    id: 'h-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    ts: new Date().toISOString(),
    action,
    partNumber,
    description,
    qty: qty ?? '',
    note: note || '',
    user,
  };
  history.unshift(entry);
  saveHistory(history);
  return entry;
}

export function loadOfflineQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading offline queue');
  }
  return [];
}

export function saveOfflineQueue(queue: OfflineAction[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): OfflineAction {
  const queue = loadOfflineQueue();
  const item: OfflineAction = {
    ...action,
    id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };
  queue.push(item);
  saveOfflineQueue(queue);
  return item;
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getGlobalThreshold(): number {
  const val = localStorage.getItem(GTHRESH_KEY);
  return val === null ? 0 : parseInt(val, 10);
}

export function setGlobalThreshold(val: number): void {
  localStorage.setItem(GTHRESH_KEY, val.toString());
}

export function loadComments(): ItemComment[] {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading comments');
  }
  saveComments(INITIAL_COMMENTS);
  return INITIAL_COMMENTS;
}

export function saveComments(comments: ItemComment[]): void {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
}

// ── REAL-TIME BROADCAST PROTOCOL ───────────────────────────────

export type CollabMessage =
  | { type: 'INVENTORY_MUTATION'; inventory: InventoryItem[]; lastAction: string; user: string }
  | { type: 'PRESENCE_PING'; collaborator: Collaborator }
  | { type: 'ITEM_COMMENT_ADDED'; comment: ItemComment }
  | { type: 'REQUEST_SYNC' };

export function broadcastCollabMessage(message: CollabMessage): void {
  if (collabChannel) {
    try {
      collabChannel.postMessage(message);
    } catch (e) {
      console.error('Failed to broadcast message:', e);
    }
  }
}

export function subscribeCollabMessages(handler: (msg: CollabMessage) => void): () => void {
  if (!collabChannel) return () => {};
  const listener = (event: MessageEvent) => {
    handler(event.data);
  };
  collabChannel.addEventListener('message', listener);
  return () => {
    collabChannel?.removeEventListener('message', listener);
  };
}
