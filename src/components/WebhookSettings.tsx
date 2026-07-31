import React, { useState } from 'react';
import { Send, CheckCircle2, XCircle, Loader2, Globe, Zap, ShieldCheck } from 'lucide-react';

export interface WebhookSettingsProps {
  initialUrl?: string;
  initialEvent?: 'copy.generated' | 'user.registered' | 'user.login';
  onSave?: (config: { url: string; event: string }) => void;
}

export const WebhookSettings: React.FC<WebhookSettingsProps> = ({
  initialUrl = '',
  initialEvent = 'copy.generated',
  onSave
}) => {
  const [destinationUrl, setDestinationUrl] = useState<string>(initialUrl);
  const [triggerEvent, setTriggerEvent] = useState<'copy.generated' | 'user.registered' | 'user.login'>(initialEvent);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    statusText: string;
    statusCode?: number;
    timestamp: string;
    details?: string;
  } | null>(null);

  // Generate realistic sample payload based on selected trigger event
  const getSamplePayload = (event: 'copy.generated' | 'user.registered' | 'user.login') => {
    const timestamp = new Date().toISOString();
    switch (event) {
      case 'copy.generated':
        return {
          event: 'copy.generated',
          timestamp,
          app: 'IMPORTHOURANDO',
          data: {
            productTitle: 'Smartwatch Ultra Pro Waterproof V9',
            productPrice: 189.90,
            niche: 'Eletrônicos & Tecnologia',
            copy: '🚀 OFERTA IMPERDÍVEL! O Smartwatch Ultra Pro V9 chegou com bateria de longa duração, monitoramento cardíaco e resistência à água. Garanta o seu com FRETE GRÁTIS hoje mesmo!'
          }
        };
      case 'user.registered':
        return {
          event: 'user.registered',
          timestamp,
          app: 'IMPORTHOURANDO',
          data: {
            user: {
              id: 'usr_' + Math.random().toString(36).substring(2, 9),
              name: 'Cliente Exemplo',
              email: 'cliente.exemplo@email.com',
              phone: '+5511999998888',
              status: 'ACTIVE'
            }
          }
        };
      case 'user.login':
        return {
          event: 'user.login',
          timestamp,
          app: 'IMPORTHOURANDO',
          data: {
            user: {
              name: 'Cliente Exemplo',
              email: 'cliente.exemplo@email.com',
              role: 'SUBSCRIBER'
            },
            provider: 'EMAIL_PASSWORD'
          }
        };
      default:
        return { event, timestamp, app: 'IMPORTHOURANDO' };
    }
  };

  const handleTestWebhook = async () => {
    if (!destinationUrl.trim()) {
      setTestResult({
        success: false,
        statusText: 'Por favor, insira uma URL de destino válida.',
        timestamp: new Date().toLocaleTimeString()
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const payload = getSamplePayload(triggerEvent);

    try {
      // First attempt direct backend test dispatch endpoint, fallback to client fetch
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: destinationUrl.trim(),
          event: triggerEvent,
          payload
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: data.success ?? true,
          statusText: data.message || `Webhook disparado com sucesso! Código HTTP ${data.statusCode || 200}`,
          statusCode: data.statusCode || 200,
          timestamp: new Date().toLocaleTimeString(),
          details: data.responseBody || 'Payload entregue e confirmado pelo receptor.'
        });
      } else {
        // Direct browser fetch backup
        const clientRes = await fetch(destinationUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-ImportHourando-Event': triggerEvent
          },
          body: JSON.stringify(payload)
        }).catch(err => ({ ok: false, status: 0, statusText: err.message || 'Erro de Conexão/CORS' }));

        if ('ok' in clientRes && clientRes.ok) {
          setTestResult({
            success: true,
            statusText: `Sucesso ao entregar webhook! Status HTTP ${clientRes.status}`,
            statusCode: clientRes.status,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          setTestResult({
            success: false,
            statusText: `Falha na entrega do webhook: ${'statusText' in clientRes ? clientRes.statusText : 'Sem resposta do servidor receptor'}`,
            statusCode: 'status' in clientRes ? (clientRes as any).status : 0,
            timestamp: new Date().toLocaleTimeString(),
            details: 'Certifique-se de que a URL aceita requisições HTTP POST e possui permissões CORS ativas.'
          });
        }
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        statusText: `Erro na execução do teste: ${error.message || 'Erro desconhecido'}`,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsTesting(false);
      if (onSave) {
        onSave({ url: destinationUrl.trim(), event: triggerEvent });
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">Configuração de Webhook</h3>
          <p className="text-[11px] text-slate-500">Envie notificações em tempo real para URLs externas</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. Destination URL Input */}
        <div>
          <label htmlFor="webhook-url-input" className="block text-xs font-bold text-slate-700 mb-1">
            URL de Destino
          </label>
          <div className="relative">
            <input
              id="webhook-url-input"
              type="url"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://sua-api.com/webhook/endpoint"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
            />
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* 2. Trigger Event Selection */}
        <div>
          <label htmlFor="webhook-event-select" className="block text-xs font-bold text-slate-700 mb-1">
            Seleção de Evento Gatilho
          </label>
          <div className="relative">
            <select
              id="webhook-event-select"
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value as any)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all cursor-pointer"
            >
              <option value="copy.generated">copy.generated (Geração de Copy com IA)</option>
              <option value="user.registered">user.registered (Novo Cadastro de Usuário)</option>
              <option value="user.login">user.login (Autenticação / Login)</option>
            </select>
            <Zap className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
          </div>
        </div>

        {/* 3. Test Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={isTesting || !destinationUrl.trim()}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Disparando Webhook...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Testar Disparo de Webhook</span>
              </>
            )}
          </button>
        </div>

        {/* Test Result Display Badge */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in zoom-in-95 duration-200 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center space-x-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{testResult.success ? 'Webhook Entregue' : 'Falha na Entrega'}</span>
              </div>
              <span className="text-[10px] opacity-70">{testResult.timestamp}</span>
            </div>
            <p className="text-[11px] leading-relaxed">{testResult.statusText}</p>
            {testResult.details && (
              <p className="text-[10px] opacity-80 pt-1 border-t border-slate-200/50 font-mono">
                {testResult.details}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
        <div className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Sincronização Segura HTTPS</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">Payload: JSON UTF-8</span>
      </div>
    </div>
  );
};
