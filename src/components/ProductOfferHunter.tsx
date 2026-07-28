import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  ExternalLink, 
  Tag, 
  ShieldCheck, 
  Percent, 
  ShoppingBag, 
  Target, 
  SlidersHorizontal, 
  Award, 
  Star, 
  DollarSign, 
  Truck, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  X,
  Sliders
} from 'lucide-react';
import { MercadoLivreProduct, AutoSchedulerConfig, PriceAlertRule } from '../types';
import { detectProductNiche } from '../utils/nicheDetector';
import { ImageBadgeOverlayModal } from './ImageBadgeOverlayModal';
import { Bell, BellRing } from 'lucide-react';
import { 
  PriorityCriterion, 
  PRIORITY_OPTIONS, 
  getPriorityOption, 
  sortProductsByPriorities 
} from '../utils/productSorter';

interface ProductOfferHunterProps {
  products: MercadoLivreProduct[];
  onSelectProductToDispatch: (product: MercadoLivreProduct) => void;
  affiliateTag: string;
  schedulerConfig?: AutoSchedulerConfig;
  onSaveSchedulerConfig?: (affiliateUpdate?: any, schedulerUpdate?: Partial<AutoSchedulerConfig>) => void;
  priceAlerts?: PriceAlertRule[];
  onOpenPriceAlerts?: () => void;
}

