import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Copy, Check, Link2, ShoppingBag, ArrowRight, Smartphone, RefreshCw, AlertCircle, Zap, ShieldCheck, Tag, Image as ImageIcon } from 'lucide-react';
import { MercadoLivreProduct, OfferPostTemplate, WhatsAppChannel } from '../types';
import { ImageBadgeOverlayModal } from './ImageBadgeOverlayModal';

interface LinkConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: OfferPostTemplate[];
  channels: WhatsAppChannel[];
  affiliateTag: string;
  initialProduct?: MercadoLivreProduct | null;
  onDispatchSuccess: () => void;
  onRequirePlanActivation?: (actionName?: string) => boolean;
}

export const LinkConverterModal: React.FC<LinkConverterModalProps> = ({
  isOpen,
  onClose,
  templates,
  channels,
  affiliateTag,
  initialProduct,
  onDispatchSuccess,
  onRequirePlanActivation
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productOriginalPrice, setProductOriginalPrice] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Eletrônicos');

  const [currentProduct, setCurrentProduct] = useState<MercadoLivreProduct | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || 'temp-1');
  const [customPromptInstruction, setCustomPromptInstruction] = useState('');

  const [copyText, setCopyText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    channels.filter(c => c.status === 'CONNECTED').map(c => c.id)
  );
  const [postToStatus, setPostToStatus] = useState<boolean>(true);

  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Image Badge Overlay Modal State
  const [isImageBadgeOpen, setIsImageBadgeOpen] = useState(false);

  // Real-time API Verification State
  const [verification, setVerification] = useState<{
    isChecking: boolean;
    isValid: boolean | null;
    message: string;
    expectedTag?: string;
    autoFixUrl?: string;
    marketplace?: string;
  }>({
    isChecking: false,
    isValid: null,
    message: ''
  });

  const verifyAffiliateLink = async (urlToVerify?: string) => {
    const targetUrl = urlToVerify || (currentProduct ? currentProduct.affiliateUrl : inputUrl);
    if (!targetUrl || !targetUrl.trim()) return;

    setVerification(prev => ({ ...prev, isChecking: true }));

    try {
      const res = await fetch('/api/affiliate/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          marketplace: currentProduct?.marketplace,
          tag: affiliateTag
        })
      });

      const data = await res.json();
      if (res.ok) {
        setVerification({
          isChecking: false,
          isValid: data.isValid,
          message: data.message,
          expectedTag: data.expectedTag,
          autoFixUrl: data.autoFixUrl,
          marketplace: data.marketplace
        });
      } else {
        setVerification({
          isChecking: false,
          isValid: false,
          message: data.error || 'Erro ao realizar verificação do link.'
        });
      }
    } catch (err) {
      setVerification({
        isChecking: false,
        isValid: false,
        message: 'Falha de conexão na verificação em tempo real via API.'
      });
    }
  };

  useEffect(() => {
    if (initialProduct) {
      setCurrentProduct(initialProduct);
      setInputUrl(initialProduct.originalUrl || initialProduct.affiliateUrl);
      setProductTitle(initialProduct.title);
      setProductPrice(initialProduct.price.toString());
      setProductOriginalPrice(initialProduct.originalPrice.toString());
      setCouponCode(initialProduct.couponCode || '');
      setSelectedCategory(initialProduct.category);
      generateAiCopyForProduct(initialProduct, selectedTemplateId);
      verifyAffiliateLink(initialProduct.affiliateUrl);
    }
  }, [initialProduct]);

  useEffect(() => {
    if (isOpen && channels && channels.length > 0 && selectedChannelIds.length === 0) {
      const activeIds = channels.filter(c => c.status === 'CONNECTED').map(c => c.id);
      if (activeIds.length > 0) {
        setSelectedChannelIds(activeIds);
      }
    }
  }, [channels, isOpen]);

  if (!isOpen) return null;

  const handleParseLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ml/parse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: inputUrl,
          title: productTitle || undefined,
          price: productPrice || undefined,
          originalPrice: productOriginalPrice || undefined,
          category: selectedCategory,
          couponCode: couponCode || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao converter o link');
      }

      const parsed: MercadoLivreProduct = data.product;
      setCurrentProduct(parsed);
      setProductTitle(parsed.title);
      setProductPrice(parsed.price.toString());
      setProductOriginalPrice(parsed.originalPrice.toString());

      // Auto generate copy & verify affiliate tag via API
      await generateAiCopyForProduct(parsed, selectedTemplateId);
      await verifyAffiliateLink(parsed.affiliateUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar link');
    } finally {
      setIsParsing(false);
    }
  };

  const handleAutoFixTag = async () => {
    if (!verification.autoFixUrl) return;

    const fixedUrl = verification.autoFixUrl;
    setInputUrl(fixedUrl);

    if (currentProduct) {
      const updatedProduct: MercadoLivreProduct = {
        ...currentProduct,
        affiliateUrl: fixedUrl
      };
      setCurrentProduct(updatedProduct);
      await generateAiCopyForProduct(updatedProduct, selectedTemplateId);
    } else {
      // replace in copy text if present
      setCopyText(prev => prev.replace(/https?:\/\/[^\s]+/g, fixedUrl));
    }

    // Re-verify instantly via API
    await verifyAffiliateLink(fixedUrl);
  };

  const generateAiCopyForProduct = async (prod: MercadoLivreProduct, tmplId: string) => {
    setIsGeneratingAi(true);
    setErrorMessage(null);

    try {
      const selectedTmpl = templates.find(t => t.id === tmplId) || templates[0];
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: prod,
          template: selectedTmpl,
          customInstruction: customPromptInstruction
        })
      });

      const data = await res.json();
      if (data.copy) {
        setCopyText(data.copy);
      }
    } catch (err: any) {
      setErrorMessage('Erro na geração de copy por IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleTemplateChange = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    if (currentProduct) {
      generateAiCopyForProduct(currentProduct, tmplId);
    }
  };

  const handleCopyClipboard = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleSendDispatch = async () => {
    if (onRequirePlanActivation && !onRequirePlanActivation('realizar disparos de ofertas para os seus canais')) {
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      let activeProduct = currentProduct;

      // Auto-parse link if inputUrl is filled but not parsed yet
      if (!activeProduct && inputUrl.trim()) {
        const parseRes = await fetch('/api/ml/parse-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: inputUrl,
            title: productTitle || undefined,
            price: productPrice || undefined,
            originalPrice: productOriginalPrice || undefined,
            category: selectedCategory,
            couponCode: couponCode || undefined
          })
        });
        const parseData = await parseRes.json();
        if (parseData.product) {
          activeProduct = parseData.product;
          setCurrentProduct(activeProduct);
        }
      }

      if (!activeProduct) {
        throw new Error('Cole e converta o link do produto antes de disparar.');
      }

      let textToSend = copyText;
      if (!textToSend.trim()) {
        const selectedTmpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
        const copyRes = await fetch('/api/ai/generate-copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: activeProduct,
            template: selectedTmpl,
            customInstruction: customPromptInstruction
          })
        });
        const copyData = await copyRes.json();
        textToSend = copyData.copy || `🔥 OFERTA: ${activeProduct.title}\n${activeProduct.affiliateUrl}`;
        setCopyText(textToSend);
      }

      let activeChannels = [...selectedChannelIds];
      if (activeChannels.length === 0 && !postToStatus) {
        activeChannels = channels.filter(c => c.status === 'CONNECTED').map(c => c.id);
        if (activeChannels.length > 0) {
          setSelectedChannelIds(activeChannels);
        }
      }

      if (activeChannels.length === 0 && !postToStatus) {
        throw new Error('Selecione pelo menos um canal do WhatsApp ou marque a opção de publicar no Status.');
      }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: activeProduct,
          channelIds: activeChannels,
          messageText: textToSend,
          postToStatus: postToStatus
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao enviar para o WhatsApp');
      }

      setSendSuccessMessage(`Oferta disparada com sucesso para ${data.dispatchedCount} destino(s)!`);
      onDispatchSuccess();

      setTimeout(() => {
        setSendSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao realizar disparo.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl text-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#2D3277] text-[#FFE600] font-bold shadow-sm">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Converter Link ML & Criar Oferta</h3>
              <p className="text-xs text-slate-500">Gere textos com IA e anexe sua tag de afiliado: <span className="text-[#2D3277] font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">{affiliateTag}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - 2 Columns */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Col: URL Input & Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Link Input Section */}
            <form onSubmit={handleParseLink} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cole o Link do Produto (Qualquer Marketplace)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  ML, Shopee, Amazon, AliExpress, Temu, Magalu
                </span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://shopee.com.br/... ou amazon.com.br/... ou mercadolivre.com.br/..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#3483FA] transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isParsing || !inputUrl.trim()}
                  className="bg-[#3483FA] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 shrink-0 shadow-sm"
                >
                  {isParsing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Converter</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Detected Marketplace & Manual Verification Action */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {currentProduct && currentProduct.marketplace ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-semibold">Plataforma Detectada:</span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                      {currentProduct.marketplace === 'SHOPEE' ? '🍊 Shopee Brasil' :
                       currentProduct.marketplace === 'AMAZON' ? '📦 Amazon Brasil' :
                       currentProduct.marketplace === 'ALIEXPRESS' ? '🔴 AliExpress' :
                       currentProduct.marketplace === 'TEMU' ? '🔶 Temu Direct' :
                       currentProduct.marketplace === 'MAGALU' ? '💙 Magazine Luiza' :
                       '🟡 Mercado Livre'}
                    </span>
                  </div>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => verifyAffiliateLink()}
                  disabled={verification.isChecking || (!inputUrl && !currentProduct)}
                  className="text-[11px] font-bold text-[#2D3277] hover:text-blue-700 hover:underline flex items-center space-x-1 transition-all disabled:opacity-40"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verificar Tag via API</span>
                </button>
              </div>

              {/* REAL-TIME API AFFILIATE VERIFICATION ALERT BOX */}
              <div className="pt-1">
                {verification.isChecking ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="font-semibold">Verificando tag de comissões via API em tempo real...</span>
                  </div>
                ) : verification.isValid === false ? (
                  <div className="p-3.5 bg-red-50 border-2 border-red-500 rounded-xl text-xs text-red-950 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        <span className="font-extrabold text-red-900 uppercase text-[11px] tracking-wider">
                          🚨 ALERTA VISUAL: Link sem Tag de Afiliado!
                        </span>
                      </div>
                      <span className="bg-red-200 text-red-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-300">
                        SEM COMISSÃO
                      </span>
                    </div>
                    <p className="text-[11px] text-red-800 leading-relaxed font-medium">
                      Atenção: O link informado não contém a sua Tag de Afiliado configurada (<strong className="font-mono underline">{verification.expectedTag || affiliateTag}</strong>). Se você disparar este link, <strong className="font-bold underline">suas comissões serão perdidas</strong>!
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleAutoFixTag}
                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition-all active:scale-95"
                      >
                        <Zap className="w-4 h-4 text-[#FFE600]" />
                        <span>⚡ Inserir Minha Tag ({verification.expectedTag || affiliateTag}) Automaticamente</span>
                      </button>
                    </div>
                  </div>
                ) : verification.isValid === true ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="p-1 rounded-full bg-emerald-600 text-white">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <span className="font-extrabold text-emerald-950 block">Link de Afiliado Verificado em Tempo Real!</span>
                        <span className="text-[10px] text-emerald-700">Tag <strong className="font-mono bg-emerald-100 px-1 py-0.2 rounded text-emerald-900 font-bold">{verification.expectedTag}</strong> confirmada com sucesso via API.</span>
                      </div>
                    </div>
                    <span className="bg-emerald-200 text-emerald-900 font-black text-[10px] px-2.5 py-1 rounded-full border border-emerald-300 uppercase shrink-0">
                      100% GARANTIDO
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Optional override inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Preço Promocional (R$)</label>
                  <input
                    type="text"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="Ex: 2199.00"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Preço Original (R$)</label>
                  <input
                    type="text"
                    value={productOriginalPrice}
                    onChange={(e) => setProductOriginalPrice(e.target.value)}
                    placeholder="Ex: 3199.00"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cupom de Desconto (Opcional)</label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ex: MELI200"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-[#2D3277] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoria</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                  >
                    <option value="Eletrônicos">Eletrônicos</option>
                    <option value="Celulares">Celulares</option>
                    <option value="Eletrodomésticos">Eletrodomésticos</option>
                    <option value="Games">Games</option>
                    <option value="Áudio">Áudio</option>
                    <option value="Moda">Moda</option>
                    <option value="Casa">Casa & Cozinha</option>
                  </select>
                </div>
              </div>
            </form>

            {/* Template Selector & AI Custom Prompt */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#3483FA]" />
                  <span>Escolha o Estilo de Copy com IA</span>
                </label>
                {currentProduct && (
                  <button
                    onClick={() => generateAiCopyForProduct(currentProduct, selectedTemplateId)}
                    disabled={isGeneratingAi}
                    className="text-xs text-[#3483FA] font-bold hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>Regerar Copy</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedTemplateId === tmpl.id
                        ? 'bg-blue-50 border-[#3483FA] text-[#2D3277] font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 mb-0.5">{tmpl.name}</p>
                    <p className="text-[11px] line-clamp-1 opacity-80">{tmpl.headerText}</p>
                  </button>
                ))}
              </div>

              {/* Textarea Editor for copy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto da Mensagem (Edição Final)
                </label>
                <textarea
                  rows={7}
                  value={copyText}
                  onChange={(e) => setCopyText(e.target.value)}
                  placeholder="Seu texto de oferta para o WhatsApp aparecerá aqui..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-sans focus:outline-none focus:border-[#3483FA] transition-all leading-relaxed"
                />
              </div>

              {/* Target Channel Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Selecione os Canais de Destino:
                  </label>
                </div>

                {/* Auto Post Status Highlight Banner */}
                <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 cursor-pointer hover:bg-purple-100/80 transition-all text-xs">
                  <input
                    type="checkbox"
                    checked={postToStatus}
                    onChange={(e) => setPostToStatus(e.target.checked)}
                    className="rounded text-purple-700 focus:ring-0 w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="font-extrabold text-purple-950 flex items-center space-x-1.5">
                      <span>📸 Publicar Automaticamente no Meu Status do WhatsApp</span>
                      <span className="bg-purple-200 text-purple-900 text-[9px] px-1.5 py-0.5 rounded uppercase font-black">Stories 24h</span>
                    </span>
                    <span className="text-[10px] text-purple-800 block">Posta também em formato Stories com o seu link de comissão.</span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {channels.map((chan) => {
                    const isChecked = selectedChannelIds.includes(chan.id);
                    return (
                      <label
                        key={chan.id}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannelIds([...selectedChannelIds, chan.id]);
                            } else {
                              setSelectedChannelIds(selectedChannelIds.filter(id => id !== chan.id));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-0"
                        />
                        <span className="truncate">{chan.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Phone Live Mockup Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-200">
              <span className="flex items-center space-x-1 font-bold text-slate-800">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Pré-visualização no WhatsApp</span>
              </span>
              <button
                onClick={handleCopyClipboard}
                className="text-[#3483FA] font-bold hover:underline flex items-center space-x-1"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            {/* Smartphone Chat Shell */}
            <div className="bg-[#0b141a] rounded-2xl p-3 border border-emerald-900/30 shadow-inner flex-1 flex flex-col justify-between font-sans text-xs">
              {/* WhatsApp Chat Header */}
              <div className="bg-[#202c33] p-2.5 rounded-t-xl text-slate-200 flex items-center space-x-2.5 mb-3 border-b border-slate-700/50">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                  ML
                </div>
                <div>
                  <p className="font-semibold text-xs text-white leading-tight">⚡ Canal Ofertas Mercado Livre</p>
                  <p className="text-[10px] text-slate-400">Transmissão Oficial • 14.8k membros</p>
                </div>
              </div>

              {/* Chat Message Bubble */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                <div className="bg-[#202c33] text-slate-100 rounded-2xl p-3 max-w-[92%] ml-auto border border-slate-700/40 shadow">
                  {/* Product Thumbnail Card Preview */}
                  {currentProduct && (
                    <div className="bg-[#111b21] rounded-xl p-2.5 mb-2 border border-slate-800 space-y-2">
                      <div className="flex gap-2.5 items-center">
                        <img
                          src={currentProduct.imageUrl}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-[11px] font-bold text-white truncate">{currentProduct.title}</p>
                          <p className="text-[10px] text-emerald-400 font-bold">
                            R$ {currentProduct.price.toFixed(2).replace('.', ',')} ({currentProduct.discountPercentage}% OFF)
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">mercadolivre.com.br</p>
                        </div>
                      </div>

                      {/* Custom Image Badge Overlay Button */}
                      <button
                        type="button"
                        onClick={() => setIsImageBadgeOpen(true)}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-extrabold text-[10px] rounded-lg flex items-center justify-center gap-1.5 shadow transition-all uppercase tracking-wider"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FFE600]" />
                        <span>Adicionar Etiqueta na Imagem ('Oferta do Dia', 'Desconto Real')</span>
                      </button>
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-200 font-sans">
                    {copyText || 'Digite ou converta um link para ver a mensagem aqui...'}
                  </div>

                  <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end space-x-1">
                    <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-emerald-400">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Phone Footer */}
              <div className="mt-3 text-[10px] text-slate-400 text-center">
                Link com a tag <span className="text-amber-300 font-mono">{affiliateTag}</span> configurada.
              </div>
            </div>

            {/* Error & Success Notifications */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {sendSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            {/* Modal Bottom Action Button */}
            <button
              onClick={handleSendDispatch}
              disabled={isSending || !copyText}
              className="w-full bg-[#2D3277] hover:bg-[#3D438F] text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center space-x-2 shadow transition-all disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[#FFE600]" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#FFE600]" />
                  <span>Disparar Oferta para {selectedChannelIds.length} Canal(is)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Image Badge Overlay Customizer Modal */}
      {currentProduct && (
        <ImageBadgeOverlayModal
          isOpen={isImageBadgeOpen}
          onClose={() => setIsImageBadgeOpen(false)}
          imageUrl={currentProduct.imageUrl}
          productTitle={currentProduct.title}
          productPrice={currentProduct.price}
          discountPercentage={currentProduct.discountPercentage}
          onApplyImage={(stampedImageUrl) => {
            setCurrentProduct({
              ...currentProduct,
              imageUrl: stampedImageUrl
            });
          }}
        />
      )}
    </div>
  );
};
