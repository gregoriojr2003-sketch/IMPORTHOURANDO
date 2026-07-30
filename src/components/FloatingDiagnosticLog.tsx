import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  X, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  Minimize2, 
  Maximize2, 
  RefreshCw,
  WifiOff,
  Code
} from 'lucide-react';
import { ApiLogEntry, getApiLogs, subscribeApiLogs, clearApiLogs, runSelfDiagnostic } from '../utils/apiLogger';

export const FloatingDiagnosticLog: React.FC = () => {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [filter, setFilter] = useState<'ERRORS_ONLY' | 'ALL' | 'TIMEOUTS'>('ERRORS_ONLY');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    setLogs(getApiLogs());
    const unsubscribe = subscribeApiLogs((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const errors = logs.filter(l => l.errorType !== 'NONE');
  const timeouts = logs.filter(l => l.errorType === 'TIMEOUT');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ERRORS_ONLY') return log.errorType !== 'NONE';
    if (filter === 'TIMEOUTS') return log.errorType === 'TIMEOUT';
    return true;
  });

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setTestMessage(null);
    try {
      const res = await runSelfDiagnostic();
      if (res.healthCheck) {
        setTestMessage(`✓ Servidor online (${res.healthLatency}ms)`);
      } else {
        setTestMessage(`✕ Falha no servidor /api/health`);
      }
    } catch (e: any) {
      setTestMessage(`✕ Erro ao testar rede: ${e?.message || 'Erro desconhecido'}`);
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestMessage(null), 4000);
    }
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };

  // If user has hidden/closed the widget completely, show floating badge button at bottom-right
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-xl border text-xs font-semibold font-mono transition-all transform hover:scale-105 active:scale-95 ${
            errors.length > 0
              ? 'bg-rose-950/90 text-rose-200 border-rose-700/60 hover:bg-rose-900 shadow-rose-950/40 animate-pulse'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800 shadow-slate-950/40'
          }`}
          title="Abrir Painel de Log de Diagnóstico de Rede"
        >
          <Terminal className={`w-4 h-4 ${errors.length > 0 ? 'text-rose-400' : 'text-indigo-400'}`} />
          <span>Log de Diagnóstico</span>
          {errors.length > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-600 text-white">
              {errors.length} {errors.length === 1 ? 'erro' : 'erros'}
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </div>
    );
  }

  // If minimized state inside open mode
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl p-3 flex items-center justify-between gap-4 font-mono text-xs max-w-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
            <div className="truncate">
              <span className="font-bold text-slate-200">Log de Diagnóstico</span>
              <span className="text-[11px] text-slate-400 block truncate">
                {errors.length > 0 ? `${errors.length} erros detectados` : `${logs.length} requisições capturadas`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Expandir Painel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
              title="Ocultar Widget"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md sm:max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl text-slate-200 overflow-hidden font-sans flex flex-col max-h-[80vh] transition-all animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white flex items-center gap-2">
              Log de Diagnóstico de Rede
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h4>
            <p className="text-[10px] text-slate-400">
              Captura em tempo real de requisições /api/, HTTP status e timeouts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRunDiagnostic}
            disabled={isTesting}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors flex items-center gap-1"
            title="Testar Conexão com /api/health"
          >
            <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Testar</span>
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Minimizar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors"
            title="Ocultar Painel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar & Actions */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilter('ERRORS_ONLY')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              filter === 'ERRORS_ONLY'
                ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Erros ({errors.length})
          </button>
          <button
            onClick={() => setFilter('TIMEOUTS')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              filter === 'TIMEOUTS'
                ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Timeouts ({timeouts.length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({logs.length})
          </button>
        </div>

        <button
          onClick={clearApiLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-1 text-slate-400 hover:text-rose-400 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors px-2 py-1 rounded hover:bg-rose-950/40"
          title="Limpar todos os logs"
        >
          <Trash2 className="w-3 h-3" />
          <span>Limpar Logs</span>
        </button>
      </div>

      {testMessage && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/50 px-3 py-1.5 text-[11px] font-mono text-indigo-200 flex items-center justify-between">
          <span>{testMessage}</span>
        </div>
      )}

      {/* Log Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[360px] font-mono text-xs divide-y divide-slate-800/60">
        {filteredLogs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 font-sans text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/40 mb-2" />
            <p className="font-medium text-slate-400">
              {filter === 'ERRORS_ONLY'
                ? 'Nenhum erro de rede capturado.'
                : filter === 'TIMEOUTS'
                ? 'Nenhum timeout de requisição.'
                : 'Nenhum log de API disponível.'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              As chamadas para /api/ são monitoradas automaticamente em tempo real.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isError = log.errorType !== 'NONE';
            const isExpanded = expandedLogId === log.id;

            let statusBadgeClass = 'bg-emerald-950 text-emerald-400 border-emerald-800/50';
            let statusText = `${log.status || 200} OK`;

            if (log.errorType === 'TIMEOUT') {
              statusBadgeClass = 'bg-amber-950 text-amber-300 border-amber-800/60';
              statusText = 'TIMEOUT (5s)';
            } else if (log.errorType === 'NETWORK_OR_CORS') {
              statusBadgeClass = 'bg-purple-950 text-purple-300 border-purple-800/60';
              statusText = 'REDE / CORS';
            } else if (log.errorType === 'HTTP_ERROR') {
              statusBadgeClass = 'bg-rose-950 text-rose-300 border-rose-800/60';
              statusText = `HTTP ${log.status || 'ERRO'}`;
            }

            return (
              <div
                key={log.id}
                className={`pt-2 first:pt-0 rounded-lg p-2 transition-colors ${
                  isError ? 'bg-rose-950/20 hover:bg-rose-950/30 border border-rose-900/30' : 'hover:bg-slate-900/60'
                }`}
              >
                <div 
                  onClick={() => toggleExpandLog(log.id)}
                  className="flex items-start justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 shrink-0">
                      {log.method}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${statusBadgeClass}`}
                    >
                      {statusText}
                    </span>
                    <span className="text-slate-300 truncate font-semibold" title={log.url}>
                      {log.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-0.5 text-slate-500">
                      <Clock className="w-3 h-3" />
                      {log.durationMs}ms
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>

                {log.errorMessage && (
                  <div className="mt-1 text-[11px] text-rose-300 flex items-center gap-1 pl-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">{log.errorMessage}</span>
                  </div>
                )}

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5 text-slate-300 bg-slate-950/80 p-2 rounded">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">URL Completa:</span>
                      <code className="text-indigo-300 break-all">{log.url}</code>
                    </div>

                    {log.requestBody && (
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Corpo da Requisição:</span>
                        <pre className="text-slate-400 bg-slate-900 p-1.5 rounded overflow-x-auto text-[10px]">
                          {log.requestBody}
                        </pre>
                      </div>
                    )}

                    {log.responseSnippet && (
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Resposta do Servidor:</span>
                        <pre className="text-emerald-300/80 bg-slate-900 p-1.5 rounded overflow-x-auto text-[10px]">
                          {log.responseSnippet}
                        </pre>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                      <span>ID da Chamada: {log.id}</span>
                      <span>Tipo: {log.errorType}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
        <span>Total Logs: {logs.length} | Erros: {errors.length}</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Ocultar Painel
        </button>
      </div>
    </div>
  );
};
