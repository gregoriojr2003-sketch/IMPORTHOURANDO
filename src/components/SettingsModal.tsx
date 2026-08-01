import React, { useState, useEffect } from 'react';
import { X, Settings, ShieldCheck, Globe, Check, Server, Store, Link2, Sparkles, Volume2, MessageSquare, Wand2, Info, Webhook, Play, AlertCircle, RefreshCw, Send, Palette, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { AffiliateConfig, MarketplaceAffiliateAccounts, BrandVoiceConfig, type LanguageRegionalStyle, WebhookConfig, WebhookEvent, WebhookLog, ThemeAccentColor } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AffiliateConfig;
  onSaveConfig: (updated: Partial<AffiliateConfig>) => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRequirePlanActivation
}) => {
  const [activeTab, setActiveTab] = useState<'MARKETPLACES' | 'WHATSAPP' | 'BRAND_VOICE' | 'WEBHOOKS' | 'THEME'>('MARKETPLACES');

  // Marketplace Accounts
  const initialAccounts: MarketplaceAffiliateAccounts = config.marketplaceAccounts || {
    mercadoLivreTag: config.affiliateTag || 'ofertastop_app',
    shopeeTag: 'shopee_af_top',
    amazonTag: 'ofertastop-20',
    aliExpressTag: 'ali_track_88',
    temuTag: 'temu_code_99',
    magaluTag: 'magazinestore10'
  };

  const initialBrandVoice: BrandVoiceConfig = config.brandVoice || {
    toneStyle: 'HYPED',
    brandName: 'IMPORTHOURANDO',
    languageStyle: 'PORTUGUES_PADRAO',
    greetingGreeting: '🔥 Fala galera do IMPORTHOURANDO!',
    customPromptInstructions: 'Destaque a economia no valor do produto em reais, crie senso de urgência motivando a compra imediata e mencione que a oferta é de procedência verificada.',
    emojiDensity: 'HIGH',
    brandSignatureText: '⚡ IMPORTHOURANDO - O robô que garante o menor preço para você!',
    customCtaPhrase: '👉 GARANTA A SUA OFERTA COM DESCONTO AQUI:'
  };

  const initialWebhookConfig: WebhookConfig = config.webhookConfig || {
    enabled: true,
    url: 'https://webhook.site/importhourando-demo',
    secretKey: 'whsec_importhourando_live_981273912835',
    events: ['OFFER_DISPATCHED', 'OFFER_AUTO_POSTED', 'SUBSCRIBER_REGISTERED'],
    retryOnFailure: true,
    lastTriggeredAt: '2026-07-31 14:20',
    lastStatus: 'SUCCESS',
    lastResponseCode: 200
  };

  const [marketplaceAccounts, setMarketplaceAccounts] = useState<MarketplaceAffiliateAccounts>(initialAccounts);
  const [brandVoice, setBrandVoice] = useState<BrandVoiceConfig>(initialBrandVoice);
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(initialWebhookConfig);
  const [defaultChannelInviteLink, setDefaultChannelInviteLink] = useState(config.defaultChannelInviteLink || 'https://whatsapp.com/channel/0029Va901823748291');

  const [customDomain, setCustomDomain] = useState(config.customDomain || '');
  const [themeAccent, setThemeAccent] = useState<ThemeAccentColor>(config.themeAccent || 'BLUE');
  const [whatsappApiType, setWhatsappApiType] = useState(config.whatsappApiType);
  const [whatsappToken, setWhatsappToken] = useState(config.whatsappToken);
  const [whatsappInstance, setWhatsappInstance] = useState(config.whatsappInstance);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Webhook Test State
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/webhooks/logs')
        .then(res => res.json())
        .then(data => {
          if (data.logs) setWebhookLogs(data.logs);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookConfig.url,
          secretKey: webhookConfig.secretKey,
          event: 'OFFER_DISPATCHED'
        })
      });
      const data = await res.json();
      setTestResult(data);
      if (data.log) {
        setWebhookLogs(prev => [data.log, ...prev]);
        setWebhookConfig(prev => ({
          ...prev,
          lastTriggeredAt: data.log.timestamp,
          lastStatus: data.log.status,
          lastResponseCode: data.log.responseCode
        }));
      }
    } catch (err: any) {
      setTestResult({ success: false, message: 'Erro ao conectar ao webhook' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleToggleWebhookEvent = (ev: WebhookEvent) => {
    const currentEvents = webhookConfig.events || [];
    if (currentEvents.includes(ev)) {
      setWebhookConfig({ ...webhookConfig, events: currentEvents.filter(e => e !== ev) });
    } else {
      setWebhookConfig({ ...webhookConfig, events: [...currentEvents, ev] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRequirePlanActivation && !onRequirePlanActivation('salvar as configurações e tags de afiliado')) {
      return;
    }
    onSaveConfig({
      affiliateTag: marketplaceAccounts.mercadoLivreTag,
      marketplaceAccounts,
      brandVoice,
      webhookConfig,
      defaultChannelInviteLink,
      customDomain,
      themeAccent,
      whatsappApiType,
      whatsappToken,
      whatsappInstance,
      isConnected: true
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl text-slate-900 shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#2D3277] text-[#FFE600] font-bold shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Configurações Gerais, Voz, Webhooks & WhatsApp</h3>
              <p className="text-xs text-slate-500">Credenciais de Afiliado, Estilo Regional, Webhooks e API WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('MARKETPLACES')}
            className={`py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 flex-1 ${
              activeTab === 'MARKETPLACES'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4 text-[#3483FA]" />
            <span>Afiliados (6 Marketplaces)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BRAND_VOICE')}
            className={`py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 flex-1 ${
              activeTab === 'BRAND_VOICE'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Tom de Voz & Estilo Regional</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WEBHOOKS')}
            className={`py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 flex-1 ${
              activeTab === 'WEBHOOKS'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Webhook className="w-4 h-4 text-blue-600" />
            <span>Webhooks & Integrações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WHATSAPP')}
            className={`py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 flex-1 ${
              activeTab === 'WHATSAPP'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-600" />
            <span>API & Canal WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('THEME')}
            className={`py-3 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center justify-center space-x-1.5 flex-1 ${
              activeTab === 'THEME'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Tema & Aparência</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {activeTab === 'MARKETPLACES' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#2D3277] text-xs font-medium">
                💡 <strong>Afiliado Multi-Plataforma:</strong> Informe seus códigos e tags abaixo. Qualquer link colado de Shopee, Amazon, AliExpress, Temu, Magalu ou Mercado Livre será convertido automaticamente com suas credenciais!
              </div>

              {/* Mercado Livre */}
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
                <label className="font-bold text-[#2D3277] flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Mercado Livre (Tag `matext`)</span>
                  </span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono">matext=SUA_TAG</span>
                </label>
                <input
                  type="text"
                  required
                  value={marketplaceAccounts.mercadoLivreTag}
                  onChange={(e) => setMarketplaceAccounts({ ...marketplaceAccounts, mercadoLivreTag: e.target.value })}
                  placeholder="Ex: ofertastop_app"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#3483FA]"
                />
              </div>

              {/* Shopee */}
              <div className="bg-orange-50/60 p-3.5 rounded-xl border border-orange-200 space-y-1.5">
                <label className="font-bold text-orange-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>Shopee Afiliados (Sub ID / Afiliado ID)</span>
                  </span>
                  <span className="text-[10px] text-orange-700 bg-orange-100 px-2 py-0.5 rounded font-mono">sub_id=SUA_TAG</span>
                </label>
                <input
                  type="text"
                  value={marketplaceAccounts.shopeeTag}
                  onChange={(e) => setMarketplaceAccounts({ ...marketplaceAccounts, shopeeTag: e.target.value })}
                  placeholder="Ex: shopee_af_top"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Amazon */}
              <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 space-y-1.5">
                <label className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                    <span>Amazon Associados (Associate Tag)</span>
                  </span>
                  <span className="text-[10px] text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono">tag=SUA_TAG-20</span>
                </label>
                <input
                  type="text"
                  value={marketplaceAccounts.amazonTag}
                  onChange={(e) => setMarketplaceAccounts({ ...marketplaceAccounts, amazonTag: e.target.value })}
                  placeholder="Ex: ofertastop-20"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* AliExpress */}
              <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-200 space-y-1.5">
                <label className="font-bold text-red-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <span>AliExpress Portals (Tracking ID)</span>
                  </span>
                  <span className="text-[10px] text-red-700 bg-red-100 px-2 py-0.5 rounded font-mono">aff_fcid=SUA_TAG</span>
                </label>
                <input
                  type="text"
                  value={marketplaceAccounts.aliExpressTag}
                  onChange={(e) => setMarketplaceAccounts({ ...marketplaceAccounts, aliExpressTag: e.target.value })}
                  placeholder="Ex: ali_track_88"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Temu */}
              <div className="bg-orange-50/60 p-3.5 rounded-xl border border-orange-300 space-y-1.5">
                <label className="font-bold text-amber-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    <span>Temu Affiliate (Referral Code / Link ID)</span>
                  </span>
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono">referral_code=SEU_CODIGO</span>
                </label>
                <input
                  type="text"
                  value={marketplaceAccounts.temuTag}
                  onChange={(e) => setMarketplaceAccounts({ ...marketplaceAccounts, temuTag: e.target.value })}
                  placeholder="Ex: temu_code_99"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Magazine Luiza */}
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200 space-y-1.5">
                <label className="font-bold text-blue-950 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span>Magazine Luiza / Parceiro Magalu (ID da Loja)</span>
                  </span>
                  <span className="text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded font-mono">magazinevoce.com.br/SUA_LOJA</span>
                </label>
                <input
                  type="text"
                  value={marketplaceAccounts.magaluTag}
                  onChange={(e) => setMarketplaceAccounts({ ...marketplaceAccounts, magaluTag: e.target.value })}
                  placeholder="Ex: magazinetop"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {activeTab === 'BRAND_VOICE' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl text-white space-y-1 shadow-sm">
                <div className="flex items-center space-x-2 font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-[#FFE600]" />
                  <span>Personalização de Voz, Idioma & Estilo Regional (IA Gemini)</span>
                </div>
                <p className="text-[11px] text-purple-200/90 leading-relaxed">
                  Defina o idioma, o sotaque/estilo regional brasileiro e o tom da sua marca. O <strong>IMPORTHOURANDO</strong> usará gírias regionais brasileiras (Nordestino, Paulistano, Carioca, Gaúcho, Mineiro) ou formato formal/internacional para gerar ofertas autênticas!
                </p>
              </div>

              {/* NOVO: Seleção de Idioma e Estilo Regional Brasileiro */}
              <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-2">
                <label className="block font-bold text-purple-950 text-xs flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-purple-700" />
                    <span>Idioma e Estilo Regional Brasileiro</span>
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono font-bold">Gírias & Dialetos</span>
                </label>
                
                <select
                  value={brandVoice.languageStyle || 'PORTUGUES_PADRAO'}
                  onChange={(e) => setBrandVoice({ ...brandVoice, languageStyle: e.target.value as any })}
                  className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs font-bold text-purple-950 focus:outline-none focus:border-purple-600 shadow-sm"
                >
                  <option value="PORTUGUES_PADRAO">🇧🇷 Português Padrão (Limpo & Persuasivo)</option>
                  <option value="NORDESTINO">🌵 Nordestino (Oxe, Visse, Arretado, Danado de bom, Cabra)</option>
                  <option value="PAULISTANO">🌆 Paulistano (Pô meu, Da hora, Mano, Meu Deus, Bagulho doido)</option>
                  <option value="CARIOCA">🏖️ Carioca (Mermão, Caraca, Maneiro, Sinistro, Com certeza bro)</option>
                  <option value="GAUCHO">🧉 Gaúcho (Bah, Tchê, Tri legal, Capaz, Mas bah)</option>
                  <option value="MINEIRO">🧀 Mineiro (Uai, Trem bão, Nuuu, Bão demais da conta)</option>
                  <option value="FORMAL_EXECUTIVO">💼 Formal Executivo / Corporativo (Linguagem sóbria e elegante)</option>
                  <option value="INGLES">🇺🇸 English (International E-commerce & Dropshipping Hype)</option>
                  <option value="ESPANHOL">🇪🇸 Español (Latino América & Promociones)</option>
                </select>
                <p className="text-[11px] text-purple-800/80">
                  {brandVoice.languageStyle === 'NORDESTINO' && '🌵 Exemplo: "OXE, VISSE?! Olha essa promoção arretada de boa pra você!"'}
                  {brandVoice.languageStyle === 'PAULISTANO' && '🌆 Exemplo: "PÔ MEU, DA HORA DEMAIS! Dá um liga nesse desconto insano, mano!"'}
                  {brandVoice.languageStyle === 'CARIOCA' && '🏖️ Exemplo: "CARACA MERMÃO, SINISTRO! Olha o preço dessa Smart TV, fala tu!"'}
                  {brandVoice.languageStyle === 'GAUCHO' && '🧉 Exemplo: "BAH TCHÊ, TRI LEGAL! Bah, essa oferta tá de graça pra ti, tchê!"'}
                  {brandVoice.languageStyle === 'MINEIRO' && '🧀 Exemplo: "UAI, NUUU! Que trem bão esse desconto, cê num tá doido não!"'}
                  {brandVoice.languageStyle === 'FORMAL_EXECUTIVO' && '💼 Exemplo: "Prezado(a), informamos uma oportunidade exclusiva de aquisição corporativa com desconto."' }
                  {(!brandVoice.languageStyle || brandVoice.languageStyle === 'PORTUGUES_PADRAO') && '🇧🇷 Exemplo: "🔥 OFERTA IMPERDÍVEL! Confira esse desconto direto em reais para você!"'}
                </p>
              </div>

              {/* Estilo e Tom de Voz Presets */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-purple-600" />
                  <span>Estilo Principal de Tom de Voz</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'HYPED', label: '⚡ Empolgado & Viral', desc: 'Agressivo, entusiasta e informal' },
                    { key: 'FORMAL', label: '💼 Formal & Corporativo', desc: 'Respeitoso, elegante e conciso' },
                    { key: 'SALES', label: '🎯 Focado em Vendas', desc: 'Escassez, gatilhos e senso de urgência' },
                    { key: 'HUMOROUS', label: '😂 Descontraído / Memes', desc: 'Divertido, amigável e descontraído' },
                    { key: 'URGENT', label: '🚨 Alerta Vermelho', desc: 'Preço mínimo histórico urgente' },
                    { key: 'CUSTOM', label: '✏️ 100% Personalizado', desc: 'Siga exclusivamente o prompt' }
                  ].map((preset) => {
                    const isSel = brandVoice.toneStyle === preset.key;
                    return (
                      <div
                        key={preset.key}
                        onClick={() => setBrandVoice({ ...brandVoice, toneStyle: preset.key as any })}
                        className={`cursor-pointer p-2.5 rounded-xl border transition-all text-left space-y-0.5 ${
                          isSel
                            ? 'bg-purple-50 border-purple-600 text-purple-950 ring-2 ring-purple-600/20 font-bold'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <p className="text-xs">{preset.label}</p>
                        <p className="text-[10px] text-slate-500 font-normal line-clamp-1">{preset.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nome da Marca & Saudação de Abertura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome da Marca / Canal</label>
                  <input
                    type="text"
                    required
                    value={brandVoice.brandName}
                    onChange={(e) => setBrandVoice({ ...brandVoice, brandName: e.target.value })}
                    placeholder="Ex: IMPORTHOURANDO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Saudação / Abertura Padrão</label>
                  <input
                    type="text"
                    value={brandVoice.greetingGreeting}
                    onChange={(e) => setBrandVoice({ ...brandVoice, greetingGreeting: e.target.value })}
                    placeholder="Ex: 🔥 Fala galera do IMPORTHOURANDO!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Prompt Específico da Marca */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Diretrizes Específicas da Sua Marca (Prompt da IA)</span>
                  </span>
                  <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-mono">Injetado no Gemini</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Escreva instrução detalhada de como a IA deve se comportar (ex: "Sempre destaque o frete grátis, evite uso de palavrões, mencione garantia oficial e enfatize o parcelamento sem juros"):
                </p>
                <textarea
                  rows={3}
                  value={brandVoice.customPromptInstructions}
                  onChange={(e) => setBrandVoice({ ...brandVoice, customPromptInstructions: e.target.value })}
                  placeholder="Ex: Sempre chame os membros de 'família da economia', destaque parcelamento em 10x sem juros e reforce que os produtos são verificados..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 text-xs focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Densidade de Emojis & Chamada CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Densidade de Emojis nos Posts</label>
                  <select
                    value={brandVoice.emojiDensity}
                    onChange={(e) => setBrandVoice({ ...brandVoice, emojiDensity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                  >
                    <option value="HIGH">Alta (Muitos Emojis Chamativos 🔥🚨💥)</option>
                    <option value="MEDIUM">Moderada (Equilibrado & Limpo ✨🏷️)</option>
                    <option value="MINIMAL">Mínima (Poucos Emojis / Estilo Discreto 📌)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frase Chamada para Ação (CTA)</label>
                  <input
                    type="text"
                    value={brandVoice.customCtaPhrase}
                    onChange={(e) => setBrandVoice({ ...brandVoice, customCtaPhrase: e.target.value })}
                    placeholder="Ex: 👉 GARANTA A SUA OFERTA COM DESCONTO AQUI:"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Assinatura de Marca no Final do Post */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Slogan ou Assinatura da Marca no Final do Post</label>
                <input
                  type="text"
                  value={brandVoice.brandSignatureText}
                  onChange={(e) => setBrandVoice({ ...brandVoice, brandSignatureText: e.target.value })}
                  placeholder="Ex: ⚡ IMPORTHOURANDO - O robô que garante o menor preço para você!"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-600 font-medium"
                />
              </div>
            </div>
          )}

          {/* TAB WEBHOOKS */}
          {activeTab === 'WEBHOOKS' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-900 text-white rounded-xl space-y-1 shadow-sm">
                <div className="flex items-center space-x-2 font-extrabold text-xs">
                  <Webhook className="w-4 h-4 text-cyan-300" />
                  <span>Configuração de Webhooks & Automação de Eventos</span>
                </div>
                <p className="text-[11px] text-blue-200 leading-relaxed">
                  Envie notificações instantâneas em tempo real (HTTP POST JSON) para seus sistemas, CRM, n8n, Make ou Typebot sempre que uma oferta for disparada ou um novo assinante se cadastrar!
                </p>
              </div>

              {/* Toggle Habilitar Webhook */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="font-bold text-slate-900 text-xs">Status do Envio de Webhooks</p>
                  <p className="text-[11px] text-slate-500">Notificar servidores externos em tempo real</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWebhookConfig({ ...webhookConfig, enabled: !webhookConfig.enabled })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    webhookConfig.enabled
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {webhookConfig.enabled ? '✓ Webhooks Ativos' : 'Desativado'}
                </button>
              </div>

              {/* Endpoint URL & Secret Key */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">URL Endpoint do Seu Webhook (HTTP POST)</label>
                  <input
                    type="url"
                    value={webhookConfig.url}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
                    placeholder="Ex: https://webhook.site/importhourando-demo ou https://seu-n8n.com/webhook/..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Secret Key de Segurança (Header `X-Webhook-Secret`)</label>
                  <input
                    type="text"
                    value={webhookConfig.secretKey}
                    onChange={(e) => setWebhookConfig({ ...webhookConfig, secretKey: e.target.value })}
                    placeholder="Ex: whsec_123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Eventos Selecionáveis */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800">Eventos de Disparo Selecionados:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'OFFER_DISPATCHED', label: '🚀 Oferta Disparada no WhatsApp' },
                    { key: 'OFFER_AUTO_POSTED', label: '🤖 Oferta Postada Automaticamente pelo Robô' },
                    { key: 'SUBSCRIBER_REGISTERED', label: '✨ Novo Assinante Cadastrado / Verificado' },
                    { key: 'PLAN_CHANGED', label: '💳 Alteração de Plano ou Retenção' }
                  ].map(ev => {
                    const isChecked = (webhookConfig.events || []).includes(ev.key as any);
                    return (
                      <div
                        key={ev.key}
                        onClick={() => handleToggleWebhookEvent(ev.key as any)}
                        className={`cursor-pointer p-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs">{ev.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test Webhook Section */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-3 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-cyan-300 flex items-center space-x-1.5">
                      <Send className="w-3.5 h-3.5" />
                      <span>Testar Envio de Webhook Agora</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">Envia um payload de teste para a URL cadastrada</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition-all text-xs flex items-center space-x-1.5 shadow-sm"
                  >
                    {testingWebhook ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{testingWebhook ? 'Enviando...' : 'Disparar Teste'}</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-xs font-mono border ${testResult.success ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200' : 'bg-red-950/80 border-red-600 text-red-200'}`}>
                    <p className="font-bold flex items-center space-x-1.5">
                      <span>{testResult.success ? '✅ SUCESSO' : '⚠️ RESPOSTA DO SERVIDOR'}</span>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">HTTP {testResult.statusCode}</span>
                    </p>
                    <p className="text-[11px] mt-1">{testResult.message}</p>
                  </div>
                )}

                {/* Webhook Logs History */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">Histórico de Disparos de Webhook:</span>
                  <div className="bg-slate-950 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 text-[10px] font-mono border border-slate-800">
                    {webhookLogs.length === 0 ? (
                      <p className="text-slate-500 p-2 text-center">Nenhum evento de webhook registrado ainda.</p>
                    ) : (
                      webhookLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between border-b border-slate-800/60 pb-1 pt-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'}`}>
                              {log.responseCode} {log.status}
                            </span>
                            <span className="text-slate-200 font-bold">{log.event}</span>
                          </div>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WHATSAPP' && (
            <div className="space-y-4">
              {/* Default Channel Invite Link */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-2">
                <label className="block font-bold text-emerald-950 uppercase tracking-wider flex items-center space-x-1.5">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  <span>Link de Convite do Seu Canal do WhatsApp</span>
                </label>
                <p className="text-[11px] text-slate-600">
                  Este link será anexado automaticamente nos templates de ofertas para direcionar membros de grupos do WhatsApp diretamente para o seu Canal Oficial!
                </p>
                <input
                  type="text"
                  value={defaultChannelInviteLink}
                  onChange={(e) => setDefaultChannelInviteLink(e.target.value)}
                  placeholder="https://whatsapp.com/channel/0029Va..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* WhatsApp API Provider */}
              <div className="space-y-3 pt-2">
                <label className="block font-bold text-slate-800 flex items-center space-x-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Provedor da API de Disparo WhatsApp</span>
                </label>

                <select
                  value={whatsappApiType}
                  onChange={(e) => setWhatsappApiType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                >
                  <option value="EVOLUTION_API">Evolution API (Recomendado / Auto-hospedado)</option>
                  <option value="Z_API">Z-API (Oficial para WhatsApp Channels)</option>
                  <option value="META_CLOUD_API">Meta WhatsApp Cloud API (Oficial Business)</option>
                  <option value="SIMULATOR">Simulador de Disparos em Tempo Real</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ID da Instância / Session</label>
                    <input
                      type="text"
                      value={whatsappInstance}
                      onChange={(e) => setWhatsappInstance(e.target.value)}
                      placeholder="Ex: inst_meli_01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Token de Autenticação / Bearer</label>
                    <input
                      type="password"
                      value={whatsappToken}
                      onChange={(e) => setWhatsappToken(e.target.value)}
                      placeholder="Ex: evo_sec_..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Encurtador / Domínio Personalizado */}
              <div>
                <label className="block text-slate-700 mb-1 font-bold flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-[#3483FA]" />
                  <span>Domínio Personalizado para Encurtador (Opcional)</span>
                </label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Ex: m.ofertastop.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'THEME' && (
            <div className="space-y-6">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Personalização do Dashboard:</strong> Escolha a cor de destaque principal e personalize a identidade visual do seu painel de controle.
                  </span>
                </div>
              </div>

              {/* Modo de Exibição (Dark / Light) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Modo Claro / Modo Escuro (Noturno)</span>
                    </h4>
                    <p className="text-slate-500 text-xs">
                      O robô possui suporte nativo a tema escuro de alto contraste para trabalho noturno.
                    </p>
                  </div>
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border border-slate-300">
                    Alternador no Cabeçalho
                  </span>
                </div>
              </div>

              {/* Paleta de Cores de Destaque */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Selecione a Cor de Destaque (Accent Color)</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Aplicado em botões e destaques</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* BLUE */}
                  <button
                    type="button"
                    onClick={() => setThemeAccent('BLUE')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      themeAccent === 'BLUE'
                        ? 'border-[#3483FA] bg-blue-50/80 shadow-sm ring-2 ring-blue-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-[#3483FA] shadow-sm inline-block"></span>
                        <span className="font-extrabold text-slate-900 text-xs">Azul Mercado Livre</span>
                      </div>
                      {themeAccent === 'BLUE' && <CheckCircle2 className="w-4 h-4 text-[#3483FA]" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Tom oficial clássico Meli & IMPORTHOURANDO.</p>
                    <span className="text-[9px] font-mono font-bold bg-blue-100 text-[#2D3277] px-2 py-0.5 rounded w-fit">#3483FA</span>
                  </button>

                  {/* PURPLE */}
                  <button
                    type="button"
                    onClick={() => setThemeAccent('PURPLE')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      themeAccent === 'PURPLE'
                        ? 'border-purple-600 bg-purple-50/80 shadow-sm ring-2 ring-purple-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-purple-600 shadow-sm inline-block"></span>
                        <span className="font-extrabold text-slate-900 text-xs">Roxo Imperial</span>
                      </div>
                      {themeAccent === 'PURPLE' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Visual moderno, sofisticado e tecnológico.</p>
                    <span className="text-[9px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded w-fit">#8B5CF6</span>
                  </button>

                  {/* EMERALD */}
                  <button
                    type="button"
                    onClick={() => setThemeAccent('EMERALD')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      themeAccent === 'EMERALD'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm inline-block"></span>
                        <span className="font-extrabold text-slate-900 text-xs">Verde Esmeralda</span>
                      </div>
                      {themeAccent === 'EMERALD' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Foco em altas conversões e lucro líquido.</p>
                    <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded w-fit">#10B981</span>
                  </button>

                  {/* AMBER */}
                  <button
                    type="button"
                    onClick={() => setThemeAccent('AMBER')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      themeAccent === 'AMBER'
                        ? 'border-amber-500 bg-amber-50/80 shadow-sm ring-2 ring-amber-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-amber-500 shadow-sm inline-block"></span>
                        <span className="font-extrabold text-slate-900 text-xs">Dourado Âmbar</span>
                      </div>
                      {themeAccent === 'AMBER' && <CheckCircle2 className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Tom vibrante focado em alerta de super ofertas.</p>
                    <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded w-fit">#F59E0B</span>
                  </button>

                  {/* ROSE */}
                  <button
                    type="button"
                    onClick={() => setThemeAccent('ROSE')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      themeAccent === 'ROSE'
                        ? 'border-rose-500 bg-rose-50/80 shadow-sm ring-2 ring-rose-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-rose-500 shadow-sm inline-block"></span>
                        <span className="font-extrabold text-slate-900 text-xs">Vermelho Rosa</span>
                      </div>
                      {themeAccent === 'ROSE' && <CheckCircle2 className="w-4 h-4 text-rose-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Alta energia e urgência para relâmpago de vendas.</p>
                    <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded w-fit">#F43F5E</span>
                  </button>

                  {/* CYAN */}
                  <button
                    type="button"
                    onClick={() => setThemeAccent('CYAN')}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 cursor-pointer ${
                      themeAccent === 'CYAN'
                        ? 'border-cyan-500 bg-cyan-50/80 shadow-sm ring-2 ring-cyan-400'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 rounded-full bg-cyan-500 shadow-sm inline-block"></span>
                        <span className="font-extrabold text-slate-900 text-xs">Ciano Elétrico</span>
                      </div>
                      {themeAccent === 'CYAN' && <CheckCircle2 className="w-4 h-4 text-cyan-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">Estilo limpo e futurista para robôs de automação.</p>
                    <span className="text-[9px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded w-fit">#06B6D4</span>
                  </button>
                </div>
              </div>

              {/* Interactive Live Preview */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-xs text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pré-visualização em Tempo Real do Tema</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Tema Selecionado: {themeAccent}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all"
                    style={{
                      backgroundColor:
                        themeAccent === 'PURPLE' ? '#7c3aed' :
                        themeAccent === 'EMERALD' ? '#059669' :
                        themeAccent === 'AMBER' ? '#d97706' :
                        themeAccent === 'ROSE' ? '#e11d48' :
                        themeAccent === 'CYAN' ? '#0891b2' : '#3483FA'
                    }}
                  >
                    Botão de Ação Primário
                  </button>

                  <span
                    className="px-3 py-1 rounded-full text-xs font-black uppercase border"
                    style={{
                      color:
                        themeAccent === 'PURPLE' ? '#a78bfa' :
                        themeAccent === 'EMERALD' ? '#34d399' :
                        themeAccent === 'AMBER' ? '#fbbf24' :
                        themeAccent === 'ROSE' ? '#fb7185' :
                        themeAccent === 'CYAN' ? '#22d3ee' : '#60a5fa',
                      borderColor:
                        themeAccent === 'PURPLE' ? '#7c3aed' :
                        themeAccent === 'EMERALD' ? '#059669' :
                        themeAccent === 'AMBER' ? '#d97706' :
                        themeAccent === 'ROSE' ? '#e11d48' :
                        themeAccent === 'CYAN' ? '#0891b2' : '#3483FA',
                      backgroundColor: 'rgba(255,255,255,0.05)'
                    }}
                  >
                    Badge de Status
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Save Action & Copyright Notice */}
          <div className="pt-3 space-y-2">
            <button
              type="submit"
              className="w-full bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm text-sm cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-5 h-5 text-[#FFE600]" />
                  <span>Configurações Salvas com Sucesso!</span>
                </>
              ) : (
                <span>Salvar Configurações de Afiliado, Voz, Webhooks & Tema</span>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-semibold tracking-wide">
              Todos os direitos reservados a IMPORTHOUR©
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

