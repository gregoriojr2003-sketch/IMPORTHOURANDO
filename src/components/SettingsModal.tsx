import React, { useState } from 'react';
import { X, Settings, ShieldCheck, Globe, Check, Server, Store, Link2, Sparkles, Volume2, MessageSquare, Wand2, Info, Database, Download, Webhook, Radio, Plus, Trash2, Send, Play, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AffiliateConfig, MarketplaceAffiliateAccounts, BrandVoiceConfig, WebhookConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AffiliateConfig;
  onSaveConfig: (updated: Partial<AffiliateConfig>) => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
  onOpenBackup?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRequirePlanActivation,
  onOpenBackup
}) => {
  const [activeTab, setActiveTab] = useState<'MARKETPLACES' | 'WHATSAPP' | 'BRAND_VOICE' | 'WEBHOOKS'>('MARKETPLACES');

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
    greetingGreeting: '🔥 Fala galera do IMPORTHOURANDO!',
    customPromptInstructions: 'Destaque a economia no valor do produto em reais, crie senso de urgência motivando a compra imediata e mencione que a oferta é de procedência verificada.',
    emojiDensity: 'HIGH',
    brandSignatureText: '⚡ IMPORTHOURANDO - O robô que garante o menor preço para você!',
    customCtaPhrase: '👉 GARANTA A SUA OFERTA COM DESCONTO AQUI:'
  };

  const [marketplaceAccounts, setMarketplaceAccounts] = useState<MarketplaceAffiliateAccounts>(initialAccounts);
  const [brandVoice, setBrandVoice] = useState<BrandVoiceConfig>(initialBrandVoice);
  const [defaultChannelInviteLink, setDefaultChannelInviteLink] = useState(config.defaultChannelInviteLink || 'https://whatsapp.com/channel/0029Va901823748291');

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(config.webhooks || []);
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<('DISPATCH_SUCCESS' | 'DISPATCH_FAILURE' | 'PRICE_ALERT')[]>(['DISPATCH_SUCCESS']);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: number | string; message: string; isSuccess: boolean }>>({});

  const [customDomain, setCustomDomain] = useState(config.customDomain || '');
  const [whatsappApiType, setWhatsappApiType] = useState(config.whatsappApiType);
  const [whatsappToken, setWhatsappToken] = useState(config.whatsappToken);
  const [whatsappInstance, setWhatsappInstance] = useState(config.whatsappInstance);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (isOpen && config) {
      if (config.marketplaceAccounts) {
        setMarketplaceAccounts(config.marketplaceAccounts);
      }
      if (config.brandVoice) {
        setBrandVoice(config.brandVoice);
      }
      if (config.webhooks) {
        setWebhooks(config.webhooks);
      }
      if (config.defaultChannelInviteLink) {
        setDefaultChannelInviteLink(config.defaultChannelInviteLink);
      }
      if (config.customDomain !== undefined) setCustomDomain(config.customDomain);
      if (config.whatsappApiType !== undefined) setWhatsappApiType(config.whatsappApiType);
      if (config.whatsappToken !== undefined) setWhatsappToken(config.whatsappToken);
      if (config.whatsappInstance !== undefined) setWhatsappInstance(config.whatsappInstance);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    let url = newWebhookUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const newWh: WebhookConfig = {
      id: `wh-${Date.now()}`,
      name: newWebhookName.trim() || 'Webhook Personalizado',
      url,
      enabled: true,
      events: newWebhookEvents.length > 0 ? newWebhookEvents : ['DISPATCH_SUCCESS'],
      secretToken: newWebhookSecret.trim() || undefined,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      lastStatus: undefined
    };

    setWebhooks(prev => [...prev, newWh]);
    setNewWebhookName('');
    setNewWebhookUrl('');
    setNewWebhookSecret('');
    setNewWebhookEvents(['DISPATCH_SUCCESS']);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleTestWebhook = async (wh: WebhookConfig) => {
    setTestingWebhookId(wh.id);
    setTestResults(prev => ({
      ...prev,
      [wh.id]: { status: 'Carregando...', message: 'Enviando pacote HTTP POST de teste...', isSuccess: false }
    }));

    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: wh.url,
          secretToken: wh.secretToken
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const statusCode = data.httpStatus || 200;
        setTestResults(prev => ({
          ...prev,
          [wh.id]: {
            status: `${statusCode} OK`,
            message: `Notificação entregue com sucesso no endpoint remoto (${statusCode})!`,
            isSuccess: true
          }
        }));
        setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, lastStatus: statusCode, lastTriggeredAt: 'Agora (Teste)' } : w));
      } else {
        const statusCode = data.httpStatus || 500;
        setTestResults(prev => ({
          ...prev,
          [wh.id]: {
            status: `Erro ${statusCode}`,
            message: data.error || 'Servidor de destino não respondeu ou recusou o envio.',
            isSuccess: false
          }
        }));
        setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, lastStatus: statusCode } : w));
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [wh.id]: {
          status: 'Falha de Conexão',
          message: err.message || 'Falha de rede ao tentar conectar ao webhook.',
          isSuccess: false
        }
      }));
    } finally {
      setTestingWebhookId(null);
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
      webhooks,
      defaultChannelInviteLink,
      customDomain,
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
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl text-slate-900 shadow-2xl overflow-hidden my-8">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#2D3277] text-[#FFE600] font-bold shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Configurações Gerais, Voz & Webhooks</h3>
              <p className="text-xs text-slate-500">Credenciais de Afiliado, IA da Marca, WhatsApp e Webhooks Personalizados</p>
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
            className={`flex-1 min-w-[120px] py-3 px-2 text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'MARKETPLACES'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#3483FA]" />
            <span>Afiliados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BRAND_VOICE')}
            className={`flex-1 min-w-[120px] py-3 px-2 text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'BRAND_VOICE'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Tom de Voz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WHATSAPP')}
            className={`flex-1 min-w-[120px] py-3 px-2 text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'WHATSAPP'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span>API WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WEBHOOKS')}
            className={`flex-1 min-w-[120px] py-3 px-2 text-center border-b-2 transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'WEBHOOKS'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-blue-600" />
            <span>Webhooks ({webhooks.length})</span>
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
                  <span>Personalização de Voz e Identidade da Marca (IA Gemini)</span>
                </div>
                <p className="text-[11px] text-purple-200/90 leading-relaxed">
                  Defina exatamente como o <strong>IMPORTHOURANDO</strong> deve se comunicar! As instruções abaixo serão injetadas diretamente no modelo de Inteligência Artificial para gerar textos no WhatsApp e Status alinhados com a sua marca.
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

              {/* Visual Preview Box */}
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl space-y-1 border border-purple-800">
                <span className="text-[10px] uppercase font-bold text-purple-400 block tracking-wider">
                  Pré-visualização do Formato da Sua Marca ({brandVoice.brandName}):
                </span>
                <p className="text-xs font-sans whitespace-pre-line leading-relaxed text-slate-200 font-mono">
                  {brandVoice.greetingGreeting || '🔥 ABERTURA'}{'\n\n'}
                  📦 *Smart TV 55" Samsung 4K UHD*{'\n'}
                  ❌ De R$ 3.199,00 por apenas *R$ 2.199,00*{'\n'}
                  {brandVoice.customCtaPhrase || '👉 GARANTA AQUI:'}{'\n'}
                  https://mercadolivre.com/sec/2a8Fk9L{'\n\n'}
                  {brandVoice.brandSignatureText}
                </p>
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

          {activeTab === 'WEBHOOKS' && (
            <div className="space-y-5">
              {/* Info Header */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3 text-blue-900">
                <Webhook className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <h4 className="font-bold text-blue-900">Webhooks Personalizados & Notificações Externas</h4>
                  <p className="text-blue-700 text-[11px] mt-0.5">
                    Cadastre endpoints HTTP POST para integrar o robô com sistemas externos (n8n, Make, Zapier, Discord, Slack ou seu servidor próprio). Toda vez que uma oferta for disparada com sucesso, um payload JSON será enviado em tempo real.
                  </p>
                </div>
              </div>

              {/* Form to Add New Webhook */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-xs">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Cadastrar Novo Webhook / Endpoint</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">Nome de Identificação</label>
                    <input
                      type="text"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      placeholder="Ex: Servidor n8n - Notificação de Disparos"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">URL do Webhook (Endpoint HTTPS)</label>
                    <input
                      type="text"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      placeholder="https://n8n.meusite.com/webhook/disparo-oferta"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">Chave Secret / Header de Autenticação (Opcional)</label>
                    <input
                      type="text"
                      value={newWebhookSecret}
                      onChange={(e) => setNewWebhookSecret(e.target.value)}
                      placeholder="Ex: sec_tok_98123 (Enviado em X-Webhook-Secret)"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1 text-[11px]">Gatilho de Eventos</label>
                    <div className="flex items-center space-x-3 pt-1 text-[11px]">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes('DISPATCH_SUCCESS')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhookEvents(prev => [...prev, 'DISPATCH_SUCCESS']);
                            } else {
                              setNewWebhookEvents(prev => prev.filter(ev => ev !== 'DISPATCH_SUCCESS'));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">Disparo Realizado</span>
                      </label>

                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newWebhookEvents.includes('PRICE_ALERT')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewWebhookEvents(prev => [...prev, 'PRICE_ALERT']);
                            } else {
                              setNewWebhookEvents(prev => prev.filter(ev => ev !== 'PRICE_ALERT'));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">Alerta de Preço</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddWebhook}
                  disabled={!newWebhookUrl.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Webhook</span>
                </button>
              </div>

              {/* Registered Webhooks List */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>Webhooks Cadastrados ({webhooks.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">Disparos automáticos em background</span>
                </h4>

                {webhooks.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 text-xs">
                    Nenhum webhook cadastrado. Preencha os campos acima para adicionar um endpoint externo.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {webhooks.map((wh) => {
                      const testResult = testResults[wh.id];
                      const isTesting = testingWebhookId === wh.id;

                      return (
                        <div
                          key={wh.id}
                          className={`p-3.5 border rounded-xl transition-all ${
                            wh.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 overflow-hidden pr-2">
                              <div className="flex items-center space-x-2">
                                <span className={`w-2 h-2 rounded-full ${wh.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <h5 className="font-bold text-slate-900 text-xs truncate">{wh.name}</h5>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {wh.events.join(', ')}
                                </span>
                              </div>

                              <p className="font-mono text-[11px] text-slate-600 truncate break-all">{wh.url}</p>

                              {wh.secretToken && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Header Secret: <span className="text-slate-600">X-Webhook-Secret</span>
                                </p>
                              )}

                              <div className="flex items-center space-x-3 text-[10px] text-slate-400 pt-0.5">
                                <span>Criado em: {wh.createdAt}</span>
                                {wh.lastTriggeredAt && (
                                  <span>Último envio: <strong className="text-slate-700">{wh.lastTriggeredAt}</strong></span>
                                )}
                                {wh.lastStatus && (
                                  <span className={`font-bold ${wh.lastStatus === 200 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    HTTP {wh.lastStatus}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleWebhook(wh.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                  wh.enabled
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {wh.enabled ? 'Ativo' : 'Pausado'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleTestWebhook(wh)}
                                disabled={isTesting}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-[11px] flex items-center space-x-1 transition-all"
                              >
                                {isTesting ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                                    <span>Testando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3 h-3 text-blue-600" />
                                    <span>Testar</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteWebhook(wh.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Excluir Webhook"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Real-Time Test Result Box */}
                          {testResult && (
                            <div
                              className={`mt-2.5 p-2.5 rounded-lg text-[11px] flex items-start space-x-2 border ${
                                testResult.isSuccess
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                  : 'bg-amber-50 border-amber-200 text-amber-900'
                              }`}
                            >
                              {testResult.isSuccess ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold mr-1">[{testResult.status}]</span>
                                <span>{testResult.message}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Local Backup Quick Action Box */}
          {onOpenBackup && (
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-[#2D3277]">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Cópia de Segurança Local (Backup JSON)</h5>
                  <p className="text-[11px] text-slate-500">Exporte ou restaure suas tags, canais e agendamentos.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold text-xs flex items-center space-x-1 transition-all shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>Backup / Restaurar</span>
              </button>
            </div>
          )}

          {/* Save Action */}
          <div className="pt-1">
            <button
              type="submit"
              className="w-full bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm text-sm"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-5 h-5 text-[#FFE600]" />
                  <span>Configurações & Tom de Voz Salvos com Sucesso!</span>
                </>
              ) : (
                <span>Salvar Configurações de Afiliado, Voz & WhatsApp</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

