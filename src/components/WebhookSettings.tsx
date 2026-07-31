import React, { useState } from 'react';
import { Webhook, Send, CheckCircle2, XCircle, Clock, Shield, AlertCircle, Plus, Trash2, Globe, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { WebhookConfig } from '../types';

interface WebhookSettingsProps {
  webhooks?: WebhookConfig[];
  onSaveWebhooks?: (webhooks: WebhookConfig[]) => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const WebhookSettings: React.FC<WebhookSettingsProps> = ({
  webhooks = [],
  onSaveWebhooks,
  onRequirePlanActivation
}) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [name, setName] = useState('Webhook Principal - N8N / Zapier');
  const [selectedEvent, setSelectedEvent] = useState<string>('copy.generated');
  const [secretToken, setSecretToken] = useState('');
  
  // Test Dispatch state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: number;
    message: string;
    responseTimeMs?: number;
    payloadSent?: any;
    responseBody?: string;
  } | null>(null);

  // Local list state
  const [localList, setLocalList] = useState<WebhookConfig[]>(webhooks);

  const handleTestWebhook = async () => {
    if (!targetUrl.trim()) {
      setTestResult({
        success: false,
        status: 400,
        message: 'Por favor, informe a URL de Destino (Endpoint HTTP POST) do Webhook.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const startTime = performance.now();
    const payload = {
      event: selectedEvent,
      timestamp: new Date().toISOString(),
      app: 'IMPORTHOURANDO',
      environment: 'production',
      data: {
        id: `event-${Date.now()}`,
        productTitle: 'Smart TV 55" 4K Crystal UHD Samsung',
        price: 2199.00,
        originalPrice: 3199.00,
        discountPercentage: 31,
        affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=importhourando',
        userEmail: 'usuario.teste@importhourando.com.br',
        triggeredBy: 'Manual Webhook Test'
      }
    };

    try {
      // First attempt direct async POST, with fallback
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (secretToken.trim()) {
        headers['X-Webhook-Secret'] = secretToken.trim();
      }

      const response = await fetch(targetUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const responseTimeMs = Math.round(performance.now() - startTime);
      let textBody = '';
      try {
        textBody = await response.text();
      } catch (e) {
        textBody = '(Sem corpo de resposta)';
      }

      if (response.ok) {
        setTestResult({
          success: true,
          status: response.status,
          message: `Webhook disparado com sucesso! Código HTTP ${response.status} OK.`,
          responseTimeMs,
          payloadSent: payload,
          responseBody: textBody.slice(0, 300)
        });
      } else {
        setTestResult({
          success: false,
          status: response.status,
          message: `O servidor de destino respondeu com erro HTTP ${response.status}.`,
          responseTimeMs,
          payloadSent: payload,
          responseBody: textBody.slice(0, 300)
        });
      }
    } catch (error: any) {
      const responseTimeMs = Math.round(performance.now() - startTime);
      setTestResult({
        success: false,
        status: 0,
        message: `Falha na requisição de Webhook: ${error.message || 'Erro de conexão CORS ou URL inacessível'}.`,
        responseTimeMs,
        payloadSent: payload,
        responseBody: 'Não foi possível conectar ao endpoint informado. Verifique se a URL está correta e aceita requisições POST.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRequirePlanActivation && !onRequirePlanActivation('adicionar integração de Webhook')) return;

    if (!targetUrl.trim()) return;

    const newWebhook: WebhookConfig = {
      id: `wh-${Date.now()}`,
      name: name.trim() || 'Webhook Endpoint',
      url: targetUrl.trim(),
      enabled: true,
      events: [selectedEvent as any],
      secretToken: secretToken.trim() || undefined,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      lastTriggeredAt: testResult?.success ? new Date().toLocaleTimeString('pt-BR') : undefined,
      lastStatus: testResult?.status || undefined
    };

    const updated = [newWebhook, ...localList];
    setLocalList(updated);
    if (onSaveWebhooks) {
      onSaveWebhooks(updated);
    }

    setTargetUrl('');
    setSecretToken('');
  };

  const handleRemoveWebhook = (id: string) => {
    const updated = localList.filter(w => w.id !== id);
    setLocalList(updated);
    if (onSaveWebhooks) {
      onSaveWebhooks(updated);
    }
  };

  const handleToggleEnabled = (id: string) => {
    const updated = localList.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    setLocalList(updated);
    if (onSaveWebhooks) {
      onSaveWebhooks(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Webhook className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">Configuração e Disparo de Webhooks</h2>
              <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                API HTTP POST
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Sincronize automações em tempo real enviando payloads JSON para o N8N, Make, Zapier ou seu servidor backend quando eventos específicos acontecerem na plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <form onSubmit={handleAddWebhook} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nome Identificador:</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: N8N Produção - Disparos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Event trigger selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Seleção de Evento Gatilho:</span>
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
              >
                <option value="copy.generated">copy.generated (Quando uma nova copy de oferta é gerada)</option>
                <option value="user.registered">user.registered (Novo usuário ou assinante cadastrado)</option>
                <option value="user.login">user.login (Usuário efetua login no sistema)</option>
                <option value="offer.dispatched">offer.dispatched (Oferta enviada com sucesso no WhatsApp)</option>
                <option value="price.alert">price.alert (Alerta de variação de preço atingido)</option>
              </select>
            </div>
          </div>

          {/* URL de Destino */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-indigo-600" />
              <span>URL de Destino (Endpoint do Webhook HTTP POST):</span>
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://seu-servidor.com/api/webhook ou https://n8n.webhook.store/webhook/123"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              required
            />
          </div>

          {/* Secret Token */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chave / Token Secreto de Assinatura Header (Opcional):</span>
            </label>
            <input
              type="password"
              value={secretToken}
              onChange={(e) => setSecretToken(e.target.value)}
              placeholder="whsec_1234567890abcdef (Enviado em Header X-Webhook-Secret)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting || !targetUrl.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Disparando Payload de Teste...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-indigo-400" />
                  <span>Testar Disparo de Webhook</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={!targetUrl.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Integração de Webhook</span>
            </button>
          </div>
        </form>

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-xl border transition-all ${
            testResult.success 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
              : 'bg-red-50/80 border-red-200 text-red-900'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wide">
                    {testResult.success ? 'Sucesso no Disparo do Webhook' : 'Erro na Resposta do Webhook'}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className={`px-2 py-0.5 rounded-md font-bold ${
                      testResult.status >= 200 && testResult.status < 300 
                        ? 'bg-emerald-200 text-emerald-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      HTTP {testResult.status || 'FAIL'}
                    </span>
                    {testResult.responseTimeMs && (
                      <span className="text-slate-500 font-sans flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {testResult.responseTimeMs}ms
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-medium">{testResult.message}</p>

                {/* Details Payload preview */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">Payload JSON Enviado:</span>
                    <pre className="p-2 rounded-lg bg-slate-900 text-indigo-300 text-[10px] overflow-x-auto max-h-32">
                      {JSON.stringify(testResult.payloadSent, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-500 font-sans uppercase">Retorno do Servidor Destino:</span>
                    <pre className="p-2 rounded-lg bg-slate-900 text-slate-200 text-[10px] overflow-x-auto max-h-32">
                      {testResult.responseBody || '(Sem resposta)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhooks Active List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Webhooks Ativos Cadastrados ({localList.length})</span>
          </span>
        </h3>

        {localList.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Webhook className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Nenhum webhook cadastrado até o momento.</p>
            <p className="text-[11px] text-slate-400 mt-1">Preencha o formulário acima para adicionar e testar seu primeiro endpoint.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {localList.map((wh) => (
              <div key={wh.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{wh.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wh.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {wh.enabled ? 'ATIVO' : 'DESATIVADO'}
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                      {wh.events.join(', ')}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 break-all">{wh.url}</p>
                  {wh.lastTriggeredAt && (
                    <p className="text-[10px] text-slate-400">
                      Último disparo: {wh.lastTriggeredAt} {wh.lastStatus ? `(Status HTTP ${wh.lastStatus})` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEnabled(wh.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      wh.enabled
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {wh.enabled ? 'Pausar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleRemoveWebhook(wh.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Excluir Webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
