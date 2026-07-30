import { AffiliateConfig, WhatsAppChannel, OfferPostTemplate, DispatchedOffer, AutoSchedulerConfig, MercadoLivreProduct, Subscriber, AdminNotification, PriceAlertRule, MLMonitorConfig } from '../types';

export interface RestoreHistoryItem {
  id: string;
  timestamp: string;
  restoreMode: 'REPLACE' | 'MERGE';
  fileName: string;
  exportDate?: string;
  channelsCount: number;
  templatesCount: number;
  alertsCount: number;
  dispatchesCount: number;
}

export interface AppBackupData {
  version: string;
  exportDate: string;
  timestamp: number;
  appName: string;
  affiliateConfig?: AffiliateConfig;
  channels?: WhatsAppChannel[];
  templates?: OfferPostTemplate[];
  dispatchedLogs?: DispatchedOffer[];
  schedulerConfig?: AutoSchedulerConfig;
  mlMonitorConfig?: MLMonitorConfig;
  products?: MercadoLivreProduct[];
  subscribers?: Subscriber[];
  adminNotifications?: AdminNotification[];
  priceAlerts?: PriceAlertRule[];
  localStorageKeys?: Record<string, string>;
}

/**
 * Collects all current state and local storage keys into a single structured Backup object
 */
export function createBackupObject(data: {
  affiliateConfig?: AffiliateConfig;
  channels?: WhatsAppChannel[];
  templates?: OfferPostTemplate[];
  dispatchedLogs?: DispatchedOffer[];
  schedulerConfig?: AutoSchedulerConfig;
  mlMonitorConfig?: MLMonitorConfig;
  products?: MercadoLivreProduct[];
  subscribers?: Subscriber[];
  adminNotifications?: AdminNotification[];
  priceAlerts?: PriceAlertRule[];
}): AppBackupData {
  const localStorageKeys: Record<string, string> = {};
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('importhourando_') || key.startsWith('ofertastop_'))) {
          const val = localStorage.getItem(key);
          if (val) {
            localStorageKeys[key] = val;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read localStorage keys for backup:', e);
    }
  }

  const now = new Date();
  return {
    version: '1.0.0',
    exportDate: now.toLocaleString('pt-BR'),
    timestamp: now.getTime(),
    appName: 'IMPORTHOURANDO - Automação & Afiliados',
    affiliateConfig: data.affiliateConfig,
    channels: data.channels,
    templates: data.templates,
    dispatchedLogs: data.dispatchedLogs,
    schedulerConfig: data.schedulerConfig,
    mlMonitorConfig: data.mlMonitorConfig,
    products: data.products,
    subscribers: data.subscribers,
    adminNotifications: data.adminNotifications,
    priceAlerts: data.priceAlerts,
    localStorageKeys
  };
}

/**
 * Triggers a file download in browser for the JSON backup object
 */
export function downloadBackupFile(backup: AppBackupData) {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `importhourando_backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates whether a parsed object is a valid AppBackupData file
 */
export function validateBackupJson(jsonObj: any): { isValid: boolean; error?: string; backup?: AppBackupData } {
  if (!jsonObj || typeof jsonObj !== 'object') {
    return { isValid: false, error: 'O arquivo selecionado não é um JSON válido.' };
  }

  if (!jsonObj.appName && !jsonObj.affiliateConfig && !jsonObj.channels && !jsonObj.templates && !jsonObj.localStorageKeys) {
    return { isValid: false, error: 'O arquivo JSON não contém estrutura reconhecida de backup do IMPORTHOURANDO.' };
  }

  return { isValid: true, backup: jsonObj as AppBackupData };
}

/**
 * Retrieves restore history from localStorage
 */
export function getRestoreHistory(): RestoreHistoryItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem('importhourando_restore_history');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse restore history:', e);
  }
  return [];
}

/**
 * Adds a new restore entry to history
 */
export function addRestoreHistoryItem(item: Omit<RestoreHistoryItem, 'id' | 'timestamp'>): RestoreHistoryItem[] {
  const history = getRestoreHistory();
  const newItem: RestoreHistoryItem = {
    ...item,
    id: `rst_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleString('pt-BR')
  };

  const updated = [newItem, ...history].slice(0, 20); // Keep max 20 history items
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('importhourando_restore_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save restore history:', e);
    }
  }
  return updated;
}

/**
 * Clears restore history from localStorage
 */
export function clearRestoreHistory(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem('importhourando_restore_history');
    } catch (e) {
      console.warn('Failed to clear restore history:', e);
    }
  }
}

/**
 * Persists all backup keys back into localStorage
 */
export function applyBackupToLocalStorage(backup: AppBackupData, mode: 'REPLACE' | 'MERGE' = 'REPLACE', fileName: string = 'backup.json') {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    if (backup.localStorageKeys) {
      Object.entries(backup.localStorageKeys).forEach(([key, val]) => {
        localStorage.setItem(key, val);
      });
    }

    if (backup.affiliateConfig) {
      localStorage.setItem('importhourando_affiliate_config', JSON.stringify(backup.affiliateConfig));
    }
    if (backup.channels) {
      localStorage.setItem('importhourando_channels', JSON.stringify(backup.channels));
    }
    if (backup.templates) {
      localStorage.setItem('importhourando_templates', JSON.stringify(backup.templates));
    }
    if (backup.schedulerConfig) {
      localStorage.setItem('importhourando_scheduler_config', JSON.stringify(backup.schedulerConfig));
    }
    if (backup.mlMonitorConfig) {
      localStorage.setItem('importhourando_ml_monitor_config', JSON.stringify(backup.mlMonitorConfig));
    }
    if (backup.priceAlerts) {
      localStorage.setItem('importhourando_price_alerts', JSON.stringify(backup.priceAlerts));
    }
    if (backup.products) {
      localStorage.setItem('importhourando_products', JSON.stringify(backup.products));
    }
    if (backup.dispatchedLogs) {
      localStorage.setItem('importhourando_dispatches', JSON.stringify(backup.dispatchedLogs));
    }
    
    // Save backup timestamp
    localStorage.setItem('importhourando_last_backup_imported', new Date().toISOString());

    // Record in history log
    addRestoreHistoryItem({
      restoreMode: mode,
      fileName,
      exportDate: backup.exportDate,
      channelsCount: backup.channels?.length || 0,
      templatesCount: backup.templates?.length || 0,
      alertsCount: backup.priceAlerts?.length || 0,
      dispatchesCount: backup.dispatchedLogs?.length || 0
    });
  } catch (e) {
    console.error('Error applying backup to localStorage:', e);
  }
}
