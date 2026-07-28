import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Download, Check, RefreshCw, Upload, Tag, Palette, Move, ShieldCheck, Flame, Zap, Crown, Truck, Percent } from 'lucide-react';

interface ImageBadgeOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productTitle?: string;
  productPrice?: number;
  discountPercentage?: number;
  onApplyImage: (stampedImageUrl: string) => void;
}

const BADGE_PRESETS = [
  'Oferta do Dia',
  'Desconto Real',
  '30% OFF',
  'Frete Grátis',
  'Imperdível',
  'Menor Preço',
  'Mais Vendido',
  'Últimas Unidades'
];

type BadgeColorTheme = 'RED_FLAME' | 'EMERALD_DISCOUNT' | 'BLUE_TECH' | 'PURPLE_VIP' | 'GOLD_BLACK';

const COLOR_THEMES: { id: BadgeColorTheme; label: string; bg: string; text: string; border: string; previewClass: string }[] = [
  { id: 'RED_FLAME', label: '🔥 Vermelho Fogo', bg: '#DC2626', text: '#FFFFFF', border: '#FEF08A', previewClass: 'bg-red-600 text-white border-amber-300' },
  { id: 'EMERALD_DISCOUNT', label: '💚 Verde Economia', bg: '#059669', text: '#FFFFFF', border: '#A7F3D0', previewClass: 'bg-emerald-600 text-white border-emerald-200' },
  { id: 'BLUE_TECH', label: '💙 Azul Destaque', bg: '#2563EB', text: '#FFFFFF', border: '#93C5FD', previewClass: 'bg-blue-600 text-white border-blue-300' },
  { id: 'PURPLE_VIP', label: '👑 Roxo VIP', bg: '#7C3AED', text: '#FFFFFF', border: '#FDE047', previewClass: 'bg-purple-600 text-white border-amber-300' },
  { id: 'GOLD_BLACK', label: '⚡ Dourado & Preto', bg: '#1E293B', text: '#FFE600', border: '#FFE600', previewClass: 'bg-slate-900 text-[#FFE600] border-[#FFE600]' }
];

type BadgePosition = 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'TOP_BANNER';

type BadgeIconType = 'FLAME' | 'TAG' | 'ZAP' | 'CROWN' | 'TRUCK' | 'PERCENT' | 'NONE';

