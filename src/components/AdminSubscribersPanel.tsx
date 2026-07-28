import React, { useState, useEffect } from 'react';
import { Subscriber, AdminNotification, SubscriptionPlan, AdminPaymentConfig } from '../types';
import { 
  Users, Crown, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, 
  Bell, DollarSign, Gift, ArrowUpRight, Search, MessageSquare, 
  Trash2, UserPlus, FileText, BadgeCheck, Zap, Sparkles,
  CreditCard, QrCode, Link2, Save, ExternalLink, Check, Copy,
  Edit3, Settings, RotateCcw, XCircle, ArrowRightLeft, UserCheck
} from 'lucide-react';

interface AdminSubscribersPanelProps {
  subscribers: Subscriber[];
  notifications: AdminNotification[];
  onRefresh: () => void;
  onMarkNotificationsRead: () => void;
  onUpdateSubscriber?: (sub: Subscriber) => void;
}

export const AdminSubscribersPanel: React.FC<AdminSubscribersPanelProps> = ({
  subscribers,
  notifications,
  onRefresh,
  onMarkNotificationsRead,
  onUpdateSubscriber
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'RULE_1_LIFETIME' | 'RULE_2_RECONQUEST' | 'RULE_3_DISCOUNTS' | 'NOTIFICATIONS' | 'PAYMENT_SETTINGS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'ALL' | SubscriptionPlan>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Edit / Convert Subscriber State
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPlan, setEditPlan] = useState<SubscriptionPlan>('MENSAL');
  const [editStatus, setEditStatus] = useState<Subscriber['status']>('ATIVO');
  const [editIsExempt, setEditIsExempt] = useState(false);
  const [editDiscountApplied, setEditDiscountApplied] = useState(0);
  const [editTotalPaid, setEditTotalPaid] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Payment Config State for ADM
  const [paymentConfig, setPaymentConfig] = useState<AdminPaymentConfig>({
    pixKey: '12.345.678/0001-90',
    pixKeyType: 'CNPJ',
    pixBeneficiary: 'IMPORTHOURANDO TECNOLOGIA & PAGAMENTOS LTDA',
    pixCopyPasteCode: '00020126580014br.gov.bcb.pix0136importhourando-pagamentos-pix-key-981273912835204000053039865405347.905802BR5920IMPORTHOURANDO_BOT6009SAO_PAULO62070503***6304A1B2',
    mercadoPagoCheckoutUrl: 'https://mpago.la/2a3b4c',
    paymentInstructions: 'Após efetuar o pagamento via PIX ou Mercado Pago, seu acesso é liberado instantaneamente.'
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Fetch payment config on mount
  useEffect(() => {
    fetch('/api/admin/payment-config')
      .then(res => res.json())
      .then(data => {
        if (data.paymentConfig) setPaymentConfig(data.paymentConfig);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPayment(true);
    setPaymentSuccessMsg('');
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentConfig)
      });
      const data = await res.json();
      if (data.success && data.paymentConfig) {
        setPaymentConfig(data.paymentConfig);
        setPaymentSuccessMsg('Meios de pagamento (PIX e Mercado Pago) salvos com sucesso! Todos os interessados verão os novos dados automaticamente.');
        setTimeout(() => setPaymentSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPayment(false);
    }
  };


  // Open & Convert Subscriber Modal
  const handleOpenEditModal = (sub: Subscriber) => {
    setEditingSub(sub);
    setEditName(sub.name);
    setEditEmail(sub.email);
    setEditPhone(sub.phone);
    setEditPlan(sub.plan);
    setEditStatus(sub.status);
    setEditIsExempt(Boolean(sub.isLifetimeExemptFromMonitoring));
    setEditDiscountApplied(sub.discountApplied || 0);
    setEditTotalPaid(sub.totalPaid || 0);
    setEditNotes(sub.notes || '');
    setEditSuccessMsg('');
  };

  const handleSaveEditedSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setIsSavingEdit(true);
    setEditSuccessMsg('');
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSub.id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          plan: editPlan,
          status: editStatus,
          isLifetimeExemptFromMonitoring: editIsExempt,
          discountApplied: editDiscountApplied,
          totalPaid: editTotalPaid,
          notes: editNotes
        })
      });
      const data = await res.json();
      if (res.ok && data.subscriber) {
        setEditSuccessMsg('✨ Perfil e status convertidos com sucesso pelo administrador!');
        if (onUpdateSubscriber) {
          onUpdateSubscriber(data.subscriber);
        }
        onRefresh();
        setTimeout(() => {
          setEditingSub(null);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // New subscriber form
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubPlan, setNewSubPlan] = useState<SubscriptionPlan>('MENSAL');
  const [newSubNotes, setNewSubNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sub.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sub.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;

    if (activeTab === 'RULE_1_LIFETIME') {
      return sub.plan === 'ANUAL' || sub.isLifetimeExemptFromMonitoring;
    }
    if (activeTab === 'RULE_2_RECONQUEST') {
      return sub.status === 'RECONQUISTA_3M' || sub.status === 'CANCELADO';
    }
    if (activeTab === 'RULE_3_DISCOUNTS') {
      return (sub.discountApplied && sub.discountApplied > 0) || sub.notes?.toLowerCase().includes('converteu');
    }

    if (selectedPlanFilter !== 'ALL') {
      return sub.plan === selectedPlanFilter;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Stats calculation
  const totalSubscribers = subscribers.length;
  const activeCount = subscribers.filter(s => s.status === 'ATIVO').length;
  const lifetimeCount = subscribers.filter(s => s.plan === 'VITALICIO').length;
  const reconquestCount = subscribers.filter(s => s.status === 'RECONQUISTA_3M').length;
  const convertedDiscountCount = subscribers.filter(s => (s.discountApplied || 0) > 0).length;
  const totalRevenue = subscribers.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);

  const handleCreateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubName,
          email: newSubEmail,
          phone: newSubPhone,
          plan: newSubPlan,
          status: 'ATIVO',
          notes: newSubNotes
        })
      });
      if (res.ok) {
        onRefresh();
        setIsNewModalOpen(false);
        setNewSubName('');
        setNewSubEmail('');
        setNewSubPhone('');
        setNewSubNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getPlanBadge = (plan: SubscriptionPlan, isExempt?: boolean) => {
    switch (plan) {
      case 'ANUAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Anual {isExempt && '(Isento de Cobrança)'}
          </span>
        );
      case 'SEMESTRAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Semestral
          </span>
        );
      case 'MENSAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            Mensal
          </span>
        );
    }
  };

  const getStatusBadge = (status: Subscriber['status']) => {
    switch (status) {
      case 'ATIVO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
          </span>
        );
      case 'RECONQUISTA_3M':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Reconquista (3 Meses)
          </span>
        );
      case 'CANCELADO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#2D3277] uppercase tracking-wider mb-1">
            <Crown className="w-4 h-4 text-amber-500" /> Painel de Gestão de Licenças & Clientes
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Assinantes do IMPORTHOURANDO</h2>
          <p className="text-sm text-slate-500 mt-1">
            Acompanhe adesões, migrações de perfil sem contato humano, clientes vitalícios isentos e alertas de reconquista.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab('NOTIFICATIONS');
              onMarkNotificationsRead();
            }}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all"
          >
            <Bell className="w-4 h-4 text-[#2D3277]" />
            Notificações
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D3277] text-white font-semibold text-sm hover:bg-[#20245a] transition-all shadow-md shadow-indigo-100"
          >
            <UserPlus className="w-4 h-4" />
            Novo Assinante
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total de Clientes</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalSubscribers}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">{activeCount} ativos no robô</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Licença Anual</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{lifetimeCount}</div>
          <div className="text-xs text-slate-500 mt-1">Regra 1: Anuais / Isentos</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ciclo Reconquista (3M)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{reconquestCount}</div>
          <div className="text-xs text-slate-500 mt-1">Regra 2: Notificar benefícios</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Retenções / Descontos</span>
            <Gift className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 mt-2">{convertedDiscountCount}</div>
          <div className="text-xs text-slate-500 mt-1">Regra 3: 10% Sem / 30% Vit</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Receita acumulada em licenças</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'ALL'
                ? 'border-[#2D3277] text-[#2D3277]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Todos os Clientes ({subscribers.length})
          </button>

          <button
            onClick={() => setActiveTab('RULE_1_LIFETIME')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'RULE_1_LIFETIME'
                ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            Regra 1: Anuais ({lifetimeCount})
          </button>

          <button
            onClick={() => setActiveTab('RULE_2_RECONQUEST')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'RULE_2_RECONQUEST'
                ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Regra 2: Reconquista 3 Meses ({reconquestCount})
          </button>

          <button
            onClick={() => setActiveTab('RULE_3_DISCOUNTS')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'RULE_3_DISCOUNTS'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-4 h-4 text-purple-500" />
            Regra 3: Descontos & Retenções ({convertedDiscountCount})
          </button>

          <button
            onClick={() => {
              setActiveTab('NOTIFICATIONS');
              onMarkNotificationsRead();
            }}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'NOTIFICATIONS'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-blue-500" />
            Notificações do Adm {unreadCount > 0 && `(${unreadCount} novas)`}
          </button>

          <button
            onClick={() => setActiveTab('PAYMENT_SETTINGS')}
            className={`pb-3 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'PAYMENT_SETTINGS'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/60 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            💳 Configurar Pagamentos (PIX / Mercado Pago)
          </button>
        </div>

        {/* Tab Content 1: ALL SUBSCRIBERS / RULES 1, 2, 3 LIST */}
        {activeTab === 'PAYMENT_SETTINGS' ? (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-300 uppercase tracking-wider">
                <CreditCard className="w-4 h-4" /> Gestão Centralizada de Meios de Pagamento
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Cadastrar Chave PIX e Link do Mercado Pago
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Estes dados são fornecidos diretamente pelo Administrador e ficam <strong>atualizados em tempo real</strong> em todas as telas de renovação e assinatura do aplicativo.
              </p>
            </div>

            {paymentSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePaymentConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PIX Configuration Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b pb-3 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    1. Dados da Chave PIX Direta
                  </h4>
                  <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Sincronizado 24h
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Chave PIX</label>
                    <select
                      value={paymentConfig.pixKeyType}
                      onChange={e => setPaymentConfig({ ...paymentConfig, pixKeyType: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="EMAIL">E-mail</option>
                      <option value="PHONE">Telefone</option>
                      <option value="EVP">Chave Aleatória (EVP)</option>
                      <option value="CPF">CPF</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chave PIX</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 12.345.678/0001-90 ou financeiro@suaempresa.com"
                      value={paymentConfig.pixKey}
                      onChange={e => setPaymentConfig({ ...paymentConfig, pixKey: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Beneficiário / Favorecido do PIX</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: IMPORTHOURANDO PAGAMENTOS LTDA"
                      value={paymentConfig.pixBeneficiary}
                      onChange={e => setPaymentConfig({ ...paymentConfig, pixBeneficiary: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código PIX Copia e Cola / Payload</label>
                    <textarea
                      rows={3}
                      placeholder="Cole o código retornado pelo seu banco ou banco digital (BR Code)"
                      value={paymentConfig.pixCopyPasteCode}
                      onChange={e => setPaymentConfig({ ...paymentConfig, pixCopyPasteCode: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                    />
                  </div>
                </div>
              </div>

              {/* Mercado Pago Configuration Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="border-b pb-3 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-600" />
                    2. Link de Checkout Mercado Pago
                  </h4>
                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Mercado Pago
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Link / URL de Pagamento do Mercado Pago
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://mpago.la/xxxxxx ou https://www.mercadopago.com.br/checkout/..."
                      value={paymentConfig.mercadoPagoCheckoutUrl}
                      onChange={e => setPaymentConfig({ ...paymentConfig, mercadoPagoCheckoutUrl: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277] font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Você pode criar o link de pagamento ou preferência no seu painel do Mercado Pago.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Instruções de Pagamento aos Interessados
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ex: Após concluir o PIX ou checkout no Mercado Pago, clique no botão de liberação."
                      value={paymentConfig.paymentInstructions}
                      onChange={e => setPaymentConfig({ ...paymentConfig, paymentInstructions: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                    />
                  </div>

                  {/* Live Preview Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <span className="font-bold text-slate-700 block">👁️ Pré-visualização do Link no Botão do Cliente:</span>
                    <a
                      href={paymentConfig.mercadoPagoCheckoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#009EE3] text-white font-bold text-xs hover:bg-[#0081B9] transition-all"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pagar via Mercado Pago 💳
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Save Controls Span Full Width */}
              <div className="md:col-span-2 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500">
                  {paymentConfig.updatedAt && `Última atualização: ${paymentConfig.updatedAt}`}
                </div>

                <button
                  type="submit"
                  disabled={isSavingPayment}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSavingPayment ? 'Atualizando...' : 'Salvar Meios de Pagamento (PIX / Mercado Pago)'}
                </button>
              </div>
            </form>
          </div>
        ) : activeTab !== 'NOTIFICATIONS' ? (

          <div className="p-6 space-y-4">
            {/* Rule Explanatory Banners */}
            {activeTab === 'RULE_1_LIFETIME' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-1">Regra 1: Licenças Anuais (Isentas ou Ativas)</strong>
                  Os clientes listados abaixo aderiram ao plano anual ou foram marcados com isenção pelo administrador. Eles possuem contrato de 12 meses renovável e isenção de avisos diários no robô IMPORTHOURANDO.
                </div>
              </div>
            )}

            {activeTab === 'RULE_2_RECONQUEST' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-1">Regra 2: Intervalo de Reconquista de 3 Meses</strong>
                  Assinantes que não renovaram a assinatura mensal/semestral entram nesta lista. O robô dispara notificações periódicas durante a janela de 3 meses destacando as vantagens de retornar ao seleto grupo de afiliados do IMPORTHOURANDO.
                </div>
              </div>
            )}

            {activeTab === 'RULE_3_DISCOUNTS' && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs leading-relaxed flex items-start gap-3">
                <Gift className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-sm block mb-1">Regra 3: Conversão Facilitada de Cancelamentos em Ofertas Especiais</strong>
                  Os mensalistas não possuem fidelidade. Porém, ao iniciarem o cancelamento, o aplicativo apresenta instantaneamente <strong>10% de desconto na assinatura Semestral</strong> e <strong>30% de desconto na assinatura Anual</strong>. Abaixo estão os clientes que aproveitaram essa retenção facilitada!
                </div>
              </div>
            )}

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                />
              </div>

              {activeTab === 'ALL' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>Filtrar Plano:</span>
                  <select
                    value={selectedPlanFilter}
                    onChange={e => setSelectedPlanFilter(e.target.value as any)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  >
                    <option value="ALL">Todos os Planos</option>
                    <option value="MENSAL">Apenas Mensal</option>
                    <option value="SEMESTRAL">Apenas Semestral</option>
                    <option value="ANUAL">Apenas Anual</option>
                  </select>
                </div>
              )}
            </div>

            {/* Subscribers Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Cliente / E-mail</th>
                    <th className="py-3 px-4">Plano Atual</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Total Pago</th>
                    <th className="py-3 px-4">Desconto / Regra</th>
                    <th className="py-3 px-4 text-right">Ação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nenhum assinante encontrado para esta categoria de filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{sub.name}</div>
                          <div className="text-xs text-slate-500">{sub.email} • {sub.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {getPlanBadge(sub.plan, sub.isLifetimeExemptFromMonitoring)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(sub.status)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          R$ {(sub.totalPaid || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {sub.discountApplied ? (
                            <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                              <Gift className="w-3 h-3" /> {sub.discountApplied}% OFF aplicado
                            </span>
                          ) : sub.isLifetimeExemptFromMonitoring ? (
                            <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Regra 1: Marcado Isento
                            </span>
                          ) : (
                            <span className="text-slate-400">Padrão Sem Desconto</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(sub)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2D3277] text-white hover:bg-[#1f2356] font-bold text-xs shadow-xs transition-all"
                              title="Converter perfil ou status do assinante"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Converter Perfil / Status
                            </button>
                            <a
                              href={`https://wa.me/${sub.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(sub.name)}%2C%20tudo%20bem%3F%20Falo%20do%20app%20IMPORTHOURANDO%20!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab Content 2: ADMIN REAL-TIME NOTIFICATIONS FEED */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#2D3277]" />
                  Central de Notificações do Administrador
                </h3>
                <p className="text-xs text-slate-500">
                  Alertas em tempo real de novas adesões, migrações de perfil, retenções aceitas com desconto e isenções.
                </p>
              </div>

              <button
                onClick={onMarkNotificationsRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Marcar todas como lidas
              </button>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhuma notificação registrada até o momento.
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                      notif.read ? 'bg-white border-slate-200' : 'bg-blue-50/60 border-blue-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${notif.badgeColor || 'bg-blue-600'}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{notif.subscriberName}</span>
                          <span className="text-xs text-slate-400">• {notif.subscriberEmail}</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1 leading-snug font-medium">
                          {notif.message}
                        </p>
                        <span className="text-xs text-slate-400 mt-2 block">{notif.timestamp}</span>
                      </div>
                    </div>

                    {!notif.read && (
                      <span className="shrink-0 text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Nova
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Subscriber Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2D3277]" />
                Cadastrar / Atualizar Assinante
              </h3>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubscriber} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="joao@gmail.com"
                    value={newSubEmail}
                    onChange={e => setNewSubEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    placeholder="+55 11 99999-8888"
                    value={newSubPhone}
                    onChange={e => setNewSubPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plano Escolhido</label>
                <select
                  value={newSubPlan}
                  onChange={e => setNewSubPlan(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                >
                  <option value="MENSAL">Plano Mensal (R$ 29,90/mês)</option>
                  <option value="SEMESTRAL">Plano Semestral (R$ 147,00/6 meses)</option>
                  <option value="ANUAL">Plano Anual (R$ 247,00/ano - Regra 1)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações Internas</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Cliente VIP recebido via indicação..."
                  value={newSubNotes}
                  onChange={e => setNewSubNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#2D3277] text-white rounded-xl text-sm font-bold hover:bg-[#20245a] transition-all"
                >
                  {isSaving ? 'Salvando...' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Subscriber Profile & Status Conversion Modal */}
      {editingSub && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in duration-200 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-[#2D3277] text-[11px] font-extrabold uppercase mb-1">
                  <Settings className="w-3.5 h-3.5" /> Painel do Administrador
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  Converter Perfil & Status do Assinante
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliente: <strong className="text-slate-800">{editingSub.name}</strong> ({editingSub.email})
                </p>
              </div>
              <button 
                onClick={() => setEditingSub(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                ✕
              </button>
            </div>

            {/* Conversion Shortcuts Bar */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Atalhos Rápidos de Conversão de Perfil:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditPlan('ANUAL');
                    setEditStatus('ATIVO');
                    setEditIsExempt(true);
                    setEditTotalPaid(247);
                  }}
                  className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-2 transition-all text-left"
                >
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="block font-black">1. Converter em Anual Isento</span>
                    <span className="text-[10px] text-amber-700 font-normal">Plano Anual + Isenção de Cobrança</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('ATIVO');
                  }}
                  className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2 transition-all text-left"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-black">2. Reativar Acesso (Ativo)</span>
                    <span className="text-[10px] text-emerald-700 font-normal">Liberar no robô de automação</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('RECONQUISTA_3M');
                  }}
                  className="p-2.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold flex items-center gap-2 transition-all text-left"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="block font-black">3. Mover p/ Reconquista (Regra 2)</span>
                    <span className="text-[10px] text-blue-700 font-normal">Regra de 3 Meses sem fidelidade</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('CANCELADO');
                  }}
                  className="p-2.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 text-xs font-bold flex items-center gap-2 transition-all text-left"
                >
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span className="block font-black">4. Interromper / Cancelar</span>
                    <span className="text-[10px] text-red-700 font-normal">Bloquear novos disparos</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Edit Form */}
            <form onSubmit={handleSaveEditedSubscriber} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                    Status do Assinante
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  >
                    <option value="ATIVO">🟢 ATIVO (Acesso Liberado)</option>
                    <option value="RECONQUISTA_3M">🟡 RECONQUISTA_3M (Regra 2 - 3 Meses)</option>
                    <option value="CANCELADO">🔴 CANCELADO (Acesso Bloqueado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-800 uppercase mb-1">
                    Plano Escolhido / Perfil
                  </label>
                  <select
                    value={editPlan}
                    onChange={e => setEditPlan(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  >
                    <option value="MENSAL">Mensal (R$ 29,90/mês)</option>
                    <option value="SEMESTRAL">Semestral (R$ 147,00/6 meses)</option>
                    <option value="ANUAL">Anual (R$ 247,00/ano - Regra 1)</option>
                  </select>
                </div>
              </div>

              {/* Rule 1 Exemption Toggle */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-amber-900">
                      Regra 1: Marcar Isento de Monitoramento de Cobrança Recorrente
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Evita cobranças recorrentes no sistema e concede acesso perpétuo.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editIsExempt}
                  onChange={e => setEditIsExempt(e.target.checked)}
                  className="w-5 h-5 text-amber-600 rounded border-amber-300 focus:ring-amber-500 shrink-0 cursor-pointer"
                />
              </div>

              {/* Financial adjustment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Desconto Aplicado (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editDiscountApplied}
                    onChange={e => setEditDiscountApplied(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Total Pago Acumulado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editTotalPaid}
                    onChange={e => setEditTotalPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  />
                </div>
              </div>

              {/* Contact info edit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Observações Internas do Administrador</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Ex: Convertido diretamente pelo Administrador..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D3277]"
                />
              </div>

              {editSuccessMsg && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  {editSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-6 py-2.5 bg-[#2D3277] text-white rounded-xl text-xs font-bold hover:bg-[#1a1f56] transition-all flex items-center gap-2 shadow-md shadow-indigo-100"
                >
                  <Save className="w-4 h-4" />
                  {isSavingEdit ? 'Salvando Alteração...' : 'Salvar Conversão do Assinante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
