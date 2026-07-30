import React, { useState, useEffect } from 'react';
import { Subscriber, SubscriptionPlan, AdminPaymentConfig } from '../types';
import { 
  Crown, Zap, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, 
  Gift, QrCode, Copy, AlertTriangle, ArrowRight, Check, Lock, Unlock, ShieldAlert,
  CreditCard, Link2, ExternalLink
} from 'lucide-react';

interface ClientSubscriptionViewProps {
  currentSubscriber: Subscriber;
  onRefresh: () => void;
}

export const ClientSubscriptionView: React.FC<ClientSubscriptionViewProps> = ({
  currentSubscriber: initialSubscriber,
  onRefresh
}) => {
  const [currentSubscriber, setCurrentSubscriber] = useState<Subscriber>(initialSubscriber);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isRetentionView, setIsRetentionView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PIX' | 'MERCADOPAGO'>('PIX');

  // Dynamic Payment Config fetched from ADM
  const [paymentConfig, setPaymentConfig] = useState<AdminPaymentConfig>({
    pixKey: '12.345.678/0001-90',
    pixKeyType: 'CNPJ',
    pixBeneficiary: 'IMPORTHOURANDO TECNOLOGIA & PAGAMENTOS LTDA',
    pixCopyPasteCode: '00020126580014br.gov.bcb.pix0136importhourando-pagamentos-pix-key-981273912835204000053039865405347.905802BR5920IMPORTHOURANDO_BOT6009SAO_PAULO62070503***6304A1B2',
    mercadoPagoCheckoutUrl: 'https://mpago.la/2a3b4c',
    paymentInstructions: 'Após efetuar o pagamento via PIX ou Mercado Pago, seu acesso é liberado instantaneamente.'
  });

  // Sync if prop updates
  useEffect(() => {
    setCurrentSubscriber(initialSubscriber);
  }, [initialSubscriber]);

  // Fetch payment config dynamically from server
  useEffect(() => {
    fetch('/api/admin/payment-config')
      .then(res => res.json())
      .then(data => {
        if (data.paymentConfig) setPaymentConfig(data.paymentConfig);
      })
      .catch(err => console.error(err));
  }, []);

  const handleCopyPixKey = () => {
    navigator.clipboard.writeText(paymentConfig.pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyPixPayload = () => {
    navigator.clipboard.writeText(paymentConfig.pixCopyPasteCode || paymentConfig.pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };


  const handleStartUpgrade = (plan: SubscriptionPlan, discount: number = 0) => {
    setSelectedPlanForUpgrade(plan);
    setDiscountPercent(discount);
    setShowCheckout(true);
    setIsRetentionView(false);
  };

  const handleCancelIntent = async () => {
    try {
      await fetch('/api/subscriber/cancel-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentSubscriber.email })
      });
      setIsRetentionView(true);
    } catch (e) {
      setIsRetentionView(true);
    }
  };

  const handleFinalizeUpgrade = async (acceptedRetention: boolean = false) => {
    if (!selectedPlanForUpgrade) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/subscriber/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentSubscriber.email,
          userName: currentSubscriber.name,
          targetPlan: selectedPlanForUpgrade,
          discountApplied: discountPercent,
          acceptedRetention
        })
      });

      if (res.ok) {
        setPaymentApproved(true);
        setTimeout(() => {
          // Instantly unlock locally
          setCurrentSubscriber(prev => ({
            ...prev,
            status: 'ATIVO',
            plan: selectedPlanForUpgrade,
            expiresAt: selectedPlanForUpgrade === 'ANUAL' ? '2027-12-31' : '2026-12-31'
          }));
          onRefresh();
          setShowCheckout(false);
          setPaymentApproved(false);
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle local simulated suspension state for testing
  const handleToggleSimulatedSuspension = () => {
    setCurrentSubscriber(prev => ({
      ...prev,
      status: prev.status === 'ATIVO' ? 'EXPIRADO' : 'ATIVO'
    }));
  };

  const isSuspended = currentSubscriber.status !== 'ATIVO';
  const isAnual = currentSubscriber.plan === 'ANUAL';
  const isSemestral = currentSubscriber.plan === 'SEMESTRAL';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Simulation Bar for Testing Active vs Suspended */}
      <div className="bg-slate-200/80 border border-slate-300 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-bold text-slate-900">🧪 Modulo de Teste de Visão do Cliente:</span>
          <span>{currentSubscriber.name} ({currentSubscriber.email})</span>
        </div>
        <button
          onClick={handleToggleSimulatedSuspension}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 ${
            isSuspended
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isSuspended ? (
            <>
              <Unlock className="w-3.5 h-3.5" /> Alternar para Status Ativo (Simular)
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" /> Alternar para Status Aguardando Ativação (Simular)
            </>
          )}
        </button>
      </div>

      {/* SUSPENSION ALERT BANNER - SPECIFICALLY FOR EXPIRED SUBSCRIBERS */}
      {isSuspended && (
        <div className="bg-gradient-to-r from-slate-800 via-indigo-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border-2 border-indigo-400 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider border border-white/30">
                <ShieldAlert className="w-4 h-4 text-amber-300" />
                DESBLOQUEAR FUNCIONALIDADES DO SEU PLANO
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                Ative a sua licença para colocar o robô em produção ⚡
              </h2>
              <p className="text-xs md:text-sm text-slate-200 max-w-2xl leading-relaxed">
                <strong>Política do Sistema IMPORTHOURANDO:</strong> Não enviamos cobranças automáticas ou débitos recorrentes sem seu consentimento. Renove ou ative quando desejar para liberar 100% das ferramentas.
              </p>
            </div>

            {/* EASY RECOVERY BUTTON */}
            <button
              onClick={() => handleStartUpgrade(currentSubscriber.plan || 'MENSAL', 0)}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-[#FFE600] to-amber-400 hover:from-amber-300 hover:to-amber-500 text-[#2D3277] font-black text-sm shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 border border-white/40 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-current text-[#2D3277]" />
              ⚡ DESBLOQUEAR FUNCIONALIDADES AGORA
            </button>
          </div>
        </div>
      )}

      {/* Client Header Banner */}
      <div className={`bg-gradient-to-r ${isSuspended ? 'from-slate-800 via-slate-900 to-slate-950 border-2 border-amber-500/50' : 'from-[#2D3277] via-[#1E2355] to-[#141738]'} rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-extrabold uppercase tracking-wider border border-white/15">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Minha Assinatura IMPORTHOURANDO
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Olá, {currentSubscriber.name.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Aqui você acompanha a situação da sua licença, verifica os benefícios e pode fazer a liberação instantânea de acesso mediante renovação ou upgrade.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 min-w-[220px]">
            <span className="text-xs text-slate-300 block font-medium">Plano Atual</span>
            <div className="text-lg font-black text-[#FFE600] mt-1 flex items-center justify-center gap-1.5">
              {isAnual ? (
                <>
                  <Crown className="w-5 h-5 text-amber-400" /> ANUAL
                </>
              ) : isSemestral ? (
                <>
                  <Zap className="w-5 h-5 text-blue-400" /> SEMESTRAL
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 text-emerald-400" /> MENSAL
                </>
              )}
            </div>

            <div className={`mt-2 text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
              isSuspended
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {isSuspended ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  AGUARDANDO DESBLOQUEAR FUNCIONALIDADES
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Status: ATIVO
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details & Active Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Detalhes do Contrato
            </h3>
            <span className="text-xs font-semibold text-slate-400">ID: {currentSubscriber.id}</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Início da Licença:</span>
              <strong className="text-slate-900">{currentSubscriber.startedAt}</strong>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Validade / Renovação:</span>
              {isAnual ? (
                <strong className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {currentSubscriber.expiresAt || 'Validade de 12 Meses'}
                </strong>
              ) : (
                <strong className={isSuspended ? "text-red-600 font-bold" : "text-slate-900"}>
                  {currentSubscriber.expiresAt || 'Expirado'}
                </strong>
              )}
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Cobranças Automáticas:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                🚫 Isento (Sem Débitos)
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Situação do Robô:</span>
              {isSuspended ? (
                <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px] border border-red-200">
                  🔴 Pausado (Pendente Renovação)
                </span>
              ) : (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                  🟢 Operação 100% Liberada
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Benefits Checklist Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <div className="border-b pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Funcionalidades do Robô IMPORTHOURANDO
            </h3>
            {isSuspended ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" /> Aguardando Desbloquear Funcionalidades
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Licença 100% Liberada
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isSuspended ? 'bg-red-50/50 border-red-100 opacity-75' : 'bg-slate-50 border-slate-100'}`}>
              {isSuspended ? (
                <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-slate-900 block font-semibold">Conversão de Links com Tag Própria</strong>
                Substituição automática dos links de ofertas com sua tag de afiliado.
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isSuspended ? 'bg-red-50/50 border-red-100 opacity-75' : 'bg-slate-50 border-slate-100'}`}>
              {isSuspended ? (
                <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-slate-900 block font-semibold">Disparo Automático no WhatsApp 24/7</strong>
                Postagem sequencial nos seus grupos e canais sem depender de ação humana.
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isSuspended ? 'bg-red-50/50 border-red-100 opacity-75' : 'bg-slate-50 border-slate-100'}`}>
              {isSuspended ? (
                <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-slate-900 block font-semibold">Gerador de Copies Virais por IA</strong>
                Formatação inteligente com gatilhos mentais de escassez e urgência.
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${isSuspended ? 'bg-red-50/50 border-red-100 opacity-75' : 'bg-slate-50 border-slate-100'}`}>
              {isSuspended ? (
                <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-slate-900 block font-semibold">Múltiplos Marketplaces Integrados</strong>
                Suporte nativo ao Mercado Livre, Shopee, Amazon e Magalu.
              </div>
            </div>
          </div>

          {isSuspended && (
            <div className="pt-2 text-center">
              <button
                onClick={() => handleStartUpgrade(currentSubscriber.plan || 'MENSAL', 0)}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow transition-all flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Clique Aqui para Liberar Todas as Funcionalidades Agora
              </button>
            </div>
          )}
        </div>
      </div>

      {/* UPGRADE & RENEWAL OFFERS SECTION */}
      {!isAnual ? (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs uppercase tracking-wider">
              {isSuspended ? '⚡ Liberação Instantânea' : '🚀 Oportunidade de Economia'}
            </span>
            <h3 className="text-2xl font-black text-slate-900">
              {isSuspended ? 'Escolha o Plano para Ativar e Liberar seu Robô' : 'Ofertas de Renovação ou Upgrade Sem Falar com Administrador'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pagamento 100% via PIX com liberação imediata das funcionalidades no robô de vendas.
            </p>
          </div>

          {/* Upgrade & Renewal Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Option 1: Renovação Mensal */}
            <div className="p-6 rounded-2xl border-2 border-slate-200 bg-slate-50 hover:border-slate-400 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden shadow-sm">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                  Plano Mensal (30 Dias)
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-black text-slate-900">R$ 49,90<span className="text-xs text-slate-500 font-normal">/mês</span></div>
                  <div className="text-xs text-slate-500 font-medium mt-1">Renovação simples sem fidelidade</div>
                </div>
                <ul className="text-xs text-slate-600 mt-4 space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Liberação imediata do robô
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Sem cobranças automáticas
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleStartUpgrade('MENSAL', 0)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4 text-emerald-400" />
                {isSuspended ? 'Ativar Plano Mensal' : 'Manter Plano Mensal'}
              </button>
            </div>

            {/* Option 2: Semestral */}
            <div className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50/40 hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                ECONOMIZE 17%
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-blue-900 text-base">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Plano Semestral (6 Meses)
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400 line-through">De R$ 299,40 (6x R$ 49,90)</div>
                  <div className="text-3xl font-black text-blue-900">R$ 249,00</div>
                  <div className="text-xs text-blue-700 font-bold mt-1">Apenas R$ 41,50 ao mês</div>
                </div>
                <ul className="text-xs text-slate-600 mt-4 space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" /> 6 meses de robô sem preocupação
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0" /> Suporte prioritário via WhatsApp
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleStartUpgrade('SEMESTRAL', 0)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Ativar Plano Semestral
              </button>
            </div>

            {/* Option 3: Anual (01 Ano) */}
            <div className="p-6 rounded-2xl border-2 border-amber-300 bg-amber-50/60 hover:border-amber-500 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> MAIOR ECONOMIA
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-amber-950 text-base">
                  <Crown className="w-5 h-5 text-amber-600" />
                  Plano 01 Ano (12 Meses)
                </div>
                <div className="mt-3">
                  <div className="text-xs text-slate-400 line-through">De R$ 598,80 (12x R$ 49,90)</div>
                  <div className="text-3xl font-black text-amber-900">R$ 449,00</div>
                  <div className="text-xs text-amber-800 font-bold mt-1">Apenas R$ 37,41 por mês!</div>
                </div>
                <ul className="text-xs text-slate-700 mt-4 space-y-2 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" /> 12 meses de robô ativo 24h
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-600 shrink-0" /> Monitor ML de Ofertas Bônus
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleStartUpgrade('ANUAL', 0)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 fill-current" />
                Ativar Plano 01 Ano
              </button>
            </div>
          </div>

          {/* Retention Trigger Button for Monthly Subscribers */}
          {!isSemestral && !isSuspended && (
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                onClick={handleCancelIntent}
                className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors underline"
              >
                Desejo cancelar minha assinatura mensal
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Celebration Banner for Anual Members */
        <div className="bg-amber-50 border-2 border-amber-200 p-6 md:p-8 rounded-3xl text-center space-y-3">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-950">
            Você é um Assinante do Plano Anual VIP! 🎉
          </h3>
          <p className="text-xs text-amber-800 max-w-lg mx-auto leading-relaxed font-medium">
            Sua conta possui <strong>Plano Anual Ativo (12 Meses de Acesso)</strong> com o maior desconto por mês e acesso total a todas as funções do robô.
          </p>
        </div>
      )}

      {/* MODAL: RETENTION DISCOUNT OFFER */}
      {isRetentionView && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase mb-2">
                ⚠️ Oferta Especial de Retenção
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Não cancele seu robô!
              </h3>
              <p className="text-xs text-slate-600 mt-2 max-w-md mx-auto">
                O administrador liberou cupons de retenção exclusiva para você permanecer no IMPORTHOURANDO lucrando diariamente:
              </p>
            </div>

            <div className="space-y-3 text-left">
              {/* Option 1: 10% Semestral */}
              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900 text-xs">Semestral com 10% OFF</div>
                  <div className="text-lg font-black text-blue-700">R$ 132,30 <span className="text-xs font-normal text-slate-500">(R$ 22,05/mês)</span></div>
                </div>
                <button
                  onClick={() => handleStartUpgrade('SEMESTRAL', 10)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Aceitar 10% OFF
                </button>
              </div>

              {/* Option 2: 30% Anual */}
              <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/60 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-950 text-xs">👑 Plano Anual com 30% OFF</div>
                  <div className="text-lg font-black text-amber-800">R$ 172,90 <span className="text-xs font-normal text-slate-500">(R$ 14,40/mês por 1 ano)</span></div>
                </div>
                <button
                  onClick={() => handleStartUpgrade('ANUAL', 30)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  Aceitar 30% OFF
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t text-xs">
              <button onClick={() => setIsRetentionView(false)} className="text-slate-500 font-semibold hover:underline">
                Voltar aos meus planos
              </button>
              <button
                onClick={() => {
                  setCurrentSubscriber(prev => ({ ...prev, status: 'EXPIRADO' }));
                  setIsRetentionView(false);
                }}
                className="text-red-500 hover:text-red-700 font-medium underline"
              >
                Confirmar Cancelamento (Suspender Robô)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSTANT CHECKOUT VIA PIX & MERCADO PAGO */}
      {showCheckout && selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 text-center relative">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>

            {paymentApproved ? (
              <div className="py-8 space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Liberação Aprovada! 🎉
                </h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Seu acesso foi liberado com sucesso no <strong>Plano {selectedPlanForUpgrade}</strong>! Todas as funcionalidades do robô já estão ativas.
                </p>
                <div className="text-[11px] text-slate-400">Ativação instantânea registrada no sistema.</div>
              </div>
            ) : (
              <>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase mb-2">
                    Checkout PIX & Mercado Pago
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    Ativar e Liberar Plano {selectedPlanForUpgrade}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Selecione a forma de pagamento desejada abaixo
                  </p>
                </div>

                {/* Payment Method Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setSelectedPaymentMethod('PIX')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      selectedPaymentMethod === 'PIX'
                        ? 'bg-white text-emerald-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    PIX Direto
                  </button>
                  <button
                    onClick={() => setSelectedPaymentMethod('MERCADOPAGO')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      selectedPaymentMethod === 'MERCADOPAGO'
                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    Mercado Pago 💳
                  </button>
                </div>

                {/* Summary Order Details Box */}
                <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Plano Selecionado:</span>
                    <strong className="text-slate-900">{selectedPlanForUpgrade}</strong>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-purple-600 font-bold">
                      <span>Desconto Aplicado:</span>
                      <span>{discountPercent}% OFF</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold text-sm border-t pt-1">
                    <span>Valor a Pagar:</span>
                    <span className="text-emerald-600">
                      R$ {selectedPlanForUpgrade === 'ANUAL'
                        ? (discountPercent === 30 ? '172,90' : '247,00')
                        : (selectedPlanForUpgrade === 'SEMESTRAL' ? (discountPercent === 10 ? '132,30' : '147,00') : '29,90')}
                    </span>
                  </div>
                </div>

                {/* TAB 1: PIX DETAILS */}
                {selectedPaymentMethod === 'PIX' ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 inline-block shadow-inner">
                      <QrCode className="w-28 h-28 mx-auto text-slate-800" />
                    </div>

                    <div className="text-left bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Chave PIX ({paymentConfig.pixKeyType}):</span>
                        <div className="font-mono font-bold text-slate-800 break-all bg-slate-50 p-1.5 rounded border border-slate-100">
                          {paymentConfig.pixKey}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Beneficiário:</span>
                        <strong className="text-slate-800">{paymentConfig.pixBeneficiary}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleCopyPixKey}
                        className="py-2 px-2 rounded-xl border border-slate-300 bg-white font-semibold text-[11px] text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1 transition-all"
                      >
                        <Copy className="w-3 h-3 text-slate-500" />
                        {isCopied ? 'Copiado!' : 'Copiar Chave'}
                      </button>

                      <button
                        onClick={handleCopyPixPayload}
                        className="py-2 px-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-[11px] hover:bg-emerald-100 flex items-center justify-center gap-1 transition-all"
                      >
                        <Copy className="w-3 h-3 text-emerald-600" />
                        {isCopied ? 'Payload Copiado!' : 'Copia e Cola'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* TAB 2: MERCADO PAGO DETAILS */
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-left space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-blue-900">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Pagamento via Mercado Pago
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {paymentConfig.paymentInstructions || 'Pague com cartão de crédito, débito ou saldo do Mercado Pago pelo link fornecido.'}
                      </p>
                    </div>

                    <a
                      href={paymentConfig.mercadoPagoCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-[#009EE3] hover:bg-[#0081B9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pagar via Mercado Pago 💳
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => handleFinalizeUpgrade(discountPercent > 0)}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isLoading ? 'Liberando Acesso...' : 'Confirmar / Simular Pagamento Aprovado'}
                  </button>

                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-xs text-slate-500 hover:underline font-medium block mx-auto"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
