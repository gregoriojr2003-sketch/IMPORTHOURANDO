import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Server, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { NetworkDiagnosticsModal } from './NetworkDiagnosticsModal';

interface SyncStatusIndicatorProps {
  className?: string;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'connected' | 'checking' | 'error' | 'offline'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isDiagModalOpen, setIsDiagModalOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      setLatency(null);
      setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
      return;
    }

    setStatus('checking');

    // Perform up to 2 attempts with backoff before declaring network error
    for (let attempt = 1; attempt <= 2; attempt++) {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for container startup

        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const endTime = performance.now();
          const measuredLatency = Math.round(endTime - startTime);
          setStatus('connected');
          setLatency(measuredLatency);
          setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
          return;
        }
      } catch (err) {
        if (attempt < 2) {
          // Wait 600ms before retrying second ping
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }

    setStatus('error');
    setLatency(null);
    setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
  }, []);

  // Initial check & interval
  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      checkConnection();
    }, 15000); // Ping server every 15 seconds

    const handleOnline = () => {
      checkConnection();
    };

    const handleOffline = () => {
      setStatus('offline');
      setLatency(null);
      setLastCheckTime(new Date().toLocaleTimeString('pt-BR'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  return (
    <div className={`relative ${className}`} ref={popoverRef}>
      {/* Trigger Badge Button in Header */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95 cursor-pointer shadow-xs ${
          status === 'connected'
            ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
            : status === 'checking'
            ? 'bg-blue-500/20 border-blue-400/40 text-blue-200 hover:bg-blue-500/30'
            : 'bg-red-500/25 border-red-400/60 text-red-200 hover:bg-red-500/40 animate-pulse'
        }`}
        title="Clique para ver o Status de Sincronização em Tempo Real com o Servidor"
      >
        {status === 'connected' && (
          <>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline">Sync:</span>
            <span className="font-mono text-emerald-300">
              {latency ? `${latency}ms` : 'ON'}
            </span>
          </>
        )}

        {status === 'checking' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-blue-300 animate-spin shrink-0" />
            <span className="hidden md:inline">Sincronizando...</span>
          </>
        )}

        {(status === 'error' || status === 'offline') && (
          <>
            <WifiOff className="w-3.5 h-3.5 text-red-300 shrink-0" />
            <span className="font-extrabold text-red-200">
              {status === 'offline' ? 'Sem Internet' : 'Falha na Rede'}
            </span>
          </>
        )}
      </button>

      {/* Popover Card Details */}
      {isPopoverOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn text-slate-800 dark:text-slate-100 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-[#2D3277] dark:text-blue-400" />
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                Status de Sincronização
              </h4>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          {/* Status Message */}
          <div className="space-y-2">
            {status === 'connected' && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Conexão com Servidor Ativa</span>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug">
                    A automação de ofertas e o robô IMPORTHOURANDO estão online e respondendo perfeitamente.
                  </p>
                </div>
              </div>
            )}

            {status === 'checking' && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex items-start space-x-2.5">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Testando Conexão com o Servidor...</span>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-snug">
                    Verificando os serviços de disparo e rotas de automação no momento.
                  </p>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'offline') && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {status === 'offline' ? 'Sem Conexão com a Internet' : 'Falha na Conexão de Rede'}
                  </span>
                  <p className="text-[11px] text-red-800 dark:text-red-300 leading-snug">
                    Não foi possível se comunicar com o servidor de automação. Verifique a sua conexão de rede.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Servidor Engine:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Express / Cloud Engine</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Latência do Ping:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {latency ? `${latency} ms` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Última Checagem:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {lastCheckTime || 'Agora'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Criptografia HTTPS</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Segura</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={checkConnection}
              disabled={status === 'checking'}
              className="w-full py-2 px-3 rounded-xl bg-[#2D3277] hover:bg-indigo-900 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
              <span>Testar Conexão Agora</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPopoverOpen(false);
                setIsDiagModalOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Painel Diagnóstico de Logs API</span>
            </button>
          </div>
        </div>
      )}

      <NetworkDiagnosticsModal
        isOpen={isDiagModalOpen}
        onClose={() => setIsDiagModalOpen(false)}
      />
    </div>
  );
};