export const ProductOfferHunter: React.FC<ProductOfferHunterProps> = ({
  products,
  onSelectProductToDispatch,
  affiliateTag,
  schedulerConfig,
  onSaveSchedulerConfig,
  priceAlerts = [],
  onOpenPriceAlerts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('ALL');
  
  // Requirement 1: Slider for minimum discount
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [freeShippingOnly, setFreeShippingOnly] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Requirement 2: Bot Priority Ranking (1º, 2º, 3º)
  const [botPriority1, setBotPriority1] = useState<PriorityCriterion>(schedulerConfig?.botPriority1 || 'DISCOUNT_PERCENT');
  const [botPriority2, setBotPriority2] = useState<PriorityCriterion>(schedulerConfig?.botPriority2 || 'SAVINGS_AMOUNT');
  const [botPriority3, setBotPriority3] = useState<PriorityCriterion>(schedulerConfig?.botPriority3 || 'RATING');
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [savePrioritySuccess, setSavePrioritySuccess] = useState(false);

  // Image Badge Overlay Modal state
  const [badgeProduct, setBadgeProduct] = useState<MercadoLivreProduct | null>(null);

  const categoriesList = ['TODAS', 'Eletrônicos', 'Celulares', 'Eletrodomésticos', 'Games', 'Áudio', 'Moda', 'Casa'];

  // Step 1: Filter products by search, category, marketplace, slider minDiscount and free shipping
  const filteredProducts = products.filter((prod) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = prod.title.toLowerCase().includes(q);
      const matchCategory = prod.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory) return false;
    }
    if (selectedCategory !== 'TODAS' && prod.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (selectedMarketplace !== 'ALL' && prod.marketplace !== selectedMarketplace) {
      return false;
    }
    // Filter strictly by slider value
    if (prod.discountPercentage < minDiscount) {
      return false;
    }
    if (freeShippingOnly && !prod.shippingFree) {
      return false;
    }
    return true;
  });

  // Step 2: Sort filtered products according to user's 1º, 2º, 3º priority ranking
  const sortedProducts = sortProductsByPriorities(
    filteredProducts,
    botPriority1,
    botPriority2,
    botPriority3
  );

  const getMatchingAlertRule = (product: MercadoLivreProduct) => {
    const activeRules = priceAlerts.filter(r => r.enabled);
    return activeRules.find(rule => {
      const kw = rule.keyword.toLowerCase();
      const titleMatches = product.title.toLowerCase().includes(kw) || (product.category || '').toLowerCase().includes(kw);
      const discountMatches = product.discountPercentage >= rule.targetDiscountPercentage;
      const priceMatches = rule.targetMaxPrice ? product.price <= rule.targetMaxPrice : true;
      return titleMatches && discountMatches && priceMatches;
    });
  };

  const handleCopyLink = (prod: MercadoLivreProduct) => {
    navigator.clipboard.writeText(prod.affiliateUrl);
    setCopiedId(prod.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveBotPriorities = () => {
    if (onSaveSchedulerConfig) {
      onSaveSchedulerConfig(undefined, {
        botPriority1,
        botPriority2,
        botPriority3
      });
    }
    setSavePrioritySuccess(true);
    setTimeout(() => {
      setSavePrioritySuccess(false);
      setIsPriorityModalOpen(false);
    }, 1200);
  };

  const applyPresetStrategy = (p1: PriorityCriterion, p2: PriorityCriterion, p3: PriorityCriterion) => {
    setBotPriority1(p1);
    setBotPriority2(p2);
    setBotPriority3(p3);
  };

  const renderMarketplaceBadge = (mp?: string) => {
    switch (mp) {
      case 'SHOPEE':
        return <span className="bg-orange-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">Shopee</span>;
      case 'AMAZON':
        return <span className="bg-slate-900 text-amber-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">Amazon</span>;
      case 'ALIEXPRESS':
        return <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">AliExpress</span>;
      case 'TEMU':
        return <span className="bg-amber-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">Temu</span>;
      case 'MAGALU':
        return <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">Magalu</span>;
      default:
        return <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow">Mercado Livre</span>;
    }
  };

  const p1Opt = getPriorityOption(botPriority1);
  const p2Opt = getPriorityOption(botPriority2);
  const p3Opt = getPriorityOption(botPriority3);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#3483FA]" />
              <span>Radar Multi-Marketplace de Ofertas</span>
            </h2>
            <p className="text-xs text-slate-500">
              Monitore e ordene ofertas no Mercado Livre, Shopee, Amazon, AliExpress, Temu e Magalu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Price Alerts Button */}
            {onOpenPriceAlerts && (
              <button
                type="button"
                onClick={onOpenPriceAlerts}
                className="bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-2 shadow transition-all shrink-0 active:scale-95"
              >
                <Bell className="w-4 h-4 text-[#FFE600] animate-bounce" />
                <span>Alertas de Preço Mínimo</span>
              </button>
            )}

            {/* Preference Button Requirement 2 */}
            <button
              type="button"
              onClick={() => setIsPriorityModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow transition-all shrink-0 active:scale-95"
            >
              <Target className="w-4 h-4 text-[#FFE600]" />
              <span>Prioridades do Bot (1º, 2º, 3º)</span>
            </button>

            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <span>Encontrados:</span>
              <strong className="text-[#2D3277] font-bold">{sortedProducts.length} produtos</strong>
            </div>
          </div>
        </div>

        {/* Marketplace Selection Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          {[
            { id: 'ALL', name: '🌐 Todos os Marketplaces' },
            { id: 'MERCADO_LIVRE', name: '🟡 Mercado Livre' },
            { id: 'SHOPEE', name: '🍊 Shopee' },
            { id: 'AMAZON', name: '📦 Amazon' },
            { id: 'ALIEXPRESS', name: '🔴 AliExpress' },
            { id: 'TEMU', name: '🔶 Temu' },
            { id: 'MAGALU', name: '💙 Magalu' },
          ].map((mp) => (
            <button
              key={mp.id}
              onClick={() => setSelectedMarketplace(mp.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedMarketplace === mp.id
                  ? 'bg-[#2D3277] text-[#FFE600] shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {mp.name}
            </button>
          ))}
        </div>

        {/* Requirement 1: Interactive Discount Slider Box */}
        <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-slate-50 rounded-2xl border border-purple-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black text-purple-950 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Controle Deslizante de Desconto Mínimo (% OFF):</span>
            </label>

            <div className="flex items-center space-x-2">
              <span className="bg-purple-600 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-sm flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>
                  {minDiscount === 0 ? 'Todos os descontos (0% OFF)' : `🔥 Mínimo: ${minDiscount}% OFF`}
                </span>
              </span>
            </div>
          </div>

          {/* Range Slider Control */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={90}
              step={5}
              value={minDiscount}
              onChange={(e) => setMinDiscount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 hover:accent-purple-700 transition-all"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-bold px-1">
              <span>0% (Todos)</span>
              <span>15% OFF</span>
              <span>30% OFF</span>
              <span>50% OFF</span>
              <span>70% OFF</span>
              <span>90% OFF</span>
            </div>
          </div>

          {/* Quick Preset Buttons for Slider */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-bold mr-1">Atalhos de Desconto:</span>
            {[
              { label: 'Mostrar Todos (0%)', val: 0 },
              { label: '≥ 15% OFF', val: 15 },
              { label: '≥ 30% OFF (Padrão)', val: 30 },
              { label: '≥ 50% OFF (Super Ofertas)', val: 50 },
              { label: '≥ 70% OFF (Alerta Vermelho)', val: 70 }
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setMinDiscount(preset.val)}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border transition-all ${
                  minDiscount === preset.val
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-100 hover:text-purple-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Free Shipping Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, marca ou produto..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3483FA] transition-all"
            />
          </div>

          {/* Free Shipping Toggle */}
          <div className="lg:col-span-4 flex items-center">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-full hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={freeShippingOnly}
                onChange={(e) => setFreeShippingOnly(e.target.checked)}
                className="rounded border-slate-300 text-[#3483FA] focus:ring-0"
              />
              <span className="font-bold">Apenas Frete Grátis 🚚</span>
            </label>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pt-1 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Priority Indicator Bar */}
      <div className="p-3.5 bg-purple-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFE600] text-[#1E2255] flex items-center justify-center font-black shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-purple-200 uppercase font-black tracking-wider block">
              Prioridades Ativas do Bot IMPORTHOURANDO:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold pt-0.5">
              <span className="bg-purple-800 text-[#FFE600] border border-purple-600 px-2 py-0.5 rounded-lg">
                1º {p1Opt.badge}
              </span>
              <span className="text-purple-300 text-xs">➔</span>
              <span className="bg-purple-800 text-white border border-purple-600 px-2 py-0.5 rounded-lg">
                2º {p2Opt.badge}
              </span>
              <span className="text-purple-300 text-xs">➔</span>
              <span className="bg-purple-800 text-white border border-purple-600 px-2 py-0.5 rounded-lg">
                3º {p3Opt.badge}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPriorityModalOpen(true)}
          className="text-xs bg-purple-800 hover:bg-purple-700 text-[#FFE600] font-bold px-3 py-1.5 rounded-xl border border-purple-600 transition-colors self-start md:self-auto shrink-0"
        >
          Ajustar Classificação
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedProducts.map((prod, index) => {
          const matchedAlert = getMatchingAlertRule(prod);

          return (
            <div
              key={prod.id}
              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md relative overflow-hidden ${
                matchedAlert ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-[#3483FA]'
              }`}
            >
              {/* Matched Alert Badge */}
              {matchedAlert && (
                <div className="bg-emerald-600 text-white font-black text-[9px] px-3 py-1 text-center uppercase tracking-wider flex items-center justify-center gap-1 -mx-4 -mt-4 mb-3 shadow">
                  <Bell className="w-3 h-3 text-[#FFE600] animate-bounce" />
                  <span>ALERTA DE PREÇO BATIDO: "{matchedAlert.keyword}" ({matchedAlert.targetDiscountPercentage}% OFF META)</span>
                </div>
              )}

              {/* Top Rank Badge */}
              {index < 3 && !matchedAlert && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white font-black text-[9px] px-3 py-1 rounded-bl-xl shadow z-10 flex items-center space-x-1">
                  <Award className="w-3 h-3 text-[#FFE600]" />
                  <span>#{index + 1} Prioridade do Bot</span>
                </div>
              )}

            <div className="space-y-3 pt-1">
              {/* Card Image & Badges */}
              <div className="relative aspect-video rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                <img
                  src={prod.imageUrl}
                  alt={prod.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  {renderMarketplaceBadge(prod.marketplace)}
                  <span className="bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow">
                    {prod.discountPercentage}% OFF
                  </span>
                </div>

                {prod.shippingFree && (
                  <span className="absolute bottom-2 right-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow backdrop-blur-sm">
                    Frete Grátis
                  </span>
                )}
              </div>

              {/* Title, Niche & Category */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1">
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                      {detectProductNiche(prod.title, prod.category).emoji} {detectProductNiche(prod.title, prod.category).name}
                    </span>
                  </div>
                  <span>⭐ {prod.rating} ({prod.reviewsCount})</span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug group-hover:text-[#3483FA] transition-colors">
                  {prod.title}
                </h3>
              </div>

              {/* Price Block */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 line-through">
                    R$ {prod.originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Economia de R$ {(prod.originalPrice - prod.price).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-black text-[#2D3277]">
                    R$ {prod.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {prod.installments && (
                  <p className="text-[10px] text-slate-500 font-medium">{prod.installments}</p>
                )}
                {prod.couponCode && (
                  <div className="pt-1 flex items-center space-x-1.5 text-[11px]">
                    <Tag className="w-3 h-3 text-[#3483FA]" />
                    <span className="text-slate-600">Cupom:</span>
                    <span className="bg-[#FFE600] text-[#2D3277] font-mono font-bold px-1.5 py-0.5 rounded">
                      {prod.couponCode}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setBadgeProduct(prod)}
                className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl transition-all flex items-center gap-1 font-extrabold text-xs"
                title="Personalizar Imagem com Etiqueta ('Oferta do Dia', 'Desconto Real')"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Etiqueta 🎨</span>
              </button>

              <button
                onClick={() => handleCopyLink(prod)}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Copiar Link de Afiliado"
              >
                {copiedId === prod.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={() => onSelectProductToDispatch(prod)}
                className="flex-1 bg-[#3483FA] hover:bg-blue-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Disparar Oferta</span>
              </button>
            </div>
          </div>
        );
      })}
      </div>

      {/* Requirement 2: Bot Priority Ranking Modal */}
      {isPriorityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg text-slate-900 shadow-2xl overflow-hidden my-6">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-purple-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#FFE600] text-[#1E2255] font-black shadow-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Classificação & Priorização de Ofertas</h3>
                  <p className="text-xs text-purple-200">Informe ao Bot a ordem exata de prioridade (1º, 2º e 3º lugar)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPriorityModalOpen(false)}
                className="p-2 text-purple-200 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Presets Quick Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800">
                  ⚡ Escolha uma Estratégia Pronta de Priorização:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPresetStrategy('DISCOUNT_PERCENT', 'SAVINGS_AMOUNT', 'RATING')}
                    className="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-purple-900 flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5 text-red-600" />
                      <span>Desconto Brutal</span>
                    </div>
                    <p className="text-[10px] text-slate-600">1º % OFF ➔ 2º Economia R$ ➔ 3º Nota ⭐</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetStrategy('RATING', 'DISCOUNT_PERCENT', 'FREE_SHIPPING')}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-amber-950 flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Qualidade & Confiança</span>
                    </div>
                    <p className="text-[10px] text-slate-600">1º Nota ⭐ ➔ 2º % OFF ➔ 3º Frete Grátis</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetStrategy('LOWEST_PRICE', 'DISCOUNT_PERCENT', 'FREE_SHIPPING')}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-emerald-950 flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Menor Preço Absoluto</span>
                    </div>
                    <p className="text-[10px] text-slate-600">1º Preço R$ ➔ 2º % OFF ➔ 3º Frete Grátis</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetStrategy('FREE_SHIPPING', 'DISCOUNT_PERCENT', 'SAVINGS_AMOUNT')}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left space-y-1 transition-colors"
                  >
                    <div className="font-bold text-blue-950 flex items-center space-x-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Frete Grátis Primeiro</span>
                    </div>
                    <p className="text-[10px] text-slate-600">1º Frete Grátis ➔ 2º % OFF ➔ 3º Economia R$</p>
                  </button>
                </div>
              </div>

              {/* Priority Selectors: 1º, 2º, 3º */}
              <div className="space-y-4 pt-2">
                {/* 1st Priority */}
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-xs text-purple-950 flex items-center space-x-2">
                      <span className="bg-purple-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                        1º LUGAR
                      </span>
                      <span>Prioridade Máxima (Critério Principal):</span>
                    </label>
                  </div>

                  <select
                    value={botPriority1}
                    onChange={(e) => setBotPriority1(e.target.value as PriorityCriterion)}
                    className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-600 shadow-xs"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600 italic">
                    {getPriorityOption(botPriority1).description}
                  </p>
                </div>

                {/* 2nd Priority */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-xs text-slate-900 flex items-center space-x-2">
                      <span className="bg-slate-800 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                        2º LUGAR
                      </span>
                      <span>1º Critério de Desempate:</span>
                    </label>
                  </div>

                  <select
                    value={botPriority2}
                    onChange={(e) => setBotPriority2(e.target.value as PriorityCriterion)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-600 shadow-xs"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600 italic">
                    {getPriorityOption(botPriority2).description}
                  </p>
                </div>

                {/* 3rd Priority */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-xs text-slate-900 flex items-center space-x-2">
                      <span className="bg-slate-800 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                        3º LUGAR
                      </span>
                      <span>2º Critério de Desempate:</span>
                    </label>
                  </div>

                  <select
                    value={botPriority3}
                    onChange={(e) => setBotPriority3(e.target.value as PriorityCriterion)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-purple-600 shadow-xs"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-600 italic">
                    {getPriorityOption(botPriority3).description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPriorityModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl transition-colors text-xs"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveBotPriorities}
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-extrabold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 shadow text-xs"
                >
                  {savePrioritySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-[#FFE600]" />
                      <span>Prioridades do Bot Salvas!</span>
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 text-[#FFE600]" />
                      <span>Salvar Classificação do Bot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Badge Overlay Customizer Modal */}
      {badgeProduct && (
        <ImageBadgeOverlayModal
          isOpen={!!badgeProduct}
          onClose={() => setBadgeProduct(null)}
          imageUrl={badgeProduct.imageUrl}
          productTitle={badgeProduct.title}
          productPrice={badgeProduct.price}
          discountPercentage={badgeProduct.discountPercentage}
          onApplyImage={(stampedImageUrl) => {
            const updatedProd = {
              ...badgeProduct,
              imageUrl: stampedImageUrl
            };
            setBadgeProduct(null);
            onSelectProductToDispatch(updatedProd);
          }}
        />
      )}
    </div>
  );
};
