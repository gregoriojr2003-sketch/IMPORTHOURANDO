import React from 'react';
import { Crown, Sparkles, Zap, ShieldCheck, CheckCircle2, ArrowRight, X, Lock } from 'lucide-react';

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToPlans: () => void;
  actionName?: string;
}

export const SubscriptionPaywallModal: React.FC<SubscriptionPaywallModalProps> = ({
  isOpen,
  onClose,
  onGoToPlans,
  actionName = 'colocar o robô para funcionar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition-all"
          title="Fechar e continuar explorando no Modo Tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header */}
        <div className="bg-gradient-to-br from-[#2D3277] via-[#1E2255] to-[#12153B] p-6 sm:p-8 text-white relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#FFE600]/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-14 h-14 bg-[#FFE600] text-[#2D3277] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform rotate-3">
            <Crown className="w-8 h-8 fill-current" />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-[#FFE600] text-[#2D3277] font-black text-[11px] px-3 py-1 rounded-full uppercase mb-2 shadow-sm">
            <Lock className="w-3.5 h-3.5" />
            <span>Recurso Exclusivo para Assinantes</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            Ative Seu Plano para Funcionar
          </h2>
          <p className="text-xs text-slate-200 mt-1 font-medium max-w-md mx-auto">
            Você está navegando no <strong className="text-[#FFE600]">Modo Tour & Demonstração</strong>.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-1">
            <p className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ação Bloqueada no Modo Tour:</span>
            </p>
            <p className="text-slate-700">
              Para <strong className="text-[#2D3277]">{actionName}</strong> e liberar todos os disparos automáticos no WhatsApp, escolha um dos nossos planos de assinatura.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              O que você libera ao assinar:
            </h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Robô de Disparos Automáticos 24h</h5>
                  <p className="text-[11px] text-slate-500">Publicações e agendamentos diretos em seus canais do WhatsApp.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Conversão Automática com sua Tag</h5>
                  <p className="text-[11px] text-slate-500">Todas as ofertas recebem seus links de afiliado do Mercado Livre.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">Varredura e Monitoramento de Ofertas por IA</h5>
                  <p className="text-[11px] text-slate-500">Captura automática das melhores promoções do dia em tempo real.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={onGoToPlans}
              className="w-full py-3.5 px-4 rounded-xl bg-[#2D3277] hover:bg-[#1E2255] text-white font-extrabold text-xs shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group active:scale-98"
            >
              <Zap className="w-4 h-4 text-[#FFE600] fill-current" />
              <span>VER PLANOS & ATIVAR ASSINATURA AGORA</span>
              <ArrowRight className="w-4 h-4 text-[#FFE600] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all text-center"
            >
              Continuar Explorando no Modo Tour
            </button>
          </div>

          {/* Security Guarantee Footer */}
          <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sem fidelidade obrigatória. Cancele ou altere a qualquer momento.</span>
          </div>

        </div>

      </div>
    </div>
  );
};
