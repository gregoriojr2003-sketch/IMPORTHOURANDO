import React, { useState } from 'react';
import { 
  BookOpen, CheckCircle2, ArrowRight, ArrowLeft, ShieldCheck, 
  Settings, Send, Cpu, ShoppingBag, Sparkles, Zap, Crown, Play, X,
  HelpCircle, MessageSquare, ExternalLink, ShieldAlert
} from 'lucide-react';

interface FirstAccessGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'dashboard' | 'products' | 'channels' | 'templates' | 'logs' | 'subscribers') => void;
  onOpenSettings: () => void;
  onOpenScheduler: () => void;
}

export const FirstAccessGuideModal: React.FC<FirstAccessGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenSettings,
  onOpenScheduler
}) => {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Boas-vindas ao IMPORTHOURANDO 🚀",
      subtitle: "A plataforma completa para automação de ofertas e comissões no WhatsApp 24/7",
      badge: "Passo 1 de 5 • Visão Geral",
      icon: <Sparkles className="w-8 h-8 text-[#FFE600]" />,
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p className="leading-relaxed">
            O <strong>IMPORTHOURANDO</strong> é o seu assistente de automação que varre os melhores marketplaces (Mercado Livre, Shopee, Amazon, Magalu) e dispara ofertas com <strong>sua tag de afiliado</strong> para seus grupos e canais no WhatsApp.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-950 font-bold block">100% Automático</strong>
                O robô roda sozinho 24 horas por dia postando promoções com seus links.
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 font-bold block">Comissão Garantida</strong>
                Todos os links convertidos contêm sua Tag de Afiliado para assegurar sua receita.
              </div>
            </div>
          </div>
        </div>
      ),
      actionButton: null
    },
    {
      title: "1. Configure Suas Tags de Afiliado 🏷️",
      subtitle: "Insira suas IDs de afiliado para receber as comissões direto nas plataformas",
      badge: "Passo 2 de 5 • Configuração",
      icon: <Settings className="w-8 h-8 text-blue-500" />,
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p className="leading-relaxed">
            Antes de realizar qualquer disparo, é essencial configurar sua <strong>Tag de Afiliado Mercado Livre</strong> (e outras plataformas). Toda oferta enviada passará por conversão automática.
          </p>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Como Funciona a Conversão:
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              O robô pega o link original do produto do Mercado Livre/Shopee, extrai o ID e gera um novo link contendo sua Tag (Ex: <span className="font-mono text-blue-600">?pdp_filters=category...&tag=SUA_TAG</span>).
            </p>
          </div>
        </div>
      ),
      actionButton: (
        <button
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2 transition-all"
        >
          <Settings className="w-4 h-4" /> Configurar Tag Agora
        </button>
      )
    },
    {
      title: "2. Conecte Seus Grupos de WhatsApp 📱",
      subtitle: "Cadastre os canais e comunidades onde o robô irá postar as promoções",
      badge: "Passo 3 de 5 • Canais",
      icon: <Send className="w-8 h-8 text-emerald-500" />,
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p className="leading-relaxed">
            Na aba <strong>"Canais WhatsApp"</strong>, você cadastra o ID ou Link do seu grupo, canal ou comunidade. É possível definir intervalos de disparo por canal e acompanhar o status de conexão.
          </p>

          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
            <strong className="text-emerald-950 font-bold block text-xs">💡 Dica de Ouro:</strong>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Mantenha pelo menos 2 a 3 grupos cadastrados para diversificar seus disparos e aumentar suas vendas.
            </p>
          </div>
        </div>
      ),
      actionButton: (
        <button
          onClick={() => {
            onClose();
            onNavigateTab('channels');
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2 transition-all"
        >
          <Send className="w-4 h-4" /> Ir para Canais WhatsApp
        </button>
      )
    },
    {
      title: "3. Ative o Robô Agendador Automático 🤖",
      subtitle: "Programe as ofertas para serem enviadas em intervalos pré-definidos",
      badge: "Passo 4 de 5 • Automação",
      icon: <Cpu className="w-8 h-8 text-amber-500" />,
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p className="leading-relaxed">
            O <strong>Robô Agendador</strong> permite definir de quantos em quantos minutos (Ex: a cada 15 min) uma nova oferta do Caçador de Ofertas será selecionada, formatada com copy e enviada ao WhatsApp.
          </p>

          <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl space-y-1">
            <strong className="text-amber-950 font-bold block text-xs">🚀 Disparo Manual x Automático:</strong>
            <p className="text-xs text-amber-800 leading-relaxed">
              Você pode clicar em <strong>"Disparar Agora"</strong> para enviar uma oferta instantaneamente ou deixar a chave do Agendador Ativada.
            </p>
          </div>
        </div>
      ),
      actionButton: (
        <button
          onClick={() => {
            onClose();
            onOpenScheduler();
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2 transition-all"
        >
          <Cpu className="w-4 h-4" /> Configurar Agendador
        </button>
      )
    },
    {
      title: "4. Gestão do Seu Plano e Licença 👑",
      subtitle: "Sem cobranças no seu cartão e sem contratos de fidelidade compulsória",
      badge: "Passo 5 de 5 • Licença",
      icon: <Crown className="w-8 h-8 text-purple-500" />,
      content: (
        <div className="space-y-4 text-slate-600 text-sm">
          <p className="leading-relaxed">
            No IMPORTHOURANDO, priorizamos a sua segurança financeira:
          </p>

          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Sem Cartão Salvo:</strong> Não armazenamos dados de pagamento e não debitamos valores sem sua autorização.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Sem Multas ou Juros:</strong> Se você expirar, o serviço é suspenso temporariamente e você renova quando desejar via PIX.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Opção Vitalícia:</strong> Caso prefira isenção perpétua de renovações, o Plano Vitalício encerra qualquer mensalidade para sempre.</span>
            </li>
          </ul>
        </div>
      ),
      actionButton: (
        <button
          onClick={() => {
            onClose();
            onNavigateTab('subscribers');
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2 transition-all"
        >
          <Crown className="w-4 h-4" /> Ver Minha Assinatura
        </button>
      )
    }
  ];

  const currentStepData = steps[activeStep];

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2D3277] to-[#1E2355] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-inner">
              {currentStepData.icon}
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#FFE600] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                {currentStepData.badge}
              </span>
              <h3 className="text-xl font-black mt-1 text-white">
                {currentStepData.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === activeStep 
                    ? 'w-8 bg-[#2D3277]' 
                    : idx < activeStep 
                    ? 'w-2.5 bg-emerald-500' 
                    : 'w-2.5 bg-slate-300'
                }`}
                title={`Ir para passo ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-xs font-bold text-slate-500">
            {activeStep + 1} de {steps.length}
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
          <h4 className="text-base font-bold text-slate-900 border-b pb-2">
            {currentStepData.subtitle}
          </h4>

          {currentStepData.content}

          {currentStepData.actionButton && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Atalho rápido:</span>
              {currentStepData.actionButton}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeStep === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
              className="px-6 py-2.5 rounded-xl bg-[#2D3277] hover:bg-[#202456] text-white font-bold text-xs shadow flex items-center gap-2 transition-all"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Entendi! Começar a Usar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
