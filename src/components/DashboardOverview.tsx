import React, { useState, useMemo } from 'react';
import { Send, MousePointerClick, DollarSign, Users, Zap, ExternalLink, ArrowUpRight, Plus, Sparkles, CheckCircle2, Clock, ShieldCheck, Pause, Play, Link, AlertTriangle, HelpCircle, TrendingUp, BarChart3, PieChart, ShoppingBag, FileSpreadsheet, Trash2, Search, X, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DispatchedOffer, WhatsAppChannel, MercadoLivreProduct, AutoSchedulerConfig, AffiliateConfig } from '../types';
import { exportDispatchesToCSV } from '../utils/csvExporter';

interface DashboardOverviewProps {
  dispatchedLogs: DispatchedOffer[];
  channels: WhatsAppChannel[];
  products: MercadoLivreProduct[];
  schedulerConfig?: AutoSchedulerConfig;
  affiliateConfig?: AffiliateConfig;
  onOpenConverter: () => void;
  onOpenSettings?: () => void;
  onOpenScheduler: () => void;
  onOpenMLMonitor?: () => void;
  onOpenChannels: () => void;
  onOpenHelpModal?: () => void;
  onQuickDispatch: (product: MercadoLivreProduct) => void;
  onToggleMasterScheduler?: () => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
  onClearLogs?: (mode?: 'all' | 'older_than_7_days') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  dispatchedLogs = [],
  channels = [],
  products = [],
  schedulerConfig,
  affiliateConfig,
  onOpenConverter,
  onOpenSettings,
  onOpenScheduler,
  onOpenMLMonitor,
  onOpenChannels,
  onOpenHelpModal,
  onQuickDispatch,
  onToggleMasterScheduler,
  onRequirePlanActivation,
  onClearLogs
}) => {
  const [quickUrlInput, setQuickUrlInput] = useState('');
  const [isParsingQuickUrl, setIsParsingQuickUrl] = useState(false);

  // History section states
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);
  const [selectedClearMode, setSelectedClearMode] = useState<'all' | 'older_than_7_days'>('older_than_7_days');

  const totalDispatches = dispatchedLogs.length;
  const totalClicks = dispatchedLogs.reduce((acc, curr) => acc + curr.clicksCount, 0);
  const totalCommission = dispatchedLogs.reduce((acc, curr) => acc + curr.estimatedComission, 0);
  const connectedChannels = channels.filter(c => c.status === 'CONNECTED').length;

  const topDeals = [...products].sort((a, b) => b.discountPercentage - a.discountPercentage).slice(0, 4);

  const marketplacesConfig = [
    { key: 'MERCADO_LIVRE', name: 'Mercado Livre', label: '🟡 Mercado Livre', badgeBg: 'bg-amber-100 text-amber-900 border-amber-300', barColor: 'bg-amber-400', textColor: 'text-amber-950' },
    { key: 'SHOPEE', name: 'Shopee', label: '🍊 Shopee Brasil', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300', barColor: 'bg-orange-500', textColor: 'text-orange-950' },
    { key: 'AMAZON', name: 'Amazon', label: '📦 Amazon Brasil', badgeBg: 'bg-slate-200 text-slate-900 border-slate-300', barColor: 'bg-slate-800', textColor: 'text-slate-950' },
    { key: 'ALIEXPRESS', name: 'AliExpress', label: '🔴 AliExpress', badgeBg: 'bg-red-100 text-red-900 border-red-300', barColor: 'bg-red-500', textColor: 'text-red-950' },
    { key: 'TEMU', name: 'Temu', label: '🔶 Temu Direct', badgeBg: 'bg-amber-200 text-amber-950 border-amber-400', barColor: 'bg-amber-600', textColor: 'text-amber-950' },
    { key: 'MAGALU', name: 'Magalu', label: '💙 Magazine Luiza', badgeBg: 'bg-blue-100 text-blue-900 border-blue-300', barColor: 'bg-blue-600', textColor: 'text-blue-950' }
  ];

  const marketplaceStats = marketplacesConfig.map(mp => {
    const matchingLogs = dispatchedLogs.filter(log => {
      const mpVal = (log.marketplace || 'MERCADO_LIVRE').toUpperCase();
      if (mpVal === mp.key) return true;
      if (mp.key === 'MERCADO_LIVRE' && (mpVal.includes('MERCADO') || mpVal.includes('MELI'))) return true;
      return false;
    });

    const dispatchesCount = matchingLogs.length;
    const clicks = matchingLogs.reduce((acc, curr) => acc + (curr.clicksCount || 0), 0);
    const commission = matchingLogs.reduce((acc, curr) => acc + (curr.estimatedComission || 0), 0);
    const share = totalCommission > 0 ? (commission / totalCommission) * 100 : 0;
    const avgCommission = dispatchesCount > 0 ? commission / dispatchesCount : 0;

    return {
      ...mp,
      dispatchesCount,
      clicks,
      commission,
      share,
      avgCommission
    };
  });

  const topPerformingMp = [...marketplaceStats].sort((a, b) => b.commission - a.commission)[0];

  // Generate last 7 days data for Recharts line chart
  const last7DaysData = useMemo(() => {
    const daysMap = new Map<string, { date: string; fullDate: string; label: string; dispatches: number; clicks: number; commission: number }>();
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      const dayShort = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayFormatted = `${day}/${month}`;
      const label = i === 0 ? `Hoje (${dayFormatted})` : `${dayShort.charAt(0).toUpperCase() + dayShort.slice(1)} ${dayFormatted}`;

      daysMap.set(dateKey, {
        date: dateKey,
        fullDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        label,
        dispatches: 0,
        clicks: 0,
        commission: 0,
      });
    }

    dispatchedLogs.forEach((log) => {
      let logDateKey = '';
      if (log.sentAt) {
        const str = log.sentAt;
        if (str.includes('Hoje')) {
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          logDateKey = `${year}-${month}-${day}`;
        } else if (str.includes('Ontem')) {
          const d = new Date(now);
          d.setDate(d.getDate() - 1);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          logDateKey = `${year}-${month}-${day}`;
        } else {
          const dmyMatch = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (dmyMatch) {
            logDateKey = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
          } else {
            const ymdMatch = str.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (ymdMatch) {
              logDateKey = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
            }
          }
        }
      }

      if (logDateKey && daysMap.has(logDateKey)) {
        const item = daysMap.get(logDateKey)!;
        item.dispatches += 1;
        item.clicks += log.clicksCount || 0;
        item.commission += log.estimatedComission || 0;
      }
    });

    return Array.from(daysMap.values());
  }, [dispatchedLogs]);

  const handleQuickParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrlInput.trim()) return;
    setIsParsingQuickUrl(true);
    try {
      const res = await fetch('/api/ml/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrlInput })
      });
      const data = await res.json();
      if (data.success && data.product) {
        onQuickDispatch(data.product);
        setQuickUrlInput('');
      } else {
        alert(data.error || 'Não foi possível converter o link.');
      }
    } catch (err) {
      alert('Erro na conexão ao converter o link.');
    } finally {
      setIsParsingQuickUrl(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Banner Geometric Balance (#2D3277 + #FFE600 accents) */}
      <div className="bg-[#2D3277] rounded-2xl p-6 text-white shadow-sm border border-[#3D438F] relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-[#FFE600] text-[#2D3277] text-xs px-3 py-1 rounded-full font-extrabold shadow-sm font-mono uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ROBÔ NATIVO IMPORTHOURANDO</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white font-mono">
                IMPORTHOURANDO - Automação de Afiliados
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                Varredura automática e disparo de ofertas com Tag de Afiliado para Canais e Grupos do WhatsApp com IA e sistema de prioridades.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Master Toggle Button */}
              <button
                onClick={() => {
                  if (onRequirePlanActivation && !onRequirePlanActivation('ativar a automação do robô de disparos')) return;
                  if (onToggleMasterScheduler) onToggleMasterScheduler();
                }}
                className={`flex items-center justify-center space-x-2 font-black px-5 py-3 rounded-xl text-xs shadow-md transition-all active:scale-95 ${
                  schedulerConfig?.enabled
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold'
                }`}
              >
                {schedulerConfig?.enabled ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSAR ROBÔ IMPORTHOURANDO</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>ATIVAR ROBÔ IMPORTHOURANDO</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenScheduler}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold px-3.5 py-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all"
              >
                <Zap className="w-4 h-4 text-[#FFE600]" />
                <span>Ajustar Regras</span>
              </button>
            </div>
          </div>

          {/* 4 Steps IMPORTHOURANDO Rule Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <span className="bg-blue-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">Passo 1</span>
              <p className="font-bold text-white text-xs mt-1">Ofertas 30%+ OFF</p>
              <p className="text-[11px] text-slate-200 mt-0.5">Disparos a cada 30m (janela 5m) entre 06h00 e 23h00.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <span className="bg-amber-400 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">Passo 2</span>
              <p className="font-bold text-amber-300 text-xs mt-1">Super Oferta 50%+ OFF</p>
              <p className="text-[11px] text-slate-200 mt-0.5">Fura fila e dispara automaticamente sem esperar.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <span className="bg-red-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">Passo 3</span>
              <p className="font-bold text-red-300 text-xs mt-1">Radar 24h 70%+ OFF</p>
              <p className="text-[11px] text-slate-200 mt-0.5">Alerta Vermelho instantâneo prioritário 24h por dia.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15">
              <span className="bg-emerald-400 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">Passo 4</span>
              <p className="font-bold text-emerald-300 text-xs mt-1">Fluxo Canal → Grupo</p>
              <p className="text-[11px] text-slate-200 mt-0.5">Posta no Canal e direciona Grupos com convite.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ML API & Monitor Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE600] text-[#2D3277] flex items-center justify-center font-black">
              ML
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-slate-900">Mercado Livre Afiliado</h4>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Conectado</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">Tag: <strong className="text-slate-800 font-mono">{affiliateConfig?.affiliateTag || 'ofertastop_app'}</strong></p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs text-[#3483FA] font-bold hover:underline"
          >
            Configurar
          </button>
        </div>

        {/* Automated ML Offer Monitor Card */}
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D3277] text-[#FFE600] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-slate-900">Monitor de Ofertas ML</h4>
                <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                  24h Ativo
                </span>
              </div>
              <p className="text-xs text-slate-700">Envia Título + Preço + Link para o WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onOpenMLMonitor}
            className="bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs shrink-0"
          >
            Ajustar
          </button>
        </div>

        {/* WhatsApp Instance Connection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              WA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-slate-900">Instância WhatsApp API</h4>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Evolution API Online
                </span>
              </div>
              <p className="text-xs text-slate-500">{connectedChannels} canais ativos</p>
            </div>
          </div>
          <button
            onClick={onOpenChannels}
            className="text-xs text-[#3483FA] font-bold hover:underline"
          >
            Canais ({channels.length})
          </button>
        </div>
      </div>

      {/* Quick Converter Input Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <Link className="w-5 h-5 text-[#3483FA]" />
          <h3 className="font-bold text-slate-900 text-sm">Conversor Rápido: Cole qualquer link do Mercado Livre</h3>
        </div>
        <form onSubmit={handleQuickParse} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={quickUrlInput}
            onChange={(e) => setQuickUrlInput(e.target.value)}
            placeholder="Cole o link do produto ex: https://www.mercadolivre.com.br/p/MLB12345..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#3483FA] transition-all"
            required
          />
          <button
            type="submit"
            disabled={isParsingQuickUrl}
            className="bg-[#3483FA] hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
          >
            {isParsingQuickUrl ? (
              <span>Convertendo...</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Gerar Link & Disparar</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* KPI Stats Grid - Geometric White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Disparado</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#3483FA]">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalDispatches}</span>
            <span className="text-xs text-emerald-600 font-bold">+12% hoje</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Envios diretos + automáticos</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cliques Estimados</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{totalClicks}</span>
            <span className="text-xs text-emerald-600 font-bold">CTR ~18.4%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Engajamento nos links de afiliado</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Comissão Estimada</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#2D3277]">
              R$ {totalCommission.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Estimado com base na categoria ML</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Canais Ativos</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{connectedChannels}</span>
            <span className="text-xs text-slate-500">de {channels.length} cadastrados</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Público total ~23k membros</p>
        </div>
      </div>

      {/* Daily Offer Dispatches Line Chart (Recharts) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-[#2D3277] border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base">Disparos Diários de Ofertas</h3>
                <span className="bg-indigo-100 text-[#2D3277] text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200 uppercase">
                  Últimos 7 Dias
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acompanhamento gráfico do volume diário de ofertas enviadas nos canais e grupos do WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Total 7D</span>
              <span className="font-black text-[#2D3277]">
                {last7DaysData.reduce((acc, curr) => acc + curr.dispatches, 0)} disparos
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Média Diária</span>
              <span className="font-extrabold text-emerald-700">
                {(last7DaysData.reduce((acc, curr) => acc + curr.dispatches, 0) / 7).toFixed(1)} / dia
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Line / Area Chart Container */}
        <div className="w-full h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dispatchesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3483FA" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3483FA" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 font-sans text-xs space-y-1.5">
                        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                          <span>{data.fullDate}</span>
                          <span className="text-indigo-300 font-mono text-[11px]">{data.label}</span>
                        </p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Send className="w-3 h-3 text-[#3483FA]" /> Disparos:
                          </span>
                          <span className="font-black text-[#FFE600] font-mono text-sm">{data.dispatches}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px]">
                          <span className="text-slate-400">Cliques Est:</span>
                          <span className="font-bold text-emerald-400 font-mono">{data.clicks}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4 text-[11px]">
                          <span className="text-slate-400">Comissão Est:</span>
                          <span className="font-bold text-amber-300 font-mono">R$ {data.commission.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="dispatches" 
                stroke="#3483FA" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#dispatchesGradient)"
                activeDot={{ r: 6, fill: '#FFE600', stroke: '#2D3277', strokeWidth: 2 }}
                dot={{ r: 4, fill: '#3483FA', strokeWidth: 1, stroke: '#ffffff' }}
                name="Disparos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Commission Earnings by Marketplace (IMPORTHOURANDO) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base">Rendimento de Comissões por Marketplace</h3>
                <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 uppercase flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                  <span>Tempo Real</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Acompanhamento em tempo real das comissões estimadas geradas pelo Robô IMPORTHOURANDO divididas por plataforma.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs shrink-0">
            <BarChart3 className="w-4 h-4 text-[#2D3277]" />
            <span className="text-slate-600 font-semibold">Maior Desempenho:</span>
            <span className="font-black text-[#2D3277] bg-white px-2 py-0.5 rounded border border-slate-200">
              {topPerformingMp ? topPerformingMp.name : 'Mercado Livre'} ({topPerformingMp ? topPerformingMp.share.toFixed(0) : 0}%)
            </span>
          </div>
        </div>

        {/* Stacked Proportional Revenue Share Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center space-x-1">
              <PieChart className="w-3.5 h-3.5 text-blue-600" />
              <span>Distribuição de Receita de Comissões por Canal Marketplace</span>
            </span>
            <span className="text-[#2D3277] font-black">
              Total R$ {totalCommission.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {marketplaceStats.map((mp) => (
              <div
                key={mp.key}
                style={{ width: `${mp.share > 0 ? Math.max(mp.share, 2) : 0}%` }}
                className={`${mp.barColor} transition-all duration-500 h-full relative group cursor-pointer`}
                title={`${mp.name}: R$ ${mp.commission.toFixed(2)} (${mp.share.toFixed(1)}%)`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
            {marketplaceStats.map((mp) => (
              <div key={mp.key} className="flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${mp.barColor}`}></span>
                <span className="font-bold text-slate-700">{mp.name}:</span>
                <span className="font-mono text-slate-900 font-black">{mp.share.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Marketplace Performance Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {marketplaceStats.map((mp) => (
            <div
              key={mp.key}
              className="bg-slate-50/90 border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 space-y-2.5 transition-all shadow-2xs hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] border ${mp.badgeBg}`}>
                  {mp.label}
                </span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                  {mp.dispatchesCount} {mp.dispatchesCount === 1 ? 'disparo' : 'disparos'}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Comissão Est.</span>
                  <span className="text-lg font-black text-[#2D3277]">
                    R$ {mp.commission.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Participação</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {mp.share.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar per marketplace */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`${mp.barColor} h-full transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(mp.share, 100)}%` }}
                />
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80 text-[10px]">
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-slate-400 block font-bold">Cliques Gerados</span>
                  <span className="font-extrabold text-slate-800 flex items-center justify-center space-x-1">
                    <MousePointerClick className="w-3 h-3 text-blue-500" />
                    <span>{mp.clicks}</span>
                  </span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-slate-400 block font-bold">Média p/ Oferta</span>
                  <span className="font-extrabold text-emerald-800">
                    R$ {mp.avgCommission.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Feed & Dispatch History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400 block absolute top-0 left-0 animate-ping"></span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <span>Histórico & Feed de Disparos</span>
                <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200 uppercase">
                  {dispatchedLogs.length} ofertas
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                O Robô IMPORTHOURANDO seleciona a oferta, gera a copy persuasiva com imagem e publica direto nos seus canais e no Status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Export CSV Button */}
            <button
              type="button"
              onClick={() => exportDispatchesToCSV(dispatchedLogs)}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-all active:scale-95 text-xs shadow-2xs cursor-pointer"
              title="Baixar histórico completo formatado em planilha CSV para Excel / Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Exportar CSV</span>
            </button>

            {/* Clear Logs Button */}
            <button
              type="button"
              onClick={() => {
                if (onRequirePlanActivation && !onRequirePlanActivation('limpar o histórico de disparos')) return;
                setIsClearLogsModalOpen(true);
              }}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold px-3 py-1.5 rounded-xl border border-red-200 flex items-center space-x-1.5 transition-all active:scale-95 text-xs shadow-2xs cursor-pointer"
              title="Limpar ou expurgar logs antigos do histórico"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Limpar Histórico</span>
            </button>

            {/* Toggle View All */}
            {dispatchedLogs.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllLogs(!showAllLogs)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl border border-slate-300 flex items-center space-x-1 transition-all active:scale-95 text-xs cursor-pointer"
              >
                <span>{showAllLogs ? 'Mostrar Menos' : `Ver Todos (${dispatchedLogs.length})`}</span>
                {showAllLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <span className="bg-slate-50 text-slate-500 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200 hidden sm:flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Real-time</span>
            </span>
          </div>
        </div>

        {/* Filter Search Bar when expanded or when logs > 4 */}
        {(showAllLogs || dispatchedLogs.length > 4) && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar no histórico por nome do produto, canal ou palavra-chave..."
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3483FA]"
            />
            {logSearchQuery && (
              <button
                type="button"
                onClick={() => setLogSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* List of Dispatches */}
        {(() => {
          let filteredLogs = dispatchedLogs;
          if (logSearchQuery.trim()) {
            const q = logSearchQuery.toLowerCase();
            filteredLogs = filteredLogs.filter(log => 
              log.productTitle.toLowerCase().includes(q) ||
              log.channelName.toLowerCase().includes(q) ||
              log.messageText.toLowerCase().includes(q) ||
              (log.marketplace || '').toLowerCase().includes(q)
            );
          }

          const logsToDisplay = showAllLogs ? filteredLogs : filteredLogs.slice(0, 4);

          if (logsToDisplay.length === 0) {
            return (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Trash2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Nenhum registro encontrado no histórico.</p>
                <p className="text-[11px] text-slate-400">Quando novas ofertas forem disparadas pelo robô, elas aparecerão aqui automaticamente.</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {logsToDisplay.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-50/80 border border-slate-200 hover:border-blue-400 rounded-2xl p-4 transition-all shadow-xs space-y-3"
                >
                  {/* Header: Channel & Date */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        log.channelName.includes('Status')
                          ? 'bg-purple-200 text-purple-900 border border-purple-300'
                          : log.channelName.includes('Canal')
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {log.channelName.includes('Status') ? '📸 Status Stories' : '💬 WhatsApp'}
                      </span>
                      <span className="text-slate-700 font-bold text-[11px] truncate max-w-[150px]">
                        {log.channelName}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {log.sentAt}
                    </span>
                  </div>

                  {/* Product Info & Image */}
                  <div className="flex items-start space-x-3 bg-white p-3 rounded-xl border border-slate-200">
                    {log.productImage && (
                      <img
                        src={log.productImage}
                        alt={log.productTitle}
                        className="w-16 h-16 object-cover rounded-lg bg-slate-100 shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{log.productTitle}</h4>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[#2D3277] font-black">R$ {log.price.toFixed(2).replace('.', ',')}</span>
                        {log.originalPrice && log.originalPrice > log.price && (
                          <span className="text-slate-400 line-through text-[11px]">
                            R$ {log.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                      <span className="inline-block bg-amber-100 text-amber-900 font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded">
                        {log.marketplace || 'Mercado Livre'}
                      </span>
                    </div>
                  </div>

                  {/* Formatted Copy Preview Box */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>📄 Copy Gerada & Enviada:</span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(log.messageText)}
                        className="text-[#3483FA] hover:underline font-bold cursor-pointer"
                      >
                        Copiar Copy
                      </button>
                    </span>
                    <div className="bg-emerald-950 text-emerald-100 p-3 rounded-xl text-[11px] font-sans leading-relaxed whitespace-pre-wrap border border-emerald-800 shadow-inner max-h-36 overflow-y-auto scrollbar-thin">
                      {log.messageText}
                    </div>
                  </div>

                  {/* Footer status */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Enviado com Sucesso</span>
                    </span>
                    <span className="text-slate-600 font-medium">
                      Comissão Est: <strong className="text-amber-700 font-bold">R$ {log.estimatedComission.toFixed(2).replace('.', ',')}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Main Grid: Hot Deals + Automation Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hot Deals Ready to Send */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Radar de Super Ofertas ML</h3>
              <p className="text-xs text-slate-500">Produtos com maior % de desconto prontos para disparo</p>
            </div>
            <button
              onClick={onOpenConverter}
              className="text-xs text-[#3483FA] hover:underline font-bold flex items-center space-x-1"
            >
              <span>Importar Qualquer Link</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topDeals.map((prod) => (
              <div 
                key={prod.id}
                className="bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-sm hover:shadow-md"
              >
                <div className="flex gap-3">
                  <img
                    src={prod.imageUrl}
                    alt={prod.title}
                    className="w-20 h-20 object-cover rounded-xl bg-slate-100 shrink-0 border border-slate-100"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                        {prod.discountPercentage}% OFF
                      </span>
                      {prod.shippingFree && (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          Frete Grátis
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-[#3483FA] transition-colors">
                      {prod.title}
                    </h4>
                    <div className="flex items-baseline space-x-2 text-xs">
                      <span className="text-slate-400 line-through">R$ {prod.originalPrice.toFixed(2).replace('.', ',')}</span>
                      <span className="text-[#2D3277] font-black text-sm">R$ {prod.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px] truncate max-w-[130px]" title={prod.sellerName}>
                    {prod.sellerName}
                  </span>
                  <button
                    onClick={() => onQuickDispatch(prod)}
                    className="bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all text-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Automation & Channels Health */}
        <div className="space-y-6">
          {/* Scheduler Widget */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className={`w-5 h-5 ${schedulerConfig.enabled ? 'text-amber-500' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-900 text-sm">Status da Automação</h3>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                schedulerConfig.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {schedulerConfig.enabled ? '🟢 Ativo' : '🟡 Pausado'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Busca ofertas em tempo real, formata com sua Tag de Afiliado e dispara no WhatsApp.
            </p>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Intervalo:</span>
                <strong className="text-slate-900">A cada {schedulerConfig.intervalMinutes} min</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Randomizador Anti-Spam:</span>
                <strong className="text-emerald-700">{schedulerConfig.randomizeDelay ? 'Ativo (±2 min)' : 'Desativado'}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Horário de Funcionamento:</span>
                <strong className="text-slate-900">{schedulerConfig.startTime} às {schedulerConfig.endTime}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Desconto mínimo:</span>
                <strong className="text-[#2D3277]">{schedulerConfig.minDiscount}% OFF</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Último disparo:</span>
                <span className="text-slate-500">{schedulerConfig.lastRunAt || 'Iniciando...'}</span>
              </div>
            </div>

            <button
              onClick={onOpenScheduler}
              className="w-full bg-[#2D3277] hover:bg-[#3D438F] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1"
            >
              <span>Ajustar Delay e Horários</span>
            </button>
          </div>

          {/* Connected WhatsApp Channels */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Canais & Grupos Conectados</h3>
              <button
                onClick={onOpenChannels}
                className="text-xs text-[#3483FA] font-bold hover:underline"
              >
                Gerenciar ({channels.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {channels.map((chan) => (
                <div key={chan.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${chan.status === 'CONNECTED' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{chan.name}</p>
                      <p className="text-[11px] text-slate-500">{chan.membersCount.toLocaleString()} membros • {chan.type}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    chan.autoPost ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {chan.autoPost ? 'Auto' : 'Manual'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Limpar Histórico de Disparos */}
      {isClearLogsModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsClearLogsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Limpar Histórico de Disparos</h3>
                <p className="text-xs text-slate-500">Escolha a opção de limpeza desejada:</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Keep recent, clear older */}
              <label
                onClick={() => setSelectedClearMode('older_than_7_days')}
                className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedClearMode === 'older_than_7_days'
                    ? 'border-red-500 bg-red-50/50 shadow-xs ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="clearMode"
                  checked={selectedClearMode === 'older_than_7_days'}
                  onChange={() => setSelectedClearMode('older_than_7_days')}
                  className="mt-1 text-red-600 focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 block">🧹 Limpar Logs Antigos (Manter Últimos 5)</span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Mantém os 5 disparos mais recentes para consultas e remove todo o histórico antigo de ofertas enviadas.
                  </p>
                </div>
              </label>

              {/* Option 2: Clear all */}
              <label
                onClick={() => setSelectedClearMode('all')}
                className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  selectedClearMode === 'all'
                    ? 'border-red-500 bg-red-50/50 shadow-xs ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="clearMode"
                  checked={selectedClearMode === 'all'}
                  onChange={() => setSelectedClearMode('all')}
                  className="mt-1 text-red-600 focus:ring-red-500"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-slate-900 block">💥 Apagar Todo o Histórico</span>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Exclui 100% dos registros de disparos no sistema (esta ação não poderá ser desfeita).
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearLogsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearLogs) {
                    onClearLogs(selectedClearMode);
                  }
                  setIsClearLogsModalOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Limpeza</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
