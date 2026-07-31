export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number | null;
  statusText: string | null;
  durationMs: number;
  errorType: 'NONE' | 'NETWORK_OR_CORS' | 'TIMEOUT' | 'HTTP_ERROR';
  errorMessage: string | null;
  requestBody?: string | null;
  responseSnippet?: string | null;
}

type LogListener = (logs: ApiLogEntry[]) => void;

let apiLogs: ApiLogEntry[] = [];
const listeners: Set<LogListener> = new Set();
let isIntercepted = false;

export function getApiLogs(): ApiLogEntry[] {
  return [...apiLogs];
}

export function subscribeApiLogs(listener: LogListener): () => void {
  listeners.add(listener);
  listener([...apiLogs]);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  const logsCopy = [...apiLogs];
  listeners.forEach((fn) => fn(logsCopy));
}

export function clearApiLogs() {
  apiLogs = [];
  notifyListeners();
}

/**
 * Patches global window.fetch once to capture /api/ network calls and diagnose
 * CORS, timeouts, server errors, or invalid endpoints in real time.
 */
export function setupFetchInterceptor() {
  if (isIntercepted || typeof window === 'undefined' || !window.fetch) return;
  isIntercepted = true;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const resource = args[0];
    const config = args[1] || {};
    
    const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : String(resource));
    const method = (config.method || (resource instanceof Request ? resource.method : 'GET')).toUpperCase();

    // Only log relative or absolute /api/ calls
    const isApiCall = url.includes('/api/');
    if (!isApiCall) {
      return originalFetch.apply(this, args);
    }

    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const startTime = performance.now();
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0');

    let reqBodyStr: string | null = null;
    if (config.body) {
      try {
        reqBodyStr = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
      } catch (e) {
        reqBodyStr = '[Complex Body]';
      }
    }

    try {
      const response = await originalFetch.apply(this, args);
      const durationMs = Math.round(performance.now() - startTime);

      let responseSnippet: string | null = null;
      try {
        const cloned = response.clone();
        const text = await cloned.text();
        responseSnippet = text.length > 200 ? text.substring(0, 200) + '...' : text;
      } catch (e) {
        responseSnippet = '[Não foi possível ler resposta]';
      }

      const logEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        errorType: response.ok ? 'NONE' : 'HTTP_ERROR',
        errorMessage: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
        requestBody: reqBodyStr,
        responseSnippet
      };

      // Add to logs (max 100 entries)
      apiLogs.unshift(logEntry);
      if (apiLogs.length > 100) apiLogs.pop();
      notifyListeners();

      // Also log structured output in browser console for debugging
      if (!response.ok) {
        console.warn(`[API DIAGNOSTIC] ${method} ${url} -> Status ${response.status} (${durationMs}ms)`, logEntry);
      } else {
        console.log(`[API DIAGNOSTIC] ${method} ${url} -> Status ${response.status} (${durationMs}ms)`);
      }

      return response;
    } catch (error: any) {
      const durationMs = Math.round(performance.now() - startTime);
      let errorType: 'NETWORK_OR_CORS' | 'TIMEOUT' = 'NETWORK_OR_CORS';
      let errorMessage = error?.message || 'Falha de conexão / CORS / Servidor Inacessível';

      if (error?.name === 'AbortError' || errorMessage.toLowerCase().includes('timeout') || errorMessage.toLowerCase().includes('aborted')) {
        errorType = 'TIMEOUT';
        errorMessage = 'Tempo limite excedido (Timeout)';
      } else if (errorMessage.toLowerCase().includes('failed to fetch') || errorMessage.toLowerCase().includes('network error')) {
        errorType = 'NETWORK_OR_CORS';
        errorMessage = 'Falha de Rede ou Bloqueio de CORS / Servidor offline';
      }

      const logEntry: ApiLogEntry = {
        id,
        timestamp,
        method,
        url,
        status: null,
        statusText: null,
        durationMs,
        errorType,
        errorMessage,
        requestBody: reqBodyStr,
        responseSnippet: null
      };

      apiLogs.unshift(logEntry);
      if (apiLogs.length > 100) apiLogs.pop();
      notifyListeners();

      console.error(`[API DIAGNOSTIC FAIL] ${method} ${url} -> ${errorMessage} (${durationMs}ms)`, logEntry);

      throw error;
    }
  };
}

/**
 * Runs a quick set of diagnostic tests against /api/ endpoints to verify server status, CORS, and endpoint latency.
 */
export async function runSelfDiagnostic() {
  const results = {
    healthCheck: false,
    healthLatency: 0,
    corsOk: false,
    details: [] as string[]
  };

  const start = performance.now();
  try {
    const res = await fetch('/api/health', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
    results.healthLatency = Math.round(performance.now() - start);
    if (res.ok) {
      results.healthCheck = true;
      results.corsOk = true;
      results.details.push(`✓ GET /api/health repondeu com status ${res.status} em ${results.healthLatency}ms.`);
    } else {
      results.details.push(`✕ GET /api/health respondeu com código de erro ${res.status}.`);
    }
  } catch (err: any) {
    results.details.push(`✕ Falha ao conectar em /api/health: ${err?.message || 'Erro de rede ou CORS'}.`);
  }

  return results;
}
