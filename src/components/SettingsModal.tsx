import React, { useState } from 'react';
import { X, Settings, ShieldCheck, Globe, Check, Server, Store, Link2, Sparkles, Volume2, MessageSquare, Wand2, Info } from 'lucide-react';
import { AffiliateConfig, MarketplaceAffiliateAccounts, BrandVoiceConfig } from '../types';

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
  const [activeTab, setActiveTab] = useState<'MARKETPLACES' | 'WHATSAPP' | 'BRAND_VOICE'>('MARKETPLACES');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRequirePlanActivation && !onRequirePlanActivation('salvar as configurações e tags de afiliado')) {
      return;
    }
    onSaveConfig({
      affiliateTag: marketplaceAccounts.mercadoLivreTag,
      marketplaceAccounts,
      brandVoice,
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
              <h3 className="font-bold text-base text-slate-900">Configurações Gerais, Voz & WhatsApp</h3>
              <p className="text-xs text-slate-500">Credenciais de Afiliado, Tom de Voz da Marca e API WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('MARKETPLACES')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 ${
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
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'BRAND_VOICE'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Tom de Voz & IA da Marca</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WHATSAPP')}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'WHATSAPP'
                ? 'border-[#2D3277] text-[#2D3277] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-600" />
            <span>API & Canal do WhatsApp</span>
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

          {/* Save Action */}
          <div className="pt-3">
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

