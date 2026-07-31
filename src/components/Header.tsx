import React from 'react';
import { ShoppingBag, Send, Cpu, Settings, ShieldCheck, Zap, Plus, RefreshCw, Users, Crown, Bell, HelpCircle, LogOut, User, Sun, Moon } from 'lucide-react';
import { AffiliateConfig, AutoSchedulerConfig, Subscriber } from '../types';
import { AppLogo } from './AppLogo';

interface HeaderProps {
  activeTab: 'dashboard' | 'products' | 'channels' | 'templates' | 'logs' | 'subscribers';
  setActiveTab: (tab: 'dashboard' | 'products' | 'channels' | 'templates' | 'logs' | 'subscribers') => void;
  affiliateConfig?: AffiliateConfig;
  schedulerConfig?: AutoSchedulerConfig;
  onOpenConverter: () => void;
  onOpenSettings: () => void;
  onOpenScheduler: () => void;
  onOpenMLMonitor: () => void;
  onManualTriggerScheduler: () => void;
  isTriggering: boolean;
  userRole: 'ADMIN' | 'SUBSCRIBER';
  isAdminAccount?: boolean;
  onToggleUserRole: () => void;
  onOpenPlanManager: () => void;
  unreadNotificationsCount?: number;
  onOpenGuide: () => void;
  currentUser?: { name: string; email: string; role: 'ADMIN' | 'SUBSCRIBER'; subscriber?: Subscriber };
  onOpenLoginModal: () => void;
  onLogout?: () => void;
  onOpenPriceAlerts?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  affiliateConfig,
  schedulerConfig,
  onOpenConverter,
  onOpenSettings,
  onOpenScheduler,
  onOpenMLMonitor,
  onManualTriggerScheduler,
  isTriggering,
  userRole,
  isAdminAccount,
  onToggleUserRole,
  onOpenPlanManager,
  unreadNotificationsCount = 0,
  onOpenGuide,
  currentUser,
  onOpenLoginModal,
  onLogout,
  onOpenPriceAlerts,
  isDarkMode = false,
  onToggleDarkMode
}) => {
  const isRealAdmin = Boolean(
    isAdminAccount ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.email?.toLowerCase() === 'gregoriojr2003@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'admin@importhourando.com.br' ||
    currentUser?.email?.toLowerCase() === 'admin'
  );

  return (
    <header className="bg-[#2D3277] border-b border-[#3D438F] text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Bar with Flex Wrap and Padding to prevent whitespace leaks */}
        <div className="flex flex-wrap items-center justify-between py-3 gap-3 border-b border-[#3D438F]/80">
          <div className="flex items-center space-x-3 shrink-0">
            <AppLogo size={46} className="w-11 h-11 drop-shadow-md cursor-pointer hover:scale-105 transition-transform shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-xl text-white tracking-wider font-mono">IMPORTHOURANDO</h1>
                <span className="bg-[#FFE600] text-[#2D3277] text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase shadow-sm">
                  Multi-Marketplace 24h
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium flex items-center space-x-1.5 flex-wrap">
                <span>Automação de Ofertas WhatsApp</span>
                <span className="text-white/40">•</span>
                <span className="bg-white/10 text-white/90 font-mono text-[9px] px-1.5 py-0.2 rounded border border-white/20">
                  📱 Android | 🍎 iOS | 🪟 Windows | 🐧 Linux
                </span>
              </p>
            </div>
          </div>

          {/* Status Indicators & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
            {/* Primeiro Acesso / Guia Button */}
            <button
              onClick={onOpenGuide}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FFE600] text-[#2D3277] hover:bg-amber-300 text-xs font-black shadow-sm transition-all border border-amber-300 hover:scale-105"
              title="Abrir Guia e Menu Explicativo de Primeiro Acesso ao IMPORTHOURANDO"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Primeiro Acesso</span>
            </button>

            {/* Mercado Livre Monitor Button */}
            <button
              onClick={onOpenMLMonitor}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-xs font-bold text-white transition-all"
              title="Monitor de Ofertas do Mercado Livre - Disparar para Canal do WhatsApp"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#FFE600]" />
              <span className="hidden sm:inline">Monitor ML:</span>
              <strong className="text-emerald-400 font-mono">ON</strong>
            </button>

            {/* Price Alerts Button */}
            {onOpenPriceAlerts && (
              <button
                onClick={onOpenPriceAlerts}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/30 to-red-500/30 border border-amber-400/50 hover:from-amber-500/40 hover:to-red-500/40 text-xs font-extrabold text-white transition-all shadow-sm"
                title="Alertas de Preço Mínimo por Palavras-Chave"
              >
                <Bell className="w-3.5 h-3.5 text-[#FFE600] animate-bounce" />
                <span className="hidden sm:inline">Alertas de Preço</span>
              </button>
            )}

            {/* Auto Scheduler Status */}
            <button
              onClick={onOpenScheduler}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                schedulerConfig?.enabled
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                  : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/15'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${schedulerConfig?.enabled ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Robô:</span>
              <strong>{schedulerConfig?.enabled ? `${schedulerConfig?.intervalMinutes || 30}m ON` : 'OFF'}</strong>
            </button>

            {/* Manual Run Trigger */}
            {schedulerConfig?.enabled && (
              <button
                onClick={onManualTriggerScheduler}
                disabled={isTriggering}
                className="p-1.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-50"
                title="Disparar Robô Agora"
              >
                <RefreshCw className={`w-4 h-4 ${isTriggering ? 'animate-spin text-[#FFE600]' : ''}`} />
              </button>
            )}

            {/* Convert Link Button - Mercado Livre Blue */}
            <button
              onClick={onOpenConverter}
              className="flex items-center space-x-1.5 bg-[#3483FA] hover:bg-blue-600 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Converter Link / Oferta</span>
              <span className="sm:hidden">Nova Oferta</span>
            </button>

            {/* User Plan Manager Button (For Subscribers) */}
            {userRole === 'SUBSCRIBER' && (
              <button
                onClick={onOpenPlanManager}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 text-xs font-bold transition-all"
                title="Gerenciar Minha Assinatura / Trocar de Plano"
              >
                <Zap className="w-3.5 h-3.5 text-purple-300" />
                <span>Minha Assinatura</span>
              </button>
            )}

            {/* Role Switcher Badge (EXCLUSIVO PARA O ADMINISTRADOR - BOTÃO INTERCAMBIÁVEL) */}
            {isRealAdmin && (
              <button
                onClick={onToggleUserRole}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all shadow-sm active:scale-95 ${
                  userRole === 'ADMIN'
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 hover:bg-amber-500/30'
                    : 'bg-indigo-500/30 border-indigo-400/60 text-indigo-100 hover:bg-indigo-500/40'
                }`}
                title={
                  userRole === 'ADMIN'
                    ? 'Clique para ver a plataforma como um Cliente/Usuário comum'
                    : 'Clique para voltar ao Painel do Administrador'
                }
              >
                {userRole === 'ADMIN' ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Painel:</span>
                    <span className="text-[#FFE600] font-black">👑 MODO ADM</span>
                    <span className="text-[9px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.5 rounded ml-0.5">
                      (Alternar p/ Cliente)
                    </span>
                  </>
                ) : (
                  <>
                    <User className="w-3.5 h-3.5 text-indigo-300" />
                    <span className="hidden md:inline">Painel:</span>
                    <span className="text-white font-black">👤 VISÃO CLIENTE</span>
                    <span className="text-[9px] bg-[#FFE600] text-[#2D3277] font-black px-1.5 py-0.5 rounded ml-0.5 animate-pulse">
                      (Voltar ao ADM)
                    </span>
                  </>
                )}
              </button>
            )}

            {/* User Login / Account Chip & Theme Toggle */}
            <div className="flex items-center space-x-2 pl-1 border-l border-white/20">
              {/* Dark Mode Selector Toggle Button */}
              {onToggleDarkMode && (
                <button
                  type="button"
                  onClick={onToggleDarkMode}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-xs"
                  title={isDarkMode ? 'Alternar para Modo Claro (Light Mode)' : 'Alternar para Modo Escuro Noturno (Dark Mode)'}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-300 fill-amber-300/30 shrink-0" />
                      <span className="hidden lg:inline text-amber-200">Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-200 fill-indigo-200/30 shrink-0" />
                      <span className="hidden lg:inline text-indigo-100">Modo Escuro</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onLogout || onOpenLoginModal}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all group"
                title="Sair / Encerrar Sessão"
              >
                <User className="w-3.5 h-3.5 text-[#FFE600]" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">
                  {currentUser?.name || (userRole === 'ADMIN' ? 'Administrador' : 'Cliente')}
                </span>
                <span className="bg-red-500/80 group-hover:bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center space-x-0.5 ml-1">
                  <LogOut className="w-3 h-3" />
                  <span>Sair</span>
                </span>
              </button>

              {/* Settings button */}
              <button
                onClick={onOpenSettings}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Configurações do Robô"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-[#2D3277] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Painel & Automação</span>
          </button>

          <button
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'subscribers'
                ? 'bg-[#FFE600] text-[#2D3277] shadow-sm font-extrabold'
                : 'text-amber-300 hover:text-amber-200 hover:bg-white/10'
            }`}
          >
            {userRole === 'ADMIN' ? (
              <>
                <Users className="w-4 h-4" />
                <span>Assinantes & Licenças (Painel ADM)</span>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Minha Assinatura & Upgrade</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'products'
                ? 'bg-white text-[#2D3277] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Radar de Ofertas ML</span>
          </button>

          <button
            onClick={() => setActiveTab('channels')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'channels'
                ? 'bg-white text-[#2D3277] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Canais do WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-[#2D3277] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Formatador de Copy IA</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-[#2D3277] shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Histórico de Disparos</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