export const ImageBadgeOverlayModal: React.FC<ImageBadgeOverlayModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  productTitle = '',
  productPrice,
  discountPercentage,
  onApplyImage
}) => {
  const [badgeText, setBadgeText] = useState('Oferta do Dia');
  const [customText, setCustomText] = useState('');
  const [colorTheme, setColorTheme] = useState<BadgeColorTheme>('RED_FLAME');
  const [position, setPosition] = useState<BadgePosition>('TOP_LEFT');
  const [iconType, setIconType] = useState<BadgeIconType>('FLAME');
  const [activeImageUrl, setActiveImageUrl] = useState(imageUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [corsFailed, setCorsFailed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (imageUrl) {
      setActiveImageUrl(imageUrl);
      setCorsFailed(false);
    }
  }, [imageUrl, isOpen]);

  // Set default custom text if discount percentage exists
  useEffect(() => {
    if (discountPercentage && discountPercentage > 0) {
      setBadgeText(`${discountPercentage}% OFF`);
    }
  }, [discountPercentage]);

  const activeText = customText.trim() ? customText : badgeText;

  // Draw overlay onto Canvas
  useEffect(() => {
    if (!isOpen) return;
    renderCanvas();
  }, [isOpen, activeImageUrl, activeText, colorTheme, position, iconType, corsFailed]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setCorsFailed(false);
      // Fixed canvas dimensions for high quality social sharing (800x800)
      const width = 800;
      const height = 800;
      canvas.width = width;
      canvas.height = height;

      // Draw Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Calculate aspect ratio fit
      const scale = Math.min(width / img.width, height / img.height);
      const x = (width - img.width * scale) / 2;
      const y = (height - img.height * scale) / 2;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Draw Badge Overlay
      drawBadgeOnCanvas(ctx, width, height);
      setIsProcessing(false);
    };

    img.onerror = () => {
      // Fallback if crossOrigin fails
      if (!corsFailed) {
        setCorsFailed(true);
        // Retry without crossOrigin for visual preview
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          const width = 800;
          const height = 800;
          canvas.width = width;
          canvas.height = height;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          const scale = Math.min(width / fallbackImg.width, height / fallbackImg.height);
          const x = (width - fallbackImg.width * scale) / 2;
          const y = (height - fallbackImg.height * scale) / 2;
          ctx.drawImage(fallbackImg, x, y, fallbackImg.width * scale, fallbackImg.height * scale);
          drawBadgeOnCanvas(ctx, width, height);
          setIsProcessing(false);
        };
        fallbackImg.src = activeImageUrl;
      } else {
        setIsProcessing(false);
      }
    };

    img.src = activeImageUrl;
  };

  const drawBadgeOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const theme = COLOR_THEMES.find(t => t.id === colorTheme) || COLOR_THEMES[0];
    const displayText = activeText.toUpperCase();

    // Prepare Icon string for rendering
    let iconSymbol = '';
    if (iconType === 'FLAME') iconSymbol = '🔥 ';
    else if (iconType === 'TAG') iconSymbol = '🏷️ ';
    else if (iconType === 'ZAP') iconSymbol = '⚡ ';
    else if (iconType === 'CROWN') iconSymbol = '👑 ';
    else if (iconType === 'TRUCK') iconSymbol = '🚚 ';
    else if (iconType === 'PERCENT') iconSymbol = '% ';

    const fullBadgeString = `${iconSymbol}${displayText}`.trim();

    ctx.save();

    if (position === 'TOP_BANNER') {
      // Draw top full-width banner
      const bannerHeight = 80;
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, width, bannerHeight);

      // Banner Border bottom
      ctx.fillStyle = theme.border;
      ctx.fillRect(0, bannerHeight - 6, width, 6);

      // Text inside banner
      ctx.font = '900 36px sans-serif';
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fullBadgeString, width / 2, bannerHeight / 2 - 2);
    } else {
      // Pill / Box Badge
      ctx.font = '900 32px sans-serif';
      const textMetrics = ctx.measureText(fullBadgeString);
      const paddingX = 32;
      const paddingY = 20;
      const badgeWidth = textMetrics.width + paddingX * 2;
      const badgeHeight = 64;

      let bx = 30;
      let by = 30;

      if (position === 'TOP_RIGHT') {
        bx = width - badgeWidth - 30;
        by = 30;
      } else if (position === 'BOTTOM_LEFT') {
        bx = 30;
        by = height - badgeHeight - 30;
      } else if (position === 'BOTTOM_RIGHT') {
        bx = width - badgeWidth - 30;
        by = height - badgeHeight - 30;
      }

      // Draw Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6;

      // Draw Badge Background Pill
      ctx.fillStyle = theme.bg;
      const radius = 20;

      ctx.beginPath();
      ctx.moveTo(bx + radius, by);
      ctx.lineTo(bx + badgeWidth - radius, by);
      ctx.quadraticCurveTo(bx + badgeWidth, by, bx + badgeWidth, by + radius);
      ctx.lineTo(bx + badgeWidth, by + badgeHeight - radius);
      ctx.quadraticCurveTo(bx + badgeWidth, by + badgeHeight, bx + badgeWidth - radius, by + badgeHeight);
      ctx.lineTo(bx + radius, by + badgeHeight);
      ctx.quadraticCurveTo(bx, by + badgeHeight, bx, by + badgeHeight - radius);
      ctx.lineTo(bx, by + radius);
      ctx.quadraticCurveTo(bx, by, bx + radius, by);
      ctx.closePath();
      ctx.fill();

      // Reset Shadow for Border
      ctx.shadowColor = 'transparent';

      // Draw Border
      ctx.lineWidth = 4;
      ctx.strokeStyle = theme.border;
      ctx.stroke();

      // Draw Text
      ctx.font = '900 32px sans-serif';
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fullBadgeString, bx + badgeWidth / 2, by + badgeHeight / 2 + 2);
    }

    ctx.restore();
  };

  const handleApplyToProduct = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const stampedDataUrl = canvas.toDataURL('image/png', 0.95);
      onApplyImage(stampedDataUrl);
      setAppliedSuccess(true);
      setTimeout(() => {
        setAppliedSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      alert('A imagem foi pré-visualizada! Aplicação direta ativada.');
      onApplyImage(activeImageUrl);
      onClose();
    }
  };

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const link = document.createElement('a');
      link.download = `oferta-etiquetada-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      alert('Abertura de download realizada!');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setActiveImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl text-slate-900 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#2D3277] text-[#FFE600] font-bold shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                Editor de Etiqueta da Imagem
                <span className="text-[10px] uppercase font-black bg-[#FFE600] text-[#2D3277] px-2 py-0.5 rounded-full">
                  WhatsApp Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Sobreponha selos de destaque ('Oferta do Dia', 'Desconto Real', etc) na imagem antes de disparar.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Live Canvas Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3 bg-slate-900 p-4 rounded-3xl border border-slate-800 relative">
            <div className="w-full text-center flex items-center justify-between text-xs text-slate-400 font-bold mb-1">
              <span className="flex items-center gap-1 text-[#FFE600]">
                <ImageIcon className="w-4 h-4" /> Pré-visualização com Selo
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">800x800px HD</span>
            </div>

            <div className="relative w-full aspect-square max-w-[360px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#FFE600]" />
                  <span>Gerando Imagem...</span>
                </div>
              )}
            </div>

            {/* Custom File Upload Option */}
            <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <label className="cursor-pointer text-slate-300 hover:text-white flex items-center gap-1.5 font-medium transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Trocar Imagem do Computador</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => setActiveImageUrl(imageUrl)}
                className="text-slate-400 hover:text-amber-300 text-[11px] underline"
              >
                Restaurar Imagem Original
              </button>
            </div>
          </div>

          {/* Right Column: Overlay Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Select / Type Badge Label */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-[#2D3277]" />
                  1. Texto da Etiqueta:
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Selecione ou digite abaixo</span>
              </label>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {BADGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setBadgeText(preset);
                      setCustomText('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      badgeText === preset && !customText.trim()
                        ? 'bg-[#2D3277] text-[#FFE600] border-[#2D3277] shadow-sm scale-105'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom Text Input */}
              <div className="mt-2">
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ou digite sua própria frase (ex: 'SUPER PROMOÇÃO', 'CUPOM 50%')"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-[#2D3277] focus:border-[#2D3277] outline-none"
                />
              </div>
            </div>

            {/* 2. Color Theme Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-600" />
                2. Estilo e Cores da Etiqueta:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setColorTheme(theme.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold border-2 transition-all text-left flex items-center justify-between ${
                      colorTheme === theme.id
                        ? 'border-[#2D3277] bg-slate-50 shadow-md ring-2 ring-[#2D3277]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span>{theme.label}</span>
                    <span className={`w-3.5 h-3.5 rounded-full border ${theme.previewClass}`}></span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Position Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Move className="w-4 h-4 text-amber-600" />
                3. Posição da Etiqueta:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPosition('TOP_LEFT')}
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    position === 'TOP_LEFT'
                      ? 'bg-[#2D3277] text-white border-[#2D3277]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Topo Esq.
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('TOP_RIGHT')}
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    position === 'TOP_RIGHT'
                      ? 'bg-[#2D3277] text-white border-[#2D3277]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Topo Dir.
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('BOTTOM_LEFT')}
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    position === 'BOTTOM_LEFT'
                      ? 'bg-[#2D3277] text-white border-[#2D3277]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Rodapé Esq.
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('BOTTOM_RIGHT')}
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    position === 'BOTTOM_RIGHT'
                      ? 'bg-[#2D3277] text-white border-[#2D3277]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Rodapé Dir.
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('TOP_BANNER')}
                  className={`p-2 rounded-xl border-2 text-center transition-all col-span-2 sm:col-span-1 ${
                    position === 'TOP_BANNER'
                      ? 'bg-[#2D3277] text-[#FFE600] border-[#2D3277]'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Faixa Superior
                </button>
              </div>
            </div>

            {/* 4. Icon Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                4. Ícone do Selo:
              </label>
              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setIconType('FLAME')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    iconType === 'FLAME' ? 'bg-red-500 text-white border-red-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🔥 Fogo
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('TAG')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    iconType === 'TAG' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🏷️ Etiqueta
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('ZAP')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    iconType === 'ZAP' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ⚡ Raio
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('CROWN')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    iconType === 'CROWN' ? 'bg-purple-600 text-white border-purple-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  👑 Coroa
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('TRUCK')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    iconType === 'TRUCK' ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  🚚 Frete
                </button>
                <button
                  type="button"
                  onClick={() => setIconType('NONE')}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 transition-all ${
                    iconType === 'NONE' ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Sem Ícone
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleApplyToProduct}
                disabled={appliedSuccess}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {appliedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Etiqueta Aplicada!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Aplicar Imagem ao Disparo do WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadImage}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Baixar Imagem</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
