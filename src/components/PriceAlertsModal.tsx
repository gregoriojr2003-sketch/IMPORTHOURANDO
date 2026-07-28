import React, { useState } from 'react';
import { X, Bell, BellRing, Plus, Trash2, CheckCircle2, AlertTriangle, Sparkles, Send, ShieldCheck, Tag, DollarSign, Percent, Filter, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { PriceAlertRule, MercadoLivreProduct } from '../types';

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceAlerts: PriceAlertRule[];
  onAddAlert: (newAlert: Omit<PriceAlertRule, 'id' | 'createdAt'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  products: MercadoLivreProduct[];
  onSelectProductToDispatch: (product: MercadoLivreProduct) => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  isOpen,
  onClose,
  priceAlerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  products,
  onSelectProductToDispatch,
  onRequirePlanActivation
}) => {
  const [keyword, setKeyword] = useState('');
  const [targetDiscount, setTargetDiscount] = useState<number>(20);
  const [targetMaxPrice, setTargetMaxPrice] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'RULES'>('MATCHES');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    if (onRequirePlanActivation && !onRequirePlanActivation('criar alertas automáticos de preço')) {
      return;
    }

    onAddAlert({
      keyword: keyword.trim(),
      targetDiscountPercentage: Number(targetDiscount) || 10,
      targetMaxPrice: targetMaxPrice ? Number(targetMaxPrice) : undefined,
      enabled: true
    });

    setKeyword('');
    setTargetMaxPrice('');
    setSuccessMsg(`Alerta para "${keyword.trim()}" criado com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Calculate matching products
  const activeRules = priceAlerts.filter(r => r.enabled);

  const matchedProductsWithRules = products.map(product => {
    const matchedRule = activeRules.find(rule => {
      const keywordLower = rule.keyword.toLowerCase();
      const titleLower = product.title.toLowerCase();
      const categoryLower = (product.category || '').toLowerCase();
      
      const keywordMatches = titleLower.includes(keywordLower) || categoryLower.includes(keywordLower);
      const discountMatches = product.discountPercentage >= rule.targetDiscountPercentage;
      const priceMatches = rule.targetMaxPrice ? product.price <= rule.targetMaxPrice : true;

      return keywordMatches && discountMatches && priceMatches;
    });

    return {
      product,
      matchedRule
    };
  }).filter(item => item.matchedRule !== undefined);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl text-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2D3277] to-[#1E2255] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#FFE600] text-[#2D3277] font-bold shadow-md">
              <BellRing className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">Alertas de Preço Mínimo</h3>
                <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                  {matchedProductsWithRules.length} Ofertas Alertas!
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Monitore palavras-chave (ex: 'iPhone', 'Monitor') e seja avisado quando o desconto atingir sua meta.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('MATCHES')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'MATCHES'
                ? 'bg-white text-[#2D3277] border-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Ofertas Capturadas pelos Alertas</span>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-mono">
              {matchedProductsWithRules.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RULES')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'RULES'
                ? 'bg-white text-[#2D3277] border-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Bell className="w-4 h-4 text-[#2D3277]" />
            <span>Gerenciar Minhas Regras ({priceAlerts.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: MATCHED PRODUCTS */}
          {activeTab === 'MATCHES' && (
            <div className="space-y-4">
              {matchedProductsWithRules.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">Nenhuma oferta bateu as metas de preço agora</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Crie novas palavras-chave de alerta ou ajuste as porcentagens de desconto mínimo para monitorar em tempo real.
                  </p>
                  <button
                    onClick={() => setActiveTab('RULES')}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#2D3277] text-white font-bold text-xs hover:bg-[#1E2255] transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-[#FFE600]" />
                    <span>Criar Novo Alerta de Preço</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedProductsWithRules.map(({ product, matchedRule }) => (
                    <div
                      key={product.id}
                      className="bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                    >
                      {/* Top Matching Badge */}
                      <div className="absolute top-0 right-0 bg-emerald-600 text-white font-black text-[9px] px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span>Regra Batida: "{matchedRule?.keyword}"</span>
                      </div>

                      <div className="flex gap-3 items-start mt-2">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-20 h-20 object-cover rounded-xl border border-emerald-200 shrink-0 bg-white"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {product.marketplace}
                          </span>
                          <h5 className="font-bold text-xs text-slate-900 line-clamp-2">{product.title}</h5>
                          
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-base font-black text-emerald-700 font-mono">
                              R$ {product.price.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs text-slate-400 line-through font-mono">
                              R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                            <span className="text-xs font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                              -{product.discountPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center justify-between">
                        <div className="text-[10px] text-emerald-900 font-medium">
                          Meta configurada: <strong>{matchedRule?.targetDiscountPercentage}% OFF</strong>
                          {matchedRule?.targetMaxPrice && ` | Máx: R$ ${matchedRule.targetMaxPrice}`}
                        </div>

                        <button
                          onClick={() => {
                            onSelectProductToDispatch(product);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Disparar Oferta</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE RULES & CREATE FORM */}
          {activeTab === 'RULES' && (
            <div className="space-y-6">
              {/* Form Create Rule */}
              <form onSubmit={handleCreateAlert} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-[#2D3277]" />
                  <span>Adicionar Nova Palavra-Chave de Alerta</span>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Palavra-Chave / Produto:
                    </label>
                    <input
                      type="text"
                      required
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="ex: iPhone, Monitor, Air Fryer"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#2D3277] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Desconto Mínimo Meta (%):
                    </label>
                    <div className="relative">
                      <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={targetDiscount}
                        onChange={(e) => setTargetDiscount(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#2D3277] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Preço Máximo Teto (Opcional R$):
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        placeholder="ex: 3500"
                        value={targetMaxPrice}
                        onChange={(e) => setTargetMaxPrice(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#2D3277] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-5 rounded-xl bg-[#2D3277] hover:bg-[#1E2255] text-white font-black text-xs shadow transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-[#FFE600]" />
                    <span>Cadastrar Alerta</span>
                  </button>
                </div>
              </form>

              {/* Rules List Table */}
              <div className="space-y-2">
                <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider">
                  Minhas Palavras-Chave de Alertas Ativas ({priceAlerts.length})
                </h4>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                  {priceAlerts.map((rule) => {
                    const matchCountForThisRule = products.filter(p => {
                      const kw = rule.keyword.toLowerCase();
                      const matchKw = p.title.toLowerCase().includes(kw) || (p.category || '').toLowerCase().includes(kw);
                      const matchDisc = p.discountPercentage >= rule.targetDiscountPercentage;
                      const matchPrice = rule.targetMaxPrice ? p.price <= rule.targetMaxPrice : true;
                      return matchKw && matchDisc && matchPrice;
                    }).length;

                    return (
                      <div key={rule.id} className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => onToggleAlert(rule.id)}
                            className="text-slate-400 hover:text-[#2D3277] transition-colors"
                            title={rule.enabled ? 'Desativar alerta' : 'Ativar alerta'}
                          >
                            {rule.enabled ? (
                              <ToggleRight className="w-7 h-7 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-slate-300" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <strong className="text-xs font-black text-slate-900">"{rule.keyword}"</strong>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                rule.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {rule.enabled ? 'Ativo' : 'Pausado'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>Meta Desconto: <strong>Mínimo {rule.targetDiscountPercentage}% OFF</strong></span>
                              {rule.targetMaxPrice && (
                                <span>Preço Máx: <strong>R$ {rule.targetMaxPrice}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-[11px] font-extrabold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl">
                            {matchCountForThisRule} ofertas encontradas
                          </span>

                          <button
                            onClick={() => onDeleteAlert(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir regra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
