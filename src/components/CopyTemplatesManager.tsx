import React, { useState } from 'react';
import { Cpu, Plus, Sparkles, Check, Tag, Image, Eye, MessageSquare, Smartphone, Zap, Wand2, Copy, Target } from 'lucide-react';
import { OfferPostTemplate } from '../types';
import { detectProductNiche, buildViralNicheCopy, OFFER_NICHES } from '../utils/nicheDetector';

interface CopyTemplatesManagerProps {
  templates: OfferPostTemplate[];
  onAddTemplate: (template: Partial<OfferPostTemplate>) => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const CopyTemplatesManager: React.FC<CopyTemplatesManagerProps> = ({
  templates,
  onAddTemplate,
  onRequirePlanActivation
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<OfferPostTemplate>(templates[0]);
  const [name, setName] = useState('');
  const [tone, setTone] = useState<'URGENT' | 'CASUAL' | 'ACHADINHOS' | 'TECH' | 'MINIMAL' | 'CUSTOM'>('URGENT');
  const [headerText, setHeaderText] = useState('');
  const [bodyPattern, setBodyPattern] = useState('{header}\n\n🔥 *{titulo_produto}*\n\n❌ De: R$ {preco_original}\n✅ Por: *R$ {preco_com_desconto}* ({porcentagem_desconto}% OFF)\n💳 {parcelamento}\n🚚 {frete_gratis}\n🎟️ Cupom: *{cupom_desconto}*\n\n{cta}\n{link_afiliado}');
  const [callToActionText, setCallToActionText] = useState('');
  const [sendImage, setSendImage] = useState(true);

  // Tester / Niche Generator Interactive State
  const [testTitle, setTestTitle] = useState('Smart TV 55" Samsung 4K Crystal UHD');
  const [testOrigPrice, setTestOrigPrice] = useState(3199);
  const [testPrice, setTestPrice] = useState(2199);
  const [testDiscount, setTestDiscount] = useState(31);
  const [generatedNicheCopy, setGeneratedNicheCopy] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedTester, setCopiedTester] = useState(false);

  const detectedTesterNiche = detectProductNiche(testTitle);

  const handleGenerateTesterCopy = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            id: 'test-prod',
            title: testTitle,
            originalPrice: testOrigPrice,
            price: testPrice,
            discountPercentage: testDiscount,
            shippingFree: true,
            rating: 4.8,
            reviewsCount: 340,
            category: detectedTesterNiche.name,
            imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
            originalUrl: 'https://mercadolivre.com/sec/2a8Fk9L',
            affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=importhourando',
            couponCode: 'MELITV200',
            stockStatus: 'EM_ESTOQUE',
            sellerName: 'Loja Oficial Samsung',
            marketplace: 'MERCADO_LIVRE'
          }
        })
      });

      const data = await res.json();
      if (data.copy) {
        setGeneratedNicheCopy(data.copy);
      } else {
        const fallback = buildViralNicheCopy({
          productTitle: testTitle,
          originalPrice: testOrigPrice,
          price: testPrice,
          discountPercentage: testDiscount,
          affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=importhourando',
          category: detectedTesterNiche.name,
          shippingFree: true,
          couponCode: 'MELITV200'
        });
        setGeneratedNicheCopy(fallback.copy);
      }
    } catch (err) {
      const fallback = buildViralNicheCopy({
        productTitle: testTitle,
        originalPrice: testOrigPrice,
        price: testPrice,
        discountPercentage: testDiscount,
        affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=importhourando',
        category: detectedTesterNiche.name,
        shippingFree: true,
        couponCode: 'MELITV200'
      });
      setGeneratedNicheCopy(fallback.copy);
    } finally {
      setIsGenerating(false);
    }
  };

  const availableTags = [
    { tag: '{titulo_produto}', label: 'Título' },
    { tag: '{preco_original}', label: 'Preço Cortado' },
    { tag: '{preco_com_desconto}', label: 'Preço Promo' },
    { tag: '{porcentagem_desconto}', label: '% OFF' },
    { tag: '{link_afiliado}', label: 'Link Afiliado' },
    { tag: '{cupom_desconto}', label: 'Cupom' },
    { tag: '{frete_gratis}', label: 'Frete Grátis' },
    { tag: '{parcelamento}', label: 'Parcelas' }
  ];

  const handleTagClick = (tagStr: string) => {
    setBodyPattern((prev) => prev + ' ' + tagStr);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTemplate({
      name,
      tone,
      headerText: headerText || '🚨 PROMOÇÃO RELÂMPAGO DO DIA! 🚨',
      bodyPattern,
      sendImage,
      callToActionText: callToActionText || '👉 COMPRE AQUI COM DESCONTO:',
      includeRating: true,
      includeInstallments: true,
      includeShipping: true,
      includeCoupons: true,
      hashtagTags: ['MercadoLivre', 'Ofertas']
    });

    setName('');
    setHeaderText('');
    setCallToActionText('');
    setShowAddModal(false);
  };

  // Render dummy WhatsApp message preview
  const formatMockupMessage = (tmpl: OfferPostTemplate) => {
    return `${tmpl.headerText}\n\n🔥 *Smart TV 55" Samsung 4K Crystal UHD*\n\n❌ De: R$ 3.199,00\n✅ Por: *R$ 2.199,00* (31% OFF)\n💳 10x de R$ 219,90 sem juros\n🚚 Frete Grátis!\n🎟️ Cupom: *MELITV200*\n\n${tmpl.callToActionText}\nhttps://mercadolivre.com/sec/2a8Fk9L?matext=ofertastop_app`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-[#3483FA]" />
            <span>Formatador de Copys & Templates para WhatsApp</span>
          </h2>
          <p className="text-xs text-slate-500">
            Personalize a estrutura das mensagens com tags dinâmicas e visualize o resultado ao vivo em um mockup de celular.
          </p>
        </div>

        <button
          onClick={() => {
            if (onRequirePlanActivation && !onRequirePlanActivation('criar e salvar novos modelos de copy')) return;
            setShowAddModal(true);
          }}
          className="bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#FFE600]" />
          <span>Criar Novo Modelo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Templates List + Interactive Niche Copy Generator */}
        <div className="lg:col-span-7 space-y-6">
          {/* Templates List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((tmpl) => {
              const isSelected = selectedPreviewTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedPreviewTemplate(tmpl)}
                  className={`cursor-pointer bg-white border rounded-2xl p-4 space-y-3 transition-all shadow-sm ${
                    isSelected ? 'border-[#3483FA] ring-2 ring-[#3483FA]/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-100 text-[#2D3277] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {tmpl.tone}
                    </span>
                    {tmpl.sendImage && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <Image className="w-3 h-3" />
                        <span>Com Foto</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{tmpl.name}</h3>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 line-clamp-3">
                    {tmpl.headerText}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Clique para pré-visualizar</span>
                    <Eye className="w-3.5 h-3.5 text-[#3483FA]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Niche Detector & Viral Copy Generator Box */}
          <div className="bg-white border border-purple-200 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-sm">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                    <span>Detector de Nicho & Gerador de Copy Viral</span>
                    <span className="bg-purple-100 text-purple-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      Novo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Digite qualquer produto para detectar automaticamente o nicho e gerar uma copy viral especializada.
                  </p>
                </div>
              </div>
            </div>

            {/* Title Input & Live Niche Detection Badge */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título ou Nome do Produto:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="Ex: Fritadeira Airfryer Philips Walita, PlayStation 5, Whey Protein..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateTesterCopy}
                    disabled={isGenerating || !testTitle.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all disabled:opacity-50 shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <Zap className="w-3.5 h-3.5 animate-spin" />
                        <span>Gerando...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-[#FFE600]" />
                        <span>Gerar Copy Viral</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Detected Niche Badge Info */}
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{detectedTesterNiche.emoji}</span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Nicho Detectado pela IA:</span>
                    <span className="font-extrabold text-purple-900">{detectedTesterNiche.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Gatilho de Vendas:</span>
                  <span className="text-[11px] font-bold text-slate-700 italic">
                    "{detectedTesterNiche.slangAndTriggers[0]}"
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons for Test */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Testar Nichos:</span>
                {[
                  { label: '🎮 Gamer (PS5)', title: 'Console PlayStation 5 Slim 1TB + Controle DualSense' },
                  { label: '🍳 Casa (Airfryer)', title: 'Fritadeira Elétrica Airfryer Philips Walita 4.1L 1400W' },
                  { label: '💪 Fitness (Whey)', title: 'Whey Protein 100% Pure 900g Max Titanium' },
                  { label: '✨ Beleza (Perfume)', title: 'Perfume Sauvage Dior Masculino Eau de Parfum 100ml' },
                  { label: '⚡ Tech (Smart TV)', title: 'Smart TV 55" Samsung 4K Crystal UHD' }
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setTestTitle(sample.title);
                      setGeneratedNicheCopy(null);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-900 font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>

              {/* Output Box for Generated Niche Copy */}
              {generatedNicheCopy && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-950 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Copy Viral Gerada para o Nicho de {detectedTesterNiche.name}:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedNicheCopy);
                        setCopiedTester(true);
                        setTimeout(() => setCopiedTester(false), 2000);
                      }}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                    >
                      {copiedTester ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono whitespace-pre-line leading-relaxed border border-purple-800 shadow-inner max-h-64 overflow-y-auto">
                    {generatedNicheCopy}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Live WhatsApp Mockup Screen */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm sticky top-20">
            <div className="flex items-center space-x-2 text-slate-900">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm">Pré-Visualização ao Vivo no WhatsApp</h3>
            </div>

            {/* Mobile Phone Screen Container */}
            <div className="mx-auto max-w-sm bg-slate-900 rounded-[28px] p-3 shadow-xl border-4 border-slate-800">
              {/* Phone Header */}
              <div className="bg-[#075E54] text-white px-3 py-2 rounded-t-[20px] flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-400 flex items-center justify-center font-bold text-xs text-slate-900">
                  ML
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">Canal Ofertas ML Oficial</p>
                  <p className="text-[9px] text-emerald-100">14.850 seguidores</p>
                </div>
              </div>

              {/* Chat Canvas with WhatsApp Background */}
              <div className="bg-[#E5DDD5] p-3 min-h-[320px] rounded-b-[20px] flex flex-col justify-end">
                {/* Bubble Message */}
                <div className="bg-white rounded-xl p-2.5 shadow text-[11px] text-slate-900 max-w-[92%] ml-auto space-y-2 border border-emerald-100">
                  {selectedPreviewTemplate.sendImage && (
                    <img
                      src="https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80"
                      alt="Preview Produto"
                      className="w-full h-32 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                  <div className="whitespace-pre-line font-sans leading-snug">
                    {formatMockupMessage(selectedPreviewTemplate)}
                  </div>
                  <div className="text-[9px] text-slate-400 text-right">
                    10:42 AM ✓✓
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg text-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">Criar Novo Modelo de Copy para WhatsApp</h3>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Modelo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Estilo Achadinhos TikTok"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tom de Voz</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="URGENT">Urgente / Imperdível (🚨 ⚡)</option>
                    <option value="ACHADINHOS">Achadinhos (✨ 💖)</option>
                    <option value="TECH">Especificações Tech (💻 🎮)</option>
                    <option value="MINIMAL">Minimalista (📌 🔗)</option>
                    <option value="CUSTOM">Customizado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Enviar Imagem?</label>
                  <select
                    value={sendImage ? 'true' : 'false'}
                    onChange={(e) => setSendImage(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  >
                    <option value="true">Sim, com imagem do produto</option>
                    <option value="false">Não, apenas texto legenda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Texto do Cabeçalho</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Ex: 🚨 PROMOÇÃO BOMBÁTICA DO DIA! 🚨"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>

              {/* Tags Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inserir Tags Dinâmicas:</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availableTags.map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => handleTagClick(t.tag)}
                      className="bg-amber-100 hover:bg-amber-200 text-[#2D3277] text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                    >
                      + {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={bodyPattern}
                  onChange={(e) => setBodyPattern(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#3483FA]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chamada para Ação (CTA)</label>
                <input
                  type="text"
                  value={callToActionText}
                  onChange={(e) => setCallToActionText(e.target.value)}
                  placeholder="Ex: 👉 GARANTA O SEU LINK AQUI:"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-[#3483FA]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold py-2.5 rounded-xl"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
