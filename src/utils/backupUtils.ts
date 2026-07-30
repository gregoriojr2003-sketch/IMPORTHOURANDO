import { AffiliateConfig, WhatsAppChannel, OfferPostTemplate, DispatchedOffer, AutoSchedulerConfig, MercadoLivreProduct, Subscriber, AdminNotification, PriceAlertRule, MLMonitorConfig } from '../types';

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
 * Persists all backup keys back into localStorage
 */
export function applyBackupToLocalStorage(backup: AppBackupData) {
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
  } catch (e) {
    console.error('Error applying backup to localStorage:', e);
  }
}
