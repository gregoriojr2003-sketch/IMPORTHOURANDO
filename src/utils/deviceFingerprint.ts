/**
 * Utility to generate or retrieve a persistent client device fingerprint
 * based on browser characteristics, screen dimensions, time zone, and local storage ID.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server_render';

  const STORAGE_KEY = 'importhourando_device_fp_v1';
  let storedFp = localStorage.getItem(STORAGE_KEY);

  if (!storedFp) {
    const ua = navigator.userAgent || '';
    const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}`;
    const tz = new Date().getTimezoneOffset();
    const lang = navigator.language || '';
    const platform = navigator.platform || '';
    const randomSeed = Math.random().toString(36).substring(2, 9);

    const rawStr = `${ua}|${screenInfo}|${tz}|${lang}|${platform}|${randomSeed}`;
    
    // DJB2 Hash implementation
    let hash = 5381;
    for (let i = 0; i < rawStr.length; i++) {
      hash = (hash * 33) ^ rawStr.charCodeAt(i);
    }
    const hashStr = Math.abs(hash).toString(36);
    
    storedFp = `devfp_${hashStr}_${Date.now().toString(36)}`;
    try {
      localStorage.setItem(STORAGE_KEY, storedFp);
    } catch (e) {
      console.warn('LocalStorage unavailable for device fingerprint:', e);
    }
  }

  return storedFp;
}
