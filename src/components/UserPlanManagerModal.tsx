import React, { useState, useEffect } from 'react';
import { Subscriber, SubscriptionPlan, AdminPaymentConfig } from '../types';
import { 
  Crown, Zap, RefreshCw, Check, Sparkles, ShieldCheck, 
  AlertTriangle, Gift, QrCode, Copy, CheckCircle2, Heart, ArrowRight,
  CreditCard, Link2, ExternalLink
} from 'lucide-react';

interface UserPlanManagerModalProps {
  currentSubscriber: Subscriber;
  onClose: () => void;
  onPlanChanged: () => void;
}

export const UserPlanManagerModal: React.FC<UserPlanManagerModalProps> = ({
  currentSubscriber,
  onClose,
  onPlanChanged
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(currentSubscriber.plan);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isRetentionView, setIsRetentionView] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
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

  // Cancellation requested state
  const [isCanceled, setIsCanceled] = useState(false);

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


  const handleSelectPlanToUpgrade = (plan: SubscriptionPlan, discount: number = 0) => {
    setSelectedPlan(plan);
    setDiscountPercent(discount);
    setShowCheckout(true);
  };

  const handleCancelIntentClick = async () => {
    try {
      await fetch('/api/subscriber/cancel-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: currentSubscriber.email })
      });
      setIsRetentionView(true);
    } catch (err) {
      console.error(err);
      setIsRetentionView(true);
    }
  };

  const handleFinalizePayment = async (acceptedRetention: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/subscriber/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentSubscriber.email,
          userName: currentSubscriber.name,
          targetPlan: selectedPlan,
          discountApplied: discountPercent,
          acceptedRetention
        })
      });

      if (res.ok) {
        setPaymentApproved(true);
        setTimeout(() => {
          onPlanChanged();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const mockPixCopyKey = "00020126580014br.gov.bcb.pix0136importhourando-pagamentos-pix-key-981273912835204000053039865405347.905802BR5920IMPORTHOURANDO_BOT6009SAO_PAULO62070503***6304A1B2";

  const handleCopyPix = () => {
    navigator.clipboard.writeText(mockPixCopyKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8 space-y-6 relative">
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 rounded-full hover:bg-slate-100"
        >
          ✕
        </button>

        {/* SECTION 1: CANCELLATION RETENTION POPUP (Regra 3) */}
        {isRetentionView ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Gift className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wider mb-2">
                ⚠️ Espera! Não vá embora ainda
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Temos uma Oferta Exclusiva de Retenção para Você!
              </h3>
              <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
                Sabemos o quanto o robô <strong>IMPORTHOURANDO</strong> economiza seu tempo gerando comissões diárias. Para você não perder seu acesso, o administrador liberou descontos especiais no ato:
              </p>
            </div>

            {/* Retention Offer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Offer 1: 10% OFF Semestral */}
              <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/50 hover:border-blue-500 transition-all space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase">
                  10% OFF
                </div>
                <div className="flex items-center gap-2 font-bold text-blue-900 text-base">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Plano Semestral
                </div>
                <div>
                  <div className="text-xs text-slate-400 line-through">De R$ 147,00 por 6 meses</div>
                  <div className="text-2xl font-black text-blue-700">R$ 132,30</div>
                  <div className="text-xs text-blue-800 font-semibold mt-0.5">Apenas R$ 22,05/mês (Economize 10%)</div>
                </div>
                <button
                  onClick={() => {
                    setIsRetentionView(false);
                    handleSelectPlanToUpgrade('SEMESTRAL', 10);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  Aceitar 10% OFF no Semestral
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Offer 2: 30% OFF Anual */}
              <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/60 hover:border-amber-500 transition-all space-y-3 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase">
                  👑 30% OFF ANUAL
                </div>
                <div className="flex items-center gap-2 font-bold text-amber-950 text-base">
                  <Crown className="w-5 h-5 text-amber-600" />
                  Licença Anual
                </div>
                <div>
                  <div className="text-xs text-slate-400 line-through">De R$ 247,00/ano</div>
                  <div className="text-2xl font-black text-amber-700">R$ 172,90</div>
                  <div className="text-xs text-amber-800 font-semibold mt-0.5">Apenas R$ 14,40/mês • Cobertura por 12 meses completos!</div>
                </div>
                <button
                  onClick={() => {
                    setIsRetentionView(false);
                    handleSelectPlanToUpgrade('ANUAL', 30);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  Aceitar 30% OFF no Anual
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <button
                onClick={() => setIsRetentionView(false)}
                className="font-semibold text-slate-600 hover:underline"
              >
                Voltar aos meus planos atuais
              </button>

              <button
                onClick={() => {
                  setIsCanceled(true);
                  setIsRetentionView(false);
                }}
                className="text-red-500 hover:text-red-700 font-medium underline"
              >
                Confirmar cancelamento (Entrar no ciclo de reconquista)
              </button>
            </div>
          </div>
        ) : showCheckout ? (
          /* SECTION 2: SIMULATED INSTANT PIX / MERCADO PAGO CHECKOUT */
          <div className="space-y-6 text-center">
            {paymentApproved ? (
              <div className="py-8 space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">
                  Pagamento Confirmado! 🎉
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Sua assinatura foi atualizada para o <strong>Plano {selectedPlan}</strong>.
                  {selectedPlan === 'ANUAL' && ' Você foi marcado como assinante do Plano ANUAL com validade de 12 meses!'}
                </p>
                <div className="text-xs text-slate-400">Notificação enviada ao painel do administrador em tempo real.</div>
              </div>
            ) : (
              <>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs uppercase mb-2">
                    Checkout PIX & Mercado Pago
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900">
                    Ativação do Plano {selectedPlan}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {discountPercent > 0 
                      ? `Desconto exclusivo de ${discountPercent}% aplicado pelo administrador!` 
                      : 'Selecione a forma de pagamento fornecida pelo administrador:'}
                  </p>
                </div>

                {/* Payment Method Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 max-w-sm mx-auto">
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

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-4">
                  <div className="text-left bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Plano Selecionado:</span>
                      <strong className="text-slate-900">{selectedPlan}</strong>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex justify-between text-purple-600 font-semibold">
                        <span>Desconto Aplicado:</span>
                        <span>{discountPercent}% OFF</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-900 font-bold text-sm border-t pt-1">
                      <span>Valor Final:</span>
                      <span className="text-emerald-600">
                        R$ {selectedPlan === 'ANUAL' 
                          ? (discountPercent === 30 ? '172,90' : '247,00')
                          : selectedPlan === 'SEMESTRAL'
                          ? (discountPercent === 10 ? '132,30' : '147,00')
                          : '29,90'}
                      </span>
                    </div>
                  </div>

                  {selectedPaymentMethod === 'PIX' ? (
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-inner">
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
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-left space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          Checkout Mercado Pago
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {paymentConfig.paymentInstructions || 'Pague de forma rápida e segura no Mercado Pago.'}
                        </p>
                      </div>

                      <a
                        href={paymentConfig.mercadoPagoCheckoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 rounded-xl bg-[#009EE3] hover:bg-[#0081B9] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pagar no Mercado Pago 💳
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <button
                    onClick={() => handleFinalizePayment(discountPercent > 0)}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    {isLoading ? 'Processando Liberação...' : 'Confirmar / Simular Pagamento Aprovado'}
                  </button>

                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-xs text-slate-500 hover:underline font-medium block mx-auto"
                  >
                    Voltar para opções de planos
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* SECTION 3: PLAN SELECTION MAIN VIEW */
          <div className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-full bg-[#2D3277]/10 text-[#2D3277] font-bold text-xs uppercase tracking-wider mb-2">
                Painel do Cliente • IMPORTHOURANDO
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Gerenciar Assinatura & Alteração de Perfil
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Altere seu plano a qualquer momento sem precisar falar com o administrador. Todas as adesões são liberadas instantaneamente no app.
              </p>
            </div>

            {/* Current Plan Badge */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Sua Assinatura Atual:</span>
                <span className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  {currentSubscriber.plan === 'ANUAL' ? (
                    <span className="text-amber-600 flex items-center gap-1.5">
                      <Crown className="w-5 h-5 text-amber-500" /> Plano Anual (12 Meses de Acesso)
                    </span>
                  ) : currentSubscriber.plan === 'SEMESTRAL' ? (
                    <span className="text-blue-600 flex items-center gap-1.5">
                      <Zap className="w-5 h-5 text-blue-500" /> Plano Semestral
                    </span>
                  ) : (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <RefreshCw className="w-5 h-5 text-emerald-500" /> Plano Mensal (R$ 29,90/mês)
                    </span>
                  )}
                </span>
              </div>

              {isCanceled ? (
                <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                  Cancelamento Solicitado
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  {currentSubscriber.status}
                </span>
              )}
            </div>

            {/* 3 Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Mensal */}
              <div className="p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4 bg-white shadow-sm">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    Plano Mensal
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-slate-900">R$ 29,90</span>
                    <span className="text-xs text-slate-500"> /mês</span>
                  </div>
                  <ul className="text-xs text-slate-600 mt-3 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Sem fidelidade
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Robô 24h ativo
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> links de afiliados próprios
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlanToUpgrade('MENSAL', 0)}
                  disabled={currentSubscriber.plan === 'MENSAL'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentSubscriber.plan === 'MENSAL'
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-slate-800 text-white hover:bg-slate-900'
                  }`}
                >
                  {currentSubscriber.plan === 'MENSAL' ? 'Seu Plano Atual' : 'Selecionar Mensal'}
                </button>
              </div>

              {/* Card 2: Semestral */}
              <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/30 hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                  ECONOMIZE
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Plano Semestral
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-extrabold text-blue-900">R$ 147,00</span>
                    <span className="text-xs text-slate-500"> /6 meses</span>
                    <div className="text-[11px] text-blue-700 font-semibold mt-0.5">Apenas R$ 24,50/mês</div>
                  </div>
                  <ul className="text-xs text-slate-600 mt-3 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Desconto em relação ao mensal
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Renovação a cada 6 meses
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" /> Suporte prioritário
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlanToUpgrade('SEMESTRAL', 0)}
                  disabled={currentSubscriber.plan === 'SEMESTRAL'}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    currentSubscriber.plan === 'SEMESTRAL'
                      ? 'bg-blue-200 text-blue-800 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                  }`}
                >
                  {currentSubscriber.plan === 'SEMESTRAL' ? 'Seu Plano Atual' : 'Migrar para Semestral'}
                </button>
              </div>

              {/* Card 3: Anual */}
              <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 hover:border-amber-500 transition-all flex flex-col justify-between space-y-4 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Mais Vantajoso
                </div>
                <div>
                  <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                    <Crown className="w-4 h-4 text-amber-600" />
                    Plano Anual
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-amber-900">R$ 247,00</span>
                    <span className="text-xs text-slate-500"> /ano</span>
                    <div className="text-[11px] text-amber-800 font-bold mt-0.5">Apenas R$ 20,58/mês</div>
                  </div>
                  <ul className="text-xs text-slate-700 mt-3 space-y-1.5 font-medium">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> <strong>12 Meses:</strong> Maior desconto por mês
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Sem riscos de reajuste no período
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Acesso total a todos os recursos
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlanToUpgrade('ANUAL', 0)}
                  disabled={currentSubscriber.plan === 'ANUAL'}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    currentSubscriber.plan === 'ANUAL'
                      ? 'bg-amber-200 text-amber-900 cursor-default'
                      : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200'
                  }`}
                >
                  {currentSubscriber.plan === 'ANUAL' ? 'Seu Plano Atual' : 'Migrar para Plano Anual'}
                </button>
              </div>
            </div>

            {/* Bottom Actions for Monthly Subscribers */}
            {currentSubscriber.plan === 'MENSAL' && !isCanceled && (
              <div className="pt-4 border-t text-center">
                <button
                  onClick={handleCancelIntentClick}
                  className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
                >
                  Desejo cancelar minha assinatura mensal
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
