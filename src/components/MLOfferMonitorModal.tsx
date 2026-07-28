import React, { useState } from 'react';
import { X, Search, Zap, Check, RefreshCw, Send, Radio, ShoppingBag, ShieldCheck, Tag, ExternalLink, Sparkles } from 'lucide-react';
import { WhatsAppChannel, MercadoLivreProduct, DispatchedOffer } from '../types';

export interface MLMonitorConfig {
  enabled: boolean;
  affiliateTag: string;
  targetChannelId: string;
  minDiscount: number;
  checkIntervalSeconds: number;
  lastCheckedAt?: string;
  totalNewOffersIdentified: number;
}

interface MLOfferMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: WhatsAppChannel[];
  monitorConfig: MLMonitorConfig;
  onSaveConfig: (updated: Partial<MLMonitorConfig>) => void;
  onTriggerNow: () => Promise<void>;
  isTriggering: boolean;
  dispatchedLogs: DispatchedOffer[];
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const MLOfferMonitorModal: React.FC<MLOfferMonitorModalProps> = ({
  isOpen,
  onClose,
  channels,
  monitorConfig,
  onSaveConfig,
  onTriggerNow,
  isTriggering,
  dispatchedLogs,
  onRequirePlanActivation
}) => {
  const [enabled, setEnabled] = useState(monitorConfig.enabled);
  const [affiliateTag, setAffiliateTag] = useState(monitorConfig.affiliateTag || 'ofertastop_app');
  const [targetChannelId, setTargetChannelId] = useState(monitorConfig.targetChannelId || (channels[0]?.id || 'chan-01'));
  const [minDiscount, setMinDiscount] = useState(monitorConfig.minDiscount || 20);
  const [checkIntervalSeconds, setCheckIntervalSeconds] = useState(monitorConfig.checkIntervalSeconds || 15);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRequirePlanActivation && !onRequirePlanActivation('ativar ou salvar o monitor do Mercado Livre')) {
      return;
    }

    onSaveConfig({
      enabled,
      affiliateTag,
      targetChannelId,
      minDiscount,
      checkIntervalSeconds
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const selectedChannel = channels.find(c => c.id === targetChannelId) || channels[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#2D3277] text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FFE600] text-[#2D3277] font-extrabold shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-white font-mono">Monitor de Ofertas do Mercado Livre</h3>
                <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                  Afiliado Ativo
                </span>
              </div>
              <p className="text-xs text-amber-200">
                Identifica automaticamente novas promoções e envia link direto com preço e título para o WhatsApp
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Status Toggle Box */}
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md">
            <div>
              <p className="font-extrabold text-sm text-[#FFE600] font-mono">Status do Monitoramento Automático</p>
              <p className="text-slate-300 text-[11px]">
                {enabled ? '🟡 Monitorando ofertas da conta em tempo real' : '🔴 Monitoramento em pausa'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${
                enabled ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {enabled ? 'MONITOR ATIVO (ON)' : 'PAUSADO (OFF)'}
            </button>
          </div>

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Affiliate Tag */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
              <label className="font-bold text-amber-950 flex items-center justify-between">
                <span>Tag de Afiliado Mercado Livre (`matext`)</span>
                <span className="text-[10px] text-amber-800 font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                  Tag Oficial
                </span>
              </label>
              <input
                type="text"
                required
                value={affiliateTag}
                onChange={(e) => setAffiliateTag(e.target.value)}
                placeholder="Ex: matext=sua_tag_afiliado"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#3483FA]"
              />
              <p className="text-[10px] text-slate-500">
                Seus links diretos serão formatados com `?matext={affiliateTag}` para atribuir comissão.
              </p>
            </div>

            {/* Target WhatsApp Channel */}
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
              <label className="font-bold text-emerald-950 flex items-center justify-between">
                <span>Canal Específico do WhatsApp</span>
                <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                  Destino
                </span>
              </label>
              <select
                value={targetChannelId}
                onChange={(e) => setTargetChannelId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
              >
                {channels.map((chan) => (
                  <option key={chan.id} value={chan.id}>
                    {chan.name} ({chan.type === 'CHANNEL' ? 'Canal' : chan.type === 'GROUP' ? 'Grupo' : 'Status'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                Canal selecionado: <strong>{selectedChannel?.name || 'Canal de Ofertas'}</strong>
              </p>
            </div>
          </div>

          {/* Filtering Criteria & Intervals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-800 block">Frequência de Varredura (Segundos)</label>
              <input
                type="number"
                min={5}
                max={300}
                value={checkIntervalSeconds}
                onChange={(e) => setCheckIntervalSeconds(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
              />
              <p className="text-[10px] text-slate-500">Varredura contínua de novas ofertas da conta.</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-800 block">Desconto Mínimo para Notificar (% OFF)</label>
              <input
                type="number"
                min={0}
                max={90}
                value={minDiscount}
                onChange={(e) => setMinDiscount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-bold"
              />
              <p className="text-[10px] text-slate-500">Apenas ofertas acima do percentual serão enviadas.</p>
            </div>
          </div>

          {/* Message Format Mandatory Box */}
          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 border border-purple-800">
            <div className="flex items-center justify-between text-xs font-bold text-[#FFE600]">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#FFE600]" />
                <span>Formato Garantido do Disparo no WhatsApp:</span>
              </span>
              <span className="text-[10px] bg-purple-900 text-purple-200 px-2 py-0.5 rounded font-mono">
                Título + Preço + Link Direto
              </span>
            </div>

            <div className="bg-emerald-950/80 p-3 rounded-lg text-emerald-100 font-sans text-[11px] leading-relaxed border border-emerald-800 whitespace-pre-wrap font-mono">
              {`🚨 *NOVA OFERTA MERCADO LIVRE IDENTIFICADA!*\n\n📦 *Smart TV 55" 4K UHD Samsung*\n💰 Preço Atual: *R$ 2.199,00* (30% OFF!)\n🚚 Frete Grátis para todo o Brasil\n\n👉 *COMPRE AQUI COM O LINK DIRETO DE AFILIADO:*\nhttps://www.mercadolivre.com.br/p/MLB12345?matext=${affiliateTag}`}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (onRequirePlanActivation && !onRequirePlanActivation('executar a varredura do monitor de ofertas agora')) return;
                onTriggerNow();
              }}
              disabled={isTriggering}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 text-xs shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin text-[#3483FA]' : ''}`} />
              <span>Varrer Novas Ofertas Agora</span>
            </button>

            <button
              type="submit"
              className="flex-1 bg-[#2D3277] hover:bg-[#3D438F] text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm text-xs"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#FFE600]" />
                  <span>Configurações do Monitor Salvas!</span>
                </>
              ) : (
                <span>Salvar Monitor de Ofertas Mercado Livre</span>
              )}
            </button>
          </div>

          {/* Monitored Offers Log Feed */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Últimas Ofertas do Mercado Livre Enviadas para o Canal:</span>
              <span className="text-slate-400 font-mono text-[10px]">
                {monitorConfig.totalNewOffersIdentified || 0} ofertas monitoradas
              </span>
            </h4>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {dispatchedLogs.filter(l => (l.marketplace || 'MERCADO_LIVRE') === 'MERCADO_LIVRE').slice(0, 5).map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{log.productTitle}</p>
                    <p className="text-slate-500 font-mono text-[10px]">
                      Preço: <strong className="text-[#2D3277]">R$ {log.price.toFixed(2).replace('.', ',')}</strong> • Canal: {log.channelName}
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
                    Enviado
                  </span>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
