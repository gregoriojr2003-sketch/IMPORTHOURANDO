import React, { useState, useMemo } from 'react';
import { 
  Send, Copy, Check, MousePointerClick, DollarSign, Calendar, ExternalLink, 
  RefreshCw, Smartphone, Sparkles, Share2, Flame, Eye, ArrowUp, Heart, 
  MessageSquare, CheckCircle2, Target, TrendingUp, BarChart3, Filter 
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { DispatchedOffer } from '../types';
import { detectProductNiche } from '../utils/nicheDetector';

interface DispatchHistoryProps {
  logs: DispatchedOffer[];
  onReSendOffer: (log: DispatchedOffer) => void;
}

export const DispatchHistory: React.FC<DispatchHistoryProps> = ({ logs, onReSendOffer }) => {
  const [search, setSearch] = useState('');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [statusLiked, setStatusLiked] = useState(false);

  // Conversion chart filters
  const [periodFilter, setPeriodFilter] = useState<'ALL' | '24H' | '7D'>('ALL');
  const [chartMetric, setChartMetric] = useState<'CONVERSION' | 'CLICKS' | 'DISPATCHES'>('CONVERSION');

  // Filter logs by selected period
  const periodLogs = useMemo(() => {
    const now = new Date();
    return logs.filter(log => {
      if (periodFilter === 'ALL') return true;
      const logDate = new Date(log.sentAt.replace(' ', 'T'));
      if (isNaN(logDate.getTime())) return true;
      const diffHours = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      if (periodFilter === '24H') return diffHours <= 24;
      if (periodFilter === '7D') return diffHours <= 24 * 7;
      return true;
    });
  }, [logs, periodFilter]);

  // Aggregate offer conversion statistics for recharts
  const chartData = useMemo(() => {
    const map = new Map<string, {
      title: string;
      shortTitle: string;
      disparos: number;
      cliques: number;
      comissao: number;
    }>();

    periodLogs.forEach(log => {
      const key = log.productTitle.trim();
      const shortTitle = key.length > 18 ? key.substring(0, 18) + '...' : key;
      const existing = map.get(key) || {
        title: key,
        shortTitle,
        disparos: 0,
        cliques: 0,
        comissao: 0
      };
      existing.disparos += 1;
      existing.cliques += log.clicksCount || 0;
      existing.comissao += log.estimatedComission || 0;
      map.set(key, existing);
    });

    const result = Array.from(map.values()).map(item => {
      const taxaConversao = item.disparos > 0 ? Number((item.cliques / item.disparos).toFixed(1)) : 0;
      const taxaPercentual = item.disparos > 0 ? Number(((item.cliques / (item.disparos * 10)) * 100).toFixed(1)) : 0;
      return {
        ...item,
        taxaConversao,
        taxaPercentual,
        comissaoFormatted: item.comissao.toFixed(2).replace('.', ',')
      };
    });

    if (chartMetric === 'CONVERSION') {
      result.sort((a, b) => b.taxaConversao - a.taxaConversao);
    } else if (chartMetric === 'CLICKS') {
      result.sort((a, b) => b.cliques - a.cliques);
    } else {
      result.sort((a, b) => b.disparos - a.disparos);
    }

    return result.slice(0, 8);
  }, [periodLogs, chartMetric]);

  // Totals for top cards
  const totalDisparos = useMemo(() => periodLogs.length, [periodLogs]);
  const totalCliques = useMemo(() => periodLogs.reduce((acc, l) => acc + (l.clicksCount || 0), 0), [periodLogs]);
  const totalComissao = useMemo(() => periodLogs.reduce((acc, l) => acc + (l.estimatedComission || 0), 0), [periodLogs]);
  const taxaMediaGeral = useMemo(() => {
    if (totalDisparos === 0) return '0,0';
    return (totalCliques / totalDisparos).toFixed(1).replace('.', ',');
  }, [totalDisparos, totalCliques]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3.5 rounded-xl shadow-xl text-white text-xs space-y-1.5 max-w-xs">
          <p className="font-extrabold text-slate-100 line-clamp-2 border-b border-slate-800 pb-1">
            {data.title}
          </p>
          <div className="flex justify-between items-center text-indigo-300">
            <span>Disparos Feitos:</span>
            <strong className="font-mono text-white">{data.disparos}</strong>
          </div>
          <div className="flex justify-between items-center text-blue-300">
            <span>Cliques Detectados:</span>
            <strong className="font-mono text-white">{data.cliques} cliques</strong>
          </div>
          <div className="flex justify-between items-center text-emerald-400 font-bold">
            <span>Taxa de Conversão:</span>
            <strong className="font-mono text-emerald-300">{data.taxaConversao}x ({data.taxaPercentual}%)</strong>
          </div>
          <div className="flex justify-between items-center text-amber-300 border-t border-slate-800 pt-1">
            <span>Comissão Gerada:</span>
            <strong className="font-mono text-amber-400">R$ {data.comissaoFormatted}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.productTitle.toLowerCase().includes(q) ||
      log.channelName.toLowerCase().includes(q) ||
      log.messageText.toLowerCase().includes(q)
    );
  });

  // Find the last dispatched offer (or specific status log if available)
  const lastStatusLog = logs.find(l => l.channelName.includes('Status') || l.channelId.includes('status')) || logs[0];

  const handleCopy = (log: DispatchedOffer) => {
    navigator.clipboard.writeText(log.messageText);
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Send className="w-5 h-5 text-emerald-600" />
            <span>Histórico de Disparos de Ofertas</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registro detalhado de mensagens enviadas aos canais e grupos do WhatsApp.
          </p>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por produto, canal ou texto..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3483FA]"
          />
        </div>
      </div>

      {/* Recharts Analytics Chart Card: Taxa de Conversão por Oferta */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black text-slate-900">Taxa de Conversão por Oferta</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  Analytics Recharts
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cruzamento de visualizações e cliques detectados com o volume total de disparos por oferta no período.
              </p>
            </div>
          </div>

          {/* Filters & Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setPeriodFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setPeriodFilter('24H')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === '24H'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Últimas 24h
              </button>
              <button
                onClick={() => setPeriodFilter('7D')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  periodFilter === '7D'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Últimos 7 dias
              </button>
            </div>

            {/* Sort Order */}
            <select
              value={chartMetric}
              onChange={(e) => setChartMetric(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="CONVERSION">Ordenar por: Taxa de Conversão</option>
              <option value="CLICKS">Ordenar por: Volume de Cliques</option>
              <option value="DISPATCHES">Ordenar por: Volume de Disparos</option>
            </select>
          </div>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Volume de Disparos
            </span>
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <strong className="text-lg font-black text-slate-900">{totalDisparos}</strong>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Cliques Detectados
            </span>
            <div className="flex items-center space-x-2">
              <MousePointerClick className="w-4 h-4 text-blue-600" />
              <strong className="text-lg font-black text-slate-900">{totalCliques}</strong>
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
              Média Cliques / Disparo
            </span>
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <strong className="text-lg font-black text-emerald-900">{taxaMediaGeral}x</strong>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">
              Comissão Acumulada
            </span>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <strong className="text-lg font-black text-amber-900">
                R$ {totalComissao.toFixed(2).replace('.', ',')}
              </strong>
            </div>
          </div>
        </div>

        {/* Recharts Render Container */}
        <div className="w-full h-80 pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <BarChart3 className="w-8 h-8 text-slate-300" />
              <p>Nenhum disparo encontrado para o período selecionado.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="shortTitle" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight={600}
                  interval={0} 
                  angle={-12} 
                  textAnchor="end"
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  stroke="#3b82f6" 
                  fontSize={10}
                  fontWeight={600}
                  label={{ value: 'Quantidade (Disparos / Cliques)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#10b981" 
                  fontSize={10}
                  fontWeight={600}
                  unit="x"
                  label={{ value: 'Taxa (Cliques/Disparo)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#10b981' } }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 12, fontSize: 11, fontWeight: 700 }} 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="disparos" 
                  name="Volume de Disparos" 
                  fill="#818cf8" 
                  radius={[6, 6, 0, 0]} 
                  barSize={20} 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="cliques" 
                  name="Cliques Detectados" 
                  fill="#3b82f6" 
                  radius={[6, 6, 0, 0]} 
                  barSize={20} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="taxaConversao" 
                  name="Taxa de Conversão (Cliques/Disparo)" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#10b981' }} 
                  activeDot={{ r: 8 }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Visual WhatsApp Status Preview Card */}
      {lastStatusLog && (
        <div className="bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-950 rounded-2xl p-5 md:p-6 text-white border border-purple-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-600/30 rounded-xl border border-purple-500/40 text-purple-300">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-white">Prévia Visual: Meu Status do WhatsApp (Stories 24h)</h3>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-400/30 uppercase">
                    Ao Vivo
                  </span>
                </div>
                <p className="text-xs text-purple-200/80">
                  Visualização em tempo real de como a última oferta é compartilhada automaticamente no seu Status do WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-purple-950/80 px-3 py-1.5 rounded-xl border border-purple-700/60 text-xs shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-purple-200">Publicação Automática pelo Robô</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Phone Screen Mockup Container */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[280px] bg-black rounded-[36px] p-3 border-4 border-slate-700 shadow-2xl relative overflow-hidden">
                {/* Status Screen */}
                <div className="bg-gradient-to-b from-purple-950 via-slate-900 to-emerald-950 rounded-[28px] p-3.5 min-h-[440px] flex flex-col justify-between relative overflow-hidden text-white border border-slate-800">
                  {/* Top Status Story Progress Bars */}
                  <div className="flex space-x-1 w-full pt-1">
                    <div className="h-0.5 bg-white rounded-full flex-1"></div>
                    <div className="h-0.5 bg-white/40 rounded-full flex-1"></div>
                    <div className="h-0.5 bg-white/40 rounded-full flex-1"></div>
                  </div>

                  {/* Status Profile Header */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 to-purple-500">
                        <img
                          src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=100&h=100&fit=crop"
                          alt="Status User"
                          className="w-full h-full object-cover rounded-full border border-black"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-black leading-none">Meu Status</p>
                        <p className="text-[10px] text-slate-300">Hoje, {lastStatusLog.sentAt.split(' ')[1] || 'Agora mesmo'}</p>
                      </div>
                    </div>
                    <div className="bg-purple-600/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-purple-400/40">
                      Stories 24h
                    </div>
                  </div>

                  {/* Main Story Image & Offer Sticker */}
                  <div className="my-auto space-y-3 py-2">
                    {lastStatusLog.productImage && (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg group">
                        <img
                          src={lastStatusLog.productImage}
                          alt={lastStatusLog.productTitle}
                          className="w-full h-44 object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-md shadow-md animate-bounce">
                          🔥 OPORTUNIDADE
                        </div>
                        <div className="absolute bottom-2 right-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          {lastStatusLog.marketplace || 'Mercado Livre'}
                        </div>
                      </div>
                    )}

                    {/* WhatsApp Status Sticker Overlay Box */}
                    <div className="bg-slate-900/90 backdrop-blur-md border border-purple-500/40 p-3 rounded-2xl space-y-1.5 text-center shadow-xl">
                      <h4 className="font-extrabold text-xs text-white line-clamp-2 leading-snug">
                        {lastStatusLog.productTitle}
                      </h4>
                      <div className="flex items-center justify-center space-x-2 text-xs">
                        {lastStatusLog.originalPrice && lastStatusLog.originalPrice > lastStatusLog.price && (
                          <span className="text-slate-400 line-through text-[11px]">
                            R$ {lastStatusLog.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                        <span className="text-emerald-400 font-black text-sm">
                          R$ {lastStatusLog.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      
                      {/* Interactive Link Sticker */}
                      <a
                        href={lastStatusLog.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[11px] py-1.5 px-3 rounded-xl shadow-md hover:scale-105 transition-all text-center"
                      >
                        👉 TOQUE AQUI PARA COMPRAR
                      </a>
                    </div>
                  </div>

                  {/* Status Footer - Reply / Swipe up */}
                  <div className="text-center pt-1 space-y-1">
                    <div className="flex items-center justify-center space-x-1 text-slate-300 text-[10px] animate-pulse">
                      <ArrowUp className="w-3 h-3 text-emerald-400" />
                      <span className="font-bold">Deslize para cima para comprar</span>
                    </div>
                    <div className="bg-white/10 rounded-full py-1 px-3 text-[10px] text-slate-300 flex items-center justify-between border border-white/10">
                      <span>Responder no Status...</span>
                      <button onClick={() => setStatusLiked(!statusLiked)} className="hover:text-red-400">
                        <Heart className={`w-3.5 h-3.5 ${statusLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details & Copy Breakdown Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span className="font-extrabold uppercase tracking-wider text-[10px]">
                    📢 Canal de Envio: {lastStatusLog.channelName}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                    Comissão Est: R$ {lastStatusLog.estimatedComission.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white">{lastStatusLog.productTitle}</h4>
                <p className="text-xs text-slate-300">
                  Esta mensagem em formato Stories atrai visualizações rápidas de contatos no WhatsApp, gerando compras por impulso com o seu link de afiliado.
                </p>
              </div>

              {/* Status Copy Format Textbox */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span className="font-bold uppercase tracking-wider text-[10px]">Texto Formatado Enviado para o Status:</span>
                  <button
                    onClick={() => handleCopy(lastStatusLog)}
                    className="text-purple-300 hover:text-white font-bold flex items-center space-x-1"
                  >
                    {copiedLogId === lastStatusLog.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Copy do Status</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-900/60 font-sans text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto font-mono">
                  {lastStatusLog.messageText}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={lastStatusLog.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Testar Link de Afiliado</span>
                </a>

                <button
                  onClick={() => onReSendOffer(lastStatusLog)}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-md transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-publicar no Status Agora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table / Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider pt-2">
          Todos os Disparos Registrados
        </h3>
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-white border border-slate-200 hover:border-[#3483FA] rounded-2xl p-4.5 transition-all shadow-sm space-y-3"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Product & Channel info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {log.productImage && (
                  <img
                    src={log.productImage}
                    alt={log.productTitle}
                    className="w-16 h-16 object-cover rounded-xl bg-slate-50 shrink-0 border border-slate-200"
                  />
                )}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      {log.status}
                    </span>
                    <span className="text-slate-700 text-xs font-bold">{log.channelName}</span>
                    <span className="bg-purple-100 text-purple-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                      {detectProductNiche(log.productTitle).emoji} {detectProductNiche(log.productTitle).name}
                    </span>
                    <span className="bg-amber-100 text-amber-900 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {log.marketplace || 'Mercado Livre'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 truncate max-w-xl">{log.productTitle}</h3>
                  <p className="text-[11px] text-slate-500 flex items-center space-x-2">
                    <span className="text-[#2D3277] font-black">R$ {log.price.toFixed(2).replace('.', ',')}</span>
                    <span>•</span>
                    <span>Enviado em: {log.sentAt}</span>
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center space-x-6 text-xs text-slate-700 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Cliques Est.</p>
                  <p className="font-bold text-emerald-700 flex items-center justify-center space-x-1">
                    <MousePointerClick className="w-3 h-3" />
                    <span>{log.clicksCount}</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Comissão Est.</p>
                  <p className="font-black text-[#2D3277] flex items-center justify-center space-x-0.5">
                    <DollarSign className="w-3 h-3 text-amber-500" />
                    <span>R$ {log.estimatedComission.toFixed(2).replace('.', ',')}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleCopy(log)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all"
                  title="Copiar mensagem enviada"
                >
                  {copiedLogId === log.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onReSendOffer(log)}
                  className="bg-[#3483FA] hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reenviar</span>
                </button>
              </div>
            </div>

            {/* Formatted Copy Display */}
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl text-[11px] font-sans leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner">
              {log.messageText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

