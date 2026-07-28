import React, { useState } from 'react';
import { X, Zap, ShieldCheck, Check, RefreshCw, Flame, AlertTriangle, Send, Target } from 'lucide-react';
import { AutoSchedulerConfig, WhatsAppChannel } from '../types';
import { PriorityCriterion, PRIORITY_OPTIONS } from '../utils/productSorter';

interface AutoSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoSchedulerConfig;
  channels: WhatsAppChannel[];
  onSaveConfig: (updated: Partial<AutoSchedulerConfig>) => void;
  onTriggerNow: () => void;
  isTriggering: boolean;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const AutoSchedulerModal: React.FC<AutoSchedulerModalProps> = ({
  isOpen,
  onClose,
  config,
  channels,
  onSaveConfig,
  onTriggerNow,
  isTriggering,
  onRequirePlanActivation
}) => {
  const [enabled, setEnabled] = useState(config.enabled);
  const [intervalMinutes, setIntervalMinutes] = useState(config.intervalMinutes || 30);
  const [startTime, setStartTime] = useState(config.startTime || '06:00');
  const [endTime, setEndTime] = useState(config.endTime || '23:00');
  const [minDiscount, setMinDiscount] = useState(config.minDiscount || 30);
  const [autoPost50PercentUrgent, setAutoPost50PercentUrgent] = useState(config.autoPost50PercentUrgent ?? true);
  const [autoPost70Percent24hRadar, setAutoPost70Percent24hRadar] = useState(config.autoPost70Percent24hRadar ?? true);
  const [priorityFlowChannelToGroup, setPriorityFlowChannelToGroup] = useState(config.priorityFlowChannelToGroup ?? true);
  const [autoPostToWhatsAppStatus, setAutoPostToWhatsAppStatus] = useState(config.autoPostToWhatsAppStatus ?? true);
  const [botPriority1, setBotPriority1] = useState<PriorityCriterion>(config.botPriority1 || 'DISCOUNT_PERCENT');
  const [botPriority2, setBotPriority2] = useState<PriorityCriterion>(config.botPriority2 || 'SAVINGS_AMOUNT');
  const [botPriority3, setBotPriority3] = useState<PriorityCriterion>(config.botPriority3 || 'RATING');
  const [freeShippingOnly, setFreeShippingOnly] = useState(config.freeShippingOnly);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(config.targetChannels);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRequirePlanActivation && !onRequirePlanActivation('ativar ou salvar as automações do agendador')) {
      return;
    }

    onSaveConfig({
      enabled,
      intervalMinutes,
      startTime,
      endTime,
      minDiscount,
      autoPost50PercentUrgent,
      autoPost70Percent24hRadar,
      priorityFlowChannelToGroup,
      autoPostToWhatsAppStatus,
      botPriority1,
      botPriority2,
      botPriority3,
      freeShippingOnly,
      targetChannels: selectedChannels
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl text-slate-900 shadow-2xl overflow-hidden my-6">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#2D3277] text-[#FFE600] font-bold shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 font-mono">IMPORTHOURANDO Bot</h3>
              <p className="text-xs text-slate-500">Regras de Automação Inteligente de Disparos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Main Toggle */}
          <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-md">
            <div>
              <p className="font-extrabold text-sm text-[#FFE600] font-mono">Status da Automação IMPORTHOURANDO</p>
              <p className="text-slate-300 text-[11px]">Varredura automática e disparo multi-marketplace</p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`px-4 py-2 rounded-xl font-bold transition-all shadow-sm ${
                enabled ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {enabled ? 'ROBÔ ATIVO (ON)' : 'ROBÔ PAUSADO (OFF)'}
            </button>
          </div>

          {/* Regras Nativa do IMPORTHOURANDO */}
          <div className="space-y-3 pt-1">
            <h4 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider flex items-center space-x-1">
              <span>⚡ Regras Nativas de Disparo Automático:</span>
            </h4>

            {/* Regra 1 */}
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase">Passo 1</span>
                  <h5 className="font-bold text-blue-950 text-xs mt-1">Ofertas Regulares (30%+ OFF) - Horário Comercial</h5>
                </div>
              </div>
              <p className="text-[11px] text-slate-600">
                Dispara ofertas a cada <strong>{intervalMinutes} minutos</strong> (janela de 5 min) entre as <strong>{startTime}</strong> e <strong>{endTime}</strong>.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Início</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Fim</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600">Mín. Desconto</label>
                  <input
                    type="number"
                    value={minDiscount}
                    onChange={(e) => setMinDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-900 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Regra 2 */}
            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1.5">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPost50PercentUrgent}
                  onChange={(e) => setAutoPost50PercentUrgent(e.target.checked)}
                  className="mt-0.5 rounded text-amber-600 focus:ring-0"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">Passo 2</span>
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold text-amber-950 text-xs">Super Ofertas (50%+ OFF) - Fura Fila Automático</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Havendo qualquer oferta com 50% ou mais de desconto, o robô dispara imediatamente sem aguardar o intervalo regular.
                  </p>
                </div>
              </label>
            </div>

            {/* Regra 3 */}
            <div className="p-3.5 bg-red-50/80 rounded-xl border border-red-200 space-y-1.5">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPost70Percent24hRadar}
                  onChange={(e) => setAutoPost70Percent24hRadar(e.target.checked)}
                  className="mt-0.5 rounded text-red-600 focus:ring-0"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">Passo 3</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    <span className="font-bold text-red-950 text-xs">Alerta Vermelho (70%+ OFF) - Radar 24h Prioritário</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Ofertas iguais ou superiores a 70% de desconto disparam prioritariamente com Alerta Vermelho a qualquer hora do dia ou da noite (Radar 24h ativado).
                  </p>
                </div>
              </label>
            </div>

            {/* Regra 4 */}
            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={priorityFlowChannelToGroup}
                  onChange={(e) => setPriorityFlowChannelToGroup(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-0"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">Passo 4</span>
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-bold text-emerald-950 text-xs">Fluxo Canal → Grupo com Convite de Entrada</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Divulga sempre primeiro no Canal do WhatsApp e na sequência para os Grupos, contendo o link de convite do Canal para atrair e fidelizar novos membros.
                  </p>
                </div>
              </label>
            </div>

            {/* Regra 5 - Auto Post WhatsApp Status */}
            <div className="p-3.5 bg-purple-50/90 rounded-xl border border-purple-200 space-y-1.5 shadow-xs">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPostToWhatsAppStatus}
                  onChange={(e) => setAutoPostToWhatsAppStatus(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-0"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-purple-700 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">Passo 5</span>
                    <span className="text-base">📸</span>
                    <span className="font-extrabold text-purple-950 text-xs">Postar no Meu Status do WhatsApp (Stories 24h)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Quando o robô ou envio manual disparar ofertas para o Canal/Grupo, publica automaticamente uma versão resumida com o seu link no seu <strong>Status do WhatsApp</strong>.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Prioridades de Disparo do Bot (1º, 2º, 3º Lugar) */}
          <div className="p-4 bg-purple-50/90 rounded-xl border border-purple-200 space-y-3">
            <h4 className="font-extrabold text-purple-950 text-xs flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span>Prioridades de Seleção do Bot (1º, 2º e 3º Lugar):</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* 1º Lugar */}
              <div>
                <label className="block text-[10px] font-black text-purple-900 mb-1">1º Lugar (Principal):</label>
                <select
                  value={botPriority1}
                  onChange={(e) => setBotPriority1(e.target.value as PriorityCriterion)}
                  className="w-full bg-white border border-purple-300 rounded-lg p-1.5 text-[11px] font-bold text-slate-900 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.badge}</option>
                  ))}
                </select>
              </div>

              {/* 2º Lugar */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 mb-1">2º Lugar (Desempate 1):</label>
                <select
                  value={botPriority2}
                  onChange={(e) => setBotPriority2(e.target.value as PriorityCriterion)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-bold text-slate-900 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.badge}</option>
                  ))}
                </select>
              </div>

              {/* 3º Lugar */}
              <div>
                <label className="block text-[10px] font-black text-slate-700 mb-1">3º Lugar (Desempate 2):</label>
                <select
                  value={botPriority3}
                  onChange={(e) => setBotPriority3(e.target.value as PriorityCriterion)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-bold text-slate-900 focus:outline-none"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.badge}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-slate-800 font-medium cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={freeShippingOnly}
                onChange={(e) => setFreeShippingOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
              />
              <span>Disparar preferencialmente ofertas com Frete Grátis 🚚</span>
            </label>
          </div>

          {/* Target channels */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">Canais e Grupos Conectados ao Robô:</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {channels.map((chan) => (
                <label
                  key={chan.id}
                  className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(chan.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChannels([...selectedChannels, chan.id]);
                      } else {
                        setSelectedChannels(selectedChannels.filter(id => id !== chan.id));
                      }
                    }}
                    className="rounded text-[#3483FA]"
                  />
                  <span>
                    {chan.name} <strong className="text-slate-400 font-mono text-[10px]">({chan.type === 'CHANNEL' ? 'CANAL' : 'GRUPO'})</strong>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save & Run Now buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (onRequirePlanActivation && !onRequirePlanActivation('executar um ciclo de disparos agora')) return;
                onTriggerNow();
              }}
              disabled={isTriggering}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 text-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin text-[#3483FA]' : ''}`} />
              <span>Executar Ciclo Agora</span>
            </button>

            <button
              type="submit"
              className="flex-1 bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-1 shadow-sm text-xs"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#FFE600]" />
                  <span>Configuração Salva com Sucesso!</span>
                </>
              ) : (
                <span>Salvar Robô IMPORTHOURANDO</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


