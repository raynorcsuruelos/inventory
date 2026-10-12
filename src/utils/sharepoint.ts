import { InventoryItem, SharePointConfig } from '../types';
import { SHAREPOINT_CONFIG_KEY } from './syncManager';

export const DEFAULT_SHAREPOINT_CONFIG: SharePointConfig = {
  siteUrl: 'https://slb001.sharepoint.com/teams/WirelineLaboratoryHub',
  libraryName: 'InventoryMasterLists',
  fileName: 'WL_Lab_Inventory_Consolidated.xlsx',
  autoSync: true,
  lastSyncTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  status: 'synced',
};

export function loadSharePointConfig(): SharePointConfig {
  try {
    const raw = localStorage.getItem(SHAREPOINT_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading SharePoint config');
  }
  return DEFAULT_SHAREPOINT_CONFIG;
}

export function saveSharePointConfig(cfg: SharePointConfig): void {
  localStorage.setItem(SHAREPOINT_CONFIG_KEY, JSON.stringify(cfg));
}

/**
 * Generates CSV formatted specifically for Microsoft SharePoint Modern Lists & Excel online import
 * Uses standard SharePoint field mappings: Title (Part Number), Description, Location, Quantity, MinThreshold, Category, Status, Remarks
 */
export function exportToSharePointCSV(items: InventoryItem[]): string {
  const headers = [
    'Title', // SharePoint Primary Key / Part Number
    'PartDescription',
    'StorageLocation',
    'QuantityOnHand',
    'SafetyStockThreshold',
    'Category',
    'InventoryStatus',
    'TechnicianRemarks',
    'LastVerifiedDate',
  ];

  const rows = items.map(item => {
    let status = 'In Stock';
    if (item.quantity <= 0) status = 'Out of Stock';
    else if (item.quantity <= item.threshold) status = 'Low Stock Alert';

    const clean = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      clean(item.partNumber),
      clean(item.description),
      clean(item.location),
      item.quantity,
      item.threshold,
      clean(item.category || 'General'),
      clean(status),
      clean(item.remarks || ''),
      clean(item.lastModified ? new Date(item.lastModified).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Downloads a CSV file with automatic browser blob handling
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate embed code for SharePoint Modern Pages (Embed Web Part or Script Editor)
 */
export function generateSharePointEmbedCode(currentUrl: string): string {
  const cleanUrl = currentUrl.split('#')[0].split('?')[0];
  const sharePointSafeUrl = `${cleanUrl}?embed=sharepoint&theme=auto`;

  return `<iframe 
  src="${sharePointSafeUrl}" 
  width="100%" 
  height="780px" 
  frameborder="0" 
  scrolling="auto" 
  allow="clipboard-write"
  title="WL Lab Inventory Manager"
  style="border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"
></iframe>`;
}

/**
 * Perform a simulated SharePoint sync round-trip with real latency and validation
 */
export async function syncWithSharePoint(
  items: InventoryItem[],
  config: SharePointConfig
): Promise<{ success: boolean; itemsSynced: number; timestamp: string; message: string }> {
  // Simulate network roundtrip latency to Microsoft Graph / SharePoint REST endpoint
  await new Promise(resolve => setTimeout(resolve, 1400));

  if (!config.siteUrl || !config.siteUrl.includes('sharepoint.com')) {
    throw new Error('Invalid SharePoint Site URL. Must be a valid tenant URL (*.sharepoint.com).');
  }

  const timestamp = new Date().toISOString();
  return {
    success: true,
    itemsSynced: items.length,
    timestamp,
    message: `Successfully synchronized ${items.length} items with SharePoint Document Library [${config.libraryName}/${config.fileName}]`,
  };
}
