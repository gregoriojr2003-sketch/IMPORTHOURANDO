import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  RefreshCw, 
  AlertOctagon, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Trash2, 
  Copy, 
  Check, 
  Terminal, 
  Server, 
  HelpCircle,
  Play
} from 'lucide-react';
import { ApiLogEntry, getApiLogs, subscribeApiLogs, clearApiLogs, runSelfDiagnostic } from '../utils/apiLogger';

interface NetworkDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkDiagnosticsModal: React.FC<NetworkDiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ERRORS' | 'SUCCESS'>('ALL');
  const [selectedLog, setSelectedLog] = useState<ApiLogEntry | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{ healthCheck: boolean; healthLatency: number; corsOk: boolean; details: string[] } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLogs(getApiLogs());
    const unsubscribe = subscribeApiLogs((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ERRORS') return log.errorType !== 'NONE';
    if (filter === 'SUCCESS') return log.errorType === 'NONE';
    return true;
  });

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setTestResults(null);
    try {
      const res = await runSelfDiagnostic();
      setTestResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyReport = () => {
    const reportText = [
      `=== RELATÓRIO DE DIAGNÓSTICO DE REDE ===`,
      `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
      `Navegador Online: ${navigator.onLine ? 'SIM' : 'NÃO'}`,
      `URL Atual: ${window.location.href}`,
      `Total de Chamadas Registradas: ${logs.length}`,
      `Total de Erros Registrados: ${logs.filter(l => l.errorType !== 'NONE').length}`,
      `\n--- RECENT API LOGS ---`,
      ...logs.map(l => `[${l.timestamp}] ${l.method} ${l.url} -> Status: ${l.status ?? 'FALHA DE REDE'} (${l.durationMs}ms) | Erro: ${l.errorMessage || 'Nenhum'}`)
    ].join('\n');

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Painel Diagnosticador de Rede & Comunicação API
              </h3>
              <p className="text-xs text-slate-400">
                Monitoramento em tempo real de requisições /api/, CORS, e status de conectividade do servidor
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Diagnostic Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setFilter('ERRORS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'ERRORS'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Apenas Erros ({logs.filter(l => l.errorType !== 'NONE').length})
            </button>
            <button
              onClick={() => setFilter('SUCCESS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'SUCCESS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Sucesso ({logs.filter(l => l.errorType === 'NONE').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDiagnostic}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão /api/health'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Relatório'}</span>
            </button>

            <button
              onClick={clearApiLogs}
              title="Limpar logs da sessão"
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 text-slate-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Self Diagnostic Result Banner if triggered */}
        {testResults && (
          <div className={`p-4 border-b text-xs flex items-start gap-3 ${
            testResults.healthCheck ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            {testResults.healthCheck ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-sm mb-1">
                {testResults.healthCheck
                  ? `Servidor /api/ respondendo normalmente (${testResults.healthLatency}ms)`
                  : 'Falha na verificação de conectividade do servidor'}
              </p>
              <ul className="space-y-1 list-disc list-inside font-mono text-[11px] text-slate-700">
                {testResults.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Log Table / List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-900 font-mono text-xs text-slate-200 min-h-[250px]">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <Terminal className="w-10 h-10 mb-2 stroke-1" />
              <p className="font-sans font-medium text-sm">Nenhuma requisição API capturada ainda.</p>
              <p className="font-sans text-xs text-slate-600 mt-1">Realize ações no aplicativo ou clique em "Testar Conexão".</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isError = log.errorType !== 'NONE';
              const isSelected = selectedLog?.id === log.id;

              return (
                <div key={log.id} className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <div
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isError
                        ? 'bg-red-950/30 hover:bg-red-950/50 border-l-4 border-l-red-500'
                        : 'hover:bg-slate-800/50 border-l-4 border-l-emerald-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        log.method === 'GET' ? 'bg-blue-900/60 text-blue-300' :
                        log.method === 'POST' ? 'bg-purple-900/60 text-purple-300' :
                        'bg-amber-900/60 text-amber-300'
                      }`}>
                        {log.method}
                      </span>

                      <span className="font-semibold text-slate-200 truncate">{log.url}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400">{log.durationMs}ms</span>

                      {log.status ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          log.status >= 200 && log.status < 300
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {log.status} {log.statusText}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-900/80 text-white animate-pulse">
                          FALHA DE REDE / CORS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isSelected && (
                    <div className="p-4 bg-slate-900 border-t border-slate-800 text-[11px] space-y-3 font-mono text-slate-300 animate-fade-in">
                      {log.errorMessage && (
                        <div>
                          <span className="text-red-400 font-bold block mb-1">Mensagem de Erro:</span>
                          <div className="p-2 bg-red-950/40 text-red-300 rounded border border-red-900/50">
                            {log.errorMessage}
                          </div>
                        </div>
                      )}

                      {log.requestBody && (
                        <div>
                          <span className="text-slate-400 font-bold block mb-1">Payload Enviado (Request Body):</span>
                          <pre className="p-2 bg-slate-950 rounded text-slate-300 overflow-x-auto border border-slate-800">
                            {log.requestBody}
                          </pre>
                        </div>
                      )}

                      {log.responseSnippet && (
                        <div>
                          <span className="text-slate-400 font-bold block mb-1">Resposta do Servidor (Response Body):</span>
                          <pre className="p-2 bg-slate-950 rounded text-slate-300 overflow-x-auto border border-slate-800">
                            {log.responseSnippet}
                          </pre>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
                        <span>ID: {log.id}</span>
                        <span>Tipo de Erro: {log.errorType}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Diagnostic Guidance */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              O interceptador analisa automaticamente falhas de CORS, restrições de proxy e respostas HTTP do Node/Express.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all text-xs"
          >
            Fechar Diagnóstico
          </button>
        </div>

      </div>
    </div>
  );
};
