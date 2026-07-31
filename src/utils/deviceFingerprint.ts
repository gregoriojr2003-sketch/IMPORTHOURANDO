/**
 * Advanced Device Fingerprinting Utility
 * Computes a deterministic hardware & canvas fingerprint that remains constant
 * across browser sessions, clearing cache, incognito mode, and private browsing.
 * Syncs fingerprint across localStorage, sessionStorage, and document.cookie.
 */

function getCanvasSignature(): string {
  if (typeof document === 'undefined') return 'no_doc';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_ctx';

    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial", "Helvetica", sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('IMPORTHOURANDO_ANTI_STEALTH_FINGERPRINT_2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('IMPORTHOURANDO_ANTI_STEALTH_FINGERPRINT_2026', 4, 17);

    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  } catch (e) {
    return 'canvas_fallback';
  }
}

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server_render';

  const STORAGE_KEY = 'importhourando_device_fp_v2';

  // 1. Try reading from localStorage, sessionStorage, or document.cookie
  let storedFp: string | null = null;
  try {
    storedFp = localStorage.getItem(STORAGE_KEY);
  } catch (_) {}

  if (!storedFp) {
    try {
      storedFp = sessionStorage.getItem(STORAGE_KEY);
    } catch (_) {}
  }

  if (!storedFp) {
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + STORAGE_KEY + '=([^;]*)'));
      if (match) storedFp = decodeURIComponent(match[1]);
    } catch (_) {}
  }

  // 2. Deterministic hardware signature calculation (constant across incognito & clear storage)
  const ua = navigator.userAgent || '';
  const screenInfo = `${window.screen?.width || 0}x${window.screen?.height || 0}x${window.screen?.colorDepth || 0}x${window.devicePixelRatio || 1}`;
  const tz = new Date().getTimezoneOffset();
  const lang = navigator.language || '';
  const platform = navigator.platform || '';
  const cores = (navigator as any).hardwareConcurrency || 0;
  const memory = (navigator as any).deviceMemory || 0;
  const canvasHash = getCanvasSignature();

  const rawStr = `${canvasHash}|${ua}|${screenInfo}|${tz}|${lang}|${platform}|cpu_${cores}|ram_${memory}`;

  let hash = 5381;
  for (let i = 0; i < rawStr.length; i++) {
    hash = (hash * 33) ^ rawStr.charCodeAt(i);
  }
  const hwHashStr = Math.abs(hash).toString(36);
  const deterministicFp = `devfp_${hwHashStr}`;

  const finalFp = storedFp || deterministicFp;

  // 3. Persist and sync across all 3 client storage layers
  try {
    localStorage.setItem(STORAGE_KEY, finalFp);
  } catch (_) {}
  try {
    sessionStorage.setItem(STORAGE_KEY, finalFp);
  } catch (_) {}
  try {
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(finalFp)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (_) {}

  return finalFp;
}
