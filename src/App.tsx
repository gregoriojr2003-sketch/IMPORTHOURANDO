import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ProductOfferHunter } from './components/ProductOfferHunter';
import { WhatsAppChannelsManager } from './components/WhatsAppChannelsManager';
import { CopyTemplatesManager } from './components/CopyTemplatesManager';
import { DispatchHistory } from './components/DispatchHistory';
import { AdminSubscribersPanel } from './components/AdminSubscribersPanel';
import { ClientSubscriptionView } from './components/ClientSubscriptionView';
import { UserPlanManagerModal } from './components/UserPlanManagerModal';
import { FirstAccessGuideModal } from './components/FirstAccessGuideModal';

import { LinkConverterModal } from './components/LinkConverterModal';
import { AutoSchedulerModal } from './components/AutoSchedulerModal';
import { SettingsModal } from './components/SettingsModal';
import { MLOfferMonitorModal, MLMonitorConfig } from './components/MLOfferMonitorModal';
import { LoginModal } from './components/LoginModal';
import { LoginScreen } from './components/LoginScreen';
import { PriceAlertsModal } from './components/PriceAlertsModal';
import { SubscriptionPaywallModal } from './components/SubscriptionPaywallModal';

import { MercadoLivreProduct, WhatsAppChannel, OfferPostTemplate, DispatchedOffer, AutoSchedulerConfig, AffiliateConfig, Subscriber, AdminNotification, PriceAlertRule } from './types';
import { INITIAL_PRODUCTS, INITIAL_CHANNELS, INITIAL_TEMPLATES, INITIAL_DISPATCHED_LOGS, INITIAL_SCHEDULER_CONFIG, INITIAL_AFFILIATE_CONFIG, INITIAL_SUBSCRIBERS, INITIAL_ADMIN_NOTIFICATIONS, INITIAL_PRICE_ALERTS } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'channels' | 'templates' | 'logs' | 'subscribers'>('dashboard');

  // Application State
  const [products, setProducts] = useState<MercadoLivreProduct[]>(INITIAL_PRODUCTS);
  const [channels, setChannels] = useState<WhatsAppChannel[]>(INITIAL_CHANNELS);
  const [templates, setTemplates] = useState<OfferPostTemplate[]>(INITIAL_TEMPLATES);
  const [dispatchedLogs, setDispatchedLogs] = useState<DispatchedOffer[]>(INITIAL_DISPATCHED_LOGS);
  const [schedulerConfig, setSchedulerConfig] = useState<AutoSchedulerConfig>(INITIAL_SCHEDULER_CONFIG);
  const [affiliateConfig, setAffiliateConfig] = useState<AffiliateConfig>(INITIAL_AFFILIATE_CONFIG);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>(INITIAL_SUBSCRIBERS);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(INITIAL_ADMIN_NOTIFICATIONS);

  // Mandatory Initial Screen Authentication Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('importhourando_auth') === 'true' || sessionStorage.getItem('importhourando_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: 'ADMIN' | 'SUBSCRIBER';
    subscriber?: Subscriber;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('importhourando_user') || sessionStorage.getItem('importhourando_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [userRole, setUserRole] = useState<'ADMIN' | 'SUBSCRIBER'>(() => {
    return currentUser?.role || 'ADMIN';
  });

  const [currentSubscriber, setCurrentSubscriber] = useState<Subscriber>(() => {
    return currentUser?.subscriber || INITIAL_SUBSCRIBERS[0];
  });

  // Modals state
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertRule[]>(INITIAL_PRICE_ALERTS);
  const [isPriceAlertsOpen, setIsPriceAlertsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [isMLMonitorOpen, setIsMLMonitorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlanManagerOpen, setIsPlanManagerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedProductForDispatch, setSelectedProductForDispatch] = useState<MercadoLivreProduct | null>(null);

  // Tour Mode Paywall Gate State
  const [isSubscriptionPaywallOpen, setIsSubscriptionPaywallOpen] = useState(false);
  const [paywallActionName, setPaywallActionName] = useState('colocar o robô para funcionar');

  // Dark Mode State with localStorage & document element class toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('importhourando_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('importhourando_dark_mode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('importhourando_dark_mode', 'false');
      }
    } catch (e) {
      // ignore
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // 30-Minute Trial Timer State
  const [trialSecondsLeft, setTrialSecondsLeft] = useState<number | undefined>(() => {
    if (currentSubscriber?.status === 'DEGUSTACAO') {
      const exp = currentSubscriber.expiresAt ? new Date(currentSubscriber.expiresAt).getTime() : Date.now() + 30 * 60 * 1000;
      return Math.max(0, Math.floor((exp - Date.now()) / 1000));
    }
    return undefined;
  });

  useEffect(() => {
    if (currentSubscriber?.status !== 'DEGUSTACAO') {
      setTrialSecondsLeft(undefined);
      return;
    }

    const timer = setInterval(() => {
      const exp = currentSubscriber.expiresAt ? new Date(currentSubscriber.expiresAt).getTime() : Date.now() + 30 * 60 * 1000;
      const left = Math.max(0, Math.floor((exp - Date.now()) / 1000));
      setTrialSecondsLeft(left);

      if (left <= 0) {
        setCurrentSubscriber(prev => ({ ...prev, status: 'EXPIRADO' }));
        setPaywallActionName('Sua degustação grátis de 30 minutos expirou! Escolha um dos nossos planos para continuar disparando ofertas com o robô.');
        setIsSubscriptionPaywallOpen(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSubscriber?.status, currentSubscriber?.expiresAt]);

  const ensureActiveSubscription = (actionName = 'colocar o robô para funcionar'): boolean => {
    if (userRole === 'ADMIN') return true;
    if (currentSubscriber && currentSubscriber.status === 'ATIVO') return true;
    if (currentSubscriber && currentSubscriber.status === 'DEGUSTACAO' && (trialSecondsLeft === undefined || trialSecondsLeft > 0)) return true;

    setPaywallActionName(actionName);
    setIsSubscriptionPaywallOpen(true);
    return false;
  };

  const handleGoToPlansFromPaywall = () => {
    setIsSubscriptionPaywallOpen(false);
    setIsConverterOpen(false);
    setIsSchedulerOpen(false);
    setIsMLMonitorOpen(false);
    setIsSettingsOpen(false);
    setIsPriceAlertsOpen(false);
    setActiveTab('subscribers');
  };

  const [isTriggeringScheduler, setIsTriggeringScheduler] = useState(false);
  const [isTriggeringMLMonitor, setIsTriggeringMLMonitor] = useState(false);

  const [mlMonitorConfig, setMlMonitorConfig] = useState<MLMonitorConfig>({
    enabled: true,
    affiliateTag: affiliateConfig.affiliateTag || 'ofertastop_app',
    targetChannelId: channels[0]?.id || 'chan-01',
    minDiscount: 20,
    checkIntervalSeconds: 15,
    totalNewOffersIdentified: 12
  });

  // Sync state with server API
  const fetchAllData = async () => {
    try {
      const [resConfig, resProds, resChans, resTmpls, resLogs, resSubs, resMlMon] = await Promise.all([
        fetch('/api/config').then(r => r.json()).catch(() => null),
        fetch('/api/products').then(r => r.json()).catch(() => null),
        fetch('/api/whatsapp/channels').then(r => r.json()).catch(() => null),
        fetch('/api/templates').then(r => r.json()).catch(() => null),
        fetch('/api/dispatches').then(r => r.json()).catch(() => null),
        fetch('/api/admin/subscribers').then(r => r.json()).catch(() => null),
        fetch('/api/ml/monitor').then(r => r.json()).catch(() => null)
      ]);

      if (resConfig?.affiliateConfig) setAffiliateConfig(resConfig.affiliateConfig);
      if (resConfig?.schedulerConfig) setSchedulerConfig(resConfig.schedulerConfig);
      if (resMlMon?.config) setMlMonitorConfig(resMlMon.config);
      if (resProds?.products) setProducts(resProds.products);
      if (resChans?.channels) setChannels(resChans.channels);
      if (resTmpls?.templates) setTemplates(resTmpls.templates);
      if (resLogs?.logs) setDispatchedLogs(resLogs.logs);
      if (resSubs?.subscribers) {
        setSubscribers(resSubs.subscribers);
        if (resSubs.notifications) setAdminNotifications(resSubs.notifications);
        const savedUserStr = localStorage.getItem('importhourando_user') || sessionStorage.getItem('importhourando_user');
        const activeEmail = currentUser?.email || (savedUserStr ? JSON.parse(savedUserStr)?.email : null);
        if (activeEmail) {
          const matched = resSubs.subscribers.find((s: Subscriber) => s.email.toLowerCase() === activeEmail.toLowerCase());
          if (matched) {
            setCurrentSubscriber(matched);
          }
        }
      }
    } catch (e) {
      console.log('Using default mock state');
    }
  };

  useEffect(() => {
    fetchAllData();

    // Auto-polling every 4 seconds to sync live background offer dispatches and admin notifications
    const interval = setInterval(() => {
      Promise.all([
        fetch('/api/dispatches').then(r => r.json()).catch(() => null),
        fetch('/api/admin/subscribers').then(r => r.json()).catch(() => null)
      ]).then(([dataLogs, dataSubs]) => {
        if (dataLogs?.logs) setDispatchedLogs(dataLogs.logs);
        if (dataSubs?.subscribers) setSubscribers(dataSubs.subscribers);
        if (dataSubs?.notifications) setAdminNotifications(dataSubs.notifications);
      }).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/admin/notifications/mark-read', { method: 'POST' });
      setAdminNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers
  const handleOpenConverterWithProduct = (product?: MercadoLivreProduct) => {
    setSelectedProductForDispatch(product || null);
    setIsConverterOpen(true);
  };

  const handleSaveConfig = async (updatedAffiliate?: Partial<AffiliateConfig>, updatedScheduler?: Partial<AutoSchedulerConfig>) => {
    if (!ensureActiveSubscription('salvar e alterar configurações de automação')) return;
    try {
      const payload: any = {};
      if (updatedAffiliate) payload.affiliateConfig = updatedAffiliate;
      if (updatedScheduler) payload.schedulerConfig = updatedScheduler;

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.affiliateConfig) setAffiliateConfig(data.affiliateConfig);
      if (data.schedulerConfig) setSchedulerConfig(data.schedulerConfig);
    } catch (e) {
      if (updatedAffiliate) setAffiliateConfig({ ...affiliateConfig, ...updatedAffiliate });
      if (updatedScheduler) setSchedulerConfig({ ...schedulerConfig, ...updatedScheduler });
    }
  };

  const handleManualTriggerScheduler = async () => {
    if (!ensureActiveSubscription('disparar o robô agendador manualmente')) return;
    setIsTriggeringScheduler(true);
    try {
      const res = await fetch('/api/scheduler/trigger', { method: 'POST' });
      const data = await res.json();
      await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggeringScheduler(false);
    }
  };

  const handleSaveMLMonitorConfig = async (updated: Partial<MLMonitorConfig>) => {
    if (!ensureActiveSubscription('salvar o monitor do Mercado Livre')) return;
    try {
      const res = await fetch('/api/ml/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.config) setMlMonitorConfig(data.config);
    } catch (e) {
      setMlMonitorConfig(prev => ({ ...prev, ...updated }));
    }
  };

  const handleClearDispatchedLogs = async (mode: 'all' | 'older_than_7_days' = 'all') => {
    if (!ensureActiveSubscription('limpar o histórico de disparos')) return;
    try {
      const res = await fetch('/api/dispatches/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      });
      const data = await res.json();
      if (data.logs) {
        setDispatchedLogs(data.logs);
      } else {
        setDispatchedLogs([]);
      }
    } catch (e) {
      setDispatchedLogs([]);
    }
  };

  const handleTriggerMLMonitorNow = async () => {
    if (!ensureActiveSubscription('executar a varredura do monitor de ofertas')) return;
    setIsTriggeringMLMonitor(true);
    try {
      const res = await fetch('/api/ml/monitor/trigger', { method: 'POST' });
      const data = await res.json();
      await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsTriggeringMLMonitor(false);
    }
  };

  const handleAddPriceAlert = (newAlert: Omit<PriceAlertRule, 'id' | 'createdAt'>) => {
    if (!ensureActiveSubscription('criar alertas de monitoramento de preço')) return;
    const alertRule: PriceAlertRule = {
      ...newAlert,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPriceAlerts(prev => [alertRule, ...prev]);
  };

  const handleTogglePriceAlert = (id: string) => {
    if (!ensureActiveSubscription('ativar ou pausar alertas de preço')) return;
    setPriceAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const handleDeletePriceAlert = (id: string) => {
    setPriceAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAddChannel = async (channel: Partial<WhatsAppChannel>) => {
    if (!ensureActiveSubscription('adicionar novos canais ou grupos do WhatsApp')) return;
    try {
      const res = await fetch('/api/whatsapp/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channel)
      });
      const data = await res.json();
      if (data.channel) {
        setChannels([...channels, data.channel]);
      }
    } catch (e) {
      const fallback: WhatsAppChannel = {
        id: `chan-${Date.now()}`,
        name: channel.name || 'Novo Canal',
        type: channel.type || 'CHANNEL',
        phoneNumberOrJid: channel.phoneNumberOrJid || '120363@newsletter',
        membersCount: 1500,
        status: 'CONNECTED',
        autoPost: true
      };
      setChannels([...channels, fallback]);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await fetch(`/api/whatsapp/channels/${channelId}`, { method: 'DELETE' });
      setChannels(channels.filter(c => c.id !== channelId));
    } catch (e) {
      setChannels(channels.filter(c => c.id !== channelId));
    }
  };

  const handleAddTemplate = async (template: Partial<OfferPostTemplate>) => {
    if (!ensureActiveSubscription('salvar modelos de mensagens')) return;
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });
      const data = await res.json();
      if (data.template) {
        setTemplates([...templates, data.template]);
      }
    } catch (e) {
      const fallback: OfferPostTemplate = {
        id: `temp-${Date.now()}`,
        name: template.name || 'Novo Modelo',
        tone: template.tone || 'URGENT',
        headerText: template.headerText || '🚨 OFERTA RELÂMPAGO!',
        sendImage: template.sendImage ?? true,
        includeRating: true,
        includeInstallments: true,
        includeShipping: true,
        includeCoupons: true,
        callToActionText: template.callToActionText || '👉 COMPRE AQUI:',
        hashtagTags: ['MercadoLivre']
      };
      setTemplates([...templates, fallback]);
    }
  };

  const handleLoginSuccess = (user: { name: string; email: string; role: 'ADMIN' | 'SUBSCRIBER'; subscriber?: Subscriber }) => {
    const isAdm = user.role === 'ADMIN' ||
                  user.email.toLowerCase() === 'gregoriojr2003@gmail.com' ||
                  user.email.toLowerCase() === 'admin@importhourando.com.br' ||
                  user.email.toLowerCase() === 'admin';

    const userObj = {
      ...user,
      role: (isAdm ? 'ADMIN' : 'SUBSCRIBER') as 'ADMIN' | 'SUBSCRIBER',
      actualRole: (isAdm ? 'ADMIN' : 'SUBSCRIBER') as 'ADMIN' | 'SUBSCRIBER'
    };

    setUserRole(isAdm ? 'ADMIN' : 'SUBSCRIBER');
    setCurrentUser(userObj);
    if (user.subscriber) {
      setCurrentSubscriber(user.subscriber);
    }
    if (isAdm) {
      setActiveTab('subscribers');
    }
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);

    try {
      sessionStorage.setItem('importhourando_auth', 'true');
      sessionStorage.setItem('importhourando_user', JSON.stringify(userObj));
    } catch (e) {
      console.error('Session error', e);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('importhourando_auth');
      sessionStorage.removeItem('importhourando_user');
    } catch (e) {
      console.error('Session clear error', e);
    }
  };

  const unreadCount = adminNotifications.filter(n => !n.read).length;

  const isAdminAccount = Boolean(
    currentUser?.actualRole === 'ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.email?.toLowerCase() === 'gregoriojr2003@gmail.com' ||
    currentUser?.email?.toLowerCase() === 'admin@importhourando.com.br' ||
    currentUser?.email?.toLowerCase() === 'admin'
  );

  // Mandatory Initial Login View
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginScreen
        subscribers={subscribers}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-[#FFE600] selection:text-[#2D3277]">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        affiliateConfig={affiliateConfig}
        schedulerConfig={schedulerConfig}
        onOpenConverter={() => handleOpenConverterWithProduct()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScheduler={() => setIsSchedulerOpen(true)}
        onOpenMLMonitor={() => setIsMLMonitorOpen(true)}
        onManualTriggerScheduler={handleManualTriggerScheduler}
        isTriggering={isTriggeringScheduler}
        userRole={userRole}
        isAdminAccount={isAdminAccount}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onToggleUserRole={() => {
          if (!isAdminAccount) return;
          setUserRole(prev => {
            const nextRole = prev === 'ADMIN' ? 'SUBSCRIBER' : 'ADMIN';
            if (nextRole === 'ADMIN') {
              setActiveTab('subscribers');
            }
            return nextRole;
          });
        }}
        onOpenPlanManager={() => setIsPlanManagerOpen(true)}
        unreadNotificationsCount={unreadCount}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenPriceAlerts={() => setIsPriceAlertsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        trialSecondsLeft={trialSecondsLeft}
        onOpenPaywall={() => setIsSubscriptionPaywallOpen(true)}
      />

      {/* Global Client Mode Tour Banner / Subscription Status */}
      {userRole === 'SUBSCRIBER' && currentSubscriber.status !== 'ATIVO' && (
        <div className="bg-[#2D3277] text-white text-xs font-bold py-2.5 px-4 text-center shadow-inner flex flex-wrap items-center justify-center gap-2 border-b border-[#3D438F]">
          <span className="flex items-center gap-1.5 bg-[#FFE600] text-[#2D3277] font-black px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
            ✨ MODO TOUR & DEGUSTAÇÃO ATIVO
          </span>
          <span>Você está navegando no modo de demonstração. Pode explorar todas as telas e testar as ferramentas. Para colocar os disparos automáticos em produção, escolha um plano.</span>
          <button
            onClick={() => setActiveTab('subscribers')}
            className="bg-[#FFE600] text-[#2D3277] hover:bg-amber-300 font-extrabold px-3 py-1 rounded-lg transition-all ml-2 shadow text-[11px] flex items-center gap-1 shrink-0"
          >
            <span>VER PLANOS & ADERIR AGORA</span>
          </button>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            dispatchedLogs={dispatchedLogs}
            channels={channels}
            products={products}
            schedulerConfig={schedulerConfig}
            affiliateConfig={affiliateConfig}
            onOpenConverter={() => handleOpenConverterWithProduct()}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenScheduler={() => setIsSchedulerOpen(true)}
            onOpenMLMonitor={() => setIsMLMonitorOpen(true)}
            onOpenChannels={() => setActiveTab('channels')}
            onOpenHelpModal={() => setIsSettingsOpen(true)}
            onQuickDispatch={(product) => handleOpenConverterWithProduct(product)}
            onToggleMasterScheduler={() => handleSaveConfig(undefined, { enabled: !schedulerConfig?.enabled })}
            onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
            onClearLogs={handleClearDispatchedLogs}
          />
        )}

        {activeTab === 'subscribers' && (
          userRole === 'ADMIN' ? (
            <AdminSubscribersPanel
              subscribers={subscribers}
              notifications={adminNotifications}
              onRefresh={fetchAllData}
              onMarkNotificationsRead={handleMarkNotificationsRead}
            />
          ) : (
            <ClientSubscriptionView
              currentSubscriber={currentSubscriber}
              onRefresh={fetchAllData}
            />
          )
        )}

        {activeTab === 'products' && (
          <ProductOfferHunter
            products={products}
            onSelectProductToDispatch={(product) => handleOpenConverterWithProduct(product)}
            affiliateTag={affiliateConfig?.affiliateTag || 'ofertastop_app'}
            priceAlerts={priceAlerts}
            onOpenPriceAlerts={() => setIsPriceAlertsOpen(true)}
          />
        )}

        {activeTab === 'channels' && (
          <WhatsAppChannelsManager
            channels={channels}
            affiliateConfig={affiliateConfig}
            onAddChannel={handleAddChannel}
            onDeleteChannel={handleDeleteChannel}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
          />
        )}

        {activeTab === 'templates' && (
          <CopyTemplatesManager
            templates={templates}
            onAddTemplate={handleAddTemplate}
            onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
          />
        )}

        {activeTab === 'logs' && (
          <DispatchHistory
            logs={dispatchedLogs}
            onReSendOffer={(log) => {
              const matchedProd = products.find(p => p.id === log.productId);
              handleOpenConverterWithProduct(matchedProd || {
                id: log.productId,
                title: log.productTitle,
                originalPrice: log.originalPrice,
                price: log.price,
                discountPercentage: Math.round(((log.originalPrice - log.price) / log.originalPrice) * 100),
                shippingFree: true,
                rating: 4.8,
                reviewsCount: 150,
                category: 'Geral',
                imageUrl: log.productImage,
                originalUrl: log.affiliateUrl,
                affiliateUrl: log.affiliateUrl,
                stockStatus: 'EM_ESTOQUE',
                sellerName: 'Mercado Livre'
              });
            }}
          />
        )}
      </main>

      {/* Modals */}
      <LinkConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        templates={templates}
        channels={channels}
        affiliateTag={affiliateConfig?.affiliateTag || 'ofertastop_app'}
        initialProduct={selectedProductForDispatch}
        onDispatchSuccess={fetchAllData}
        onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
      />

      <AutoSchedulerModal
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        config={schedulerConfig}
        channels={channels}
        onSaveConfig={(updated) => handleSaveConfig(undefined, updated)}
        onTriggerNow={handleManualTriggerScheduler}
        isTriggering={isTriggeringScheduler}
        onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
      />

      <MLOfferMonitorModal
        isOpen={isMLMonitorOpen}
        onClose={() => setIsMLMonitorOpen(false)}
        channels={channels}
        monitorConfig={mlMonitorConfig}
        onSaveConfig={handleSaveMLMonitorConfig}
        onTriggerNow={handleTriggerMLMonitorNow}
        isTriggering={isTriggeringMLMonitor}
        dispatchedLogs={dispatchedLogs}
        onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={affiliateConfig}
        onSaveConfig={(updated) => handleSaveConfig(updated, undefined)}
        onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
      />

      {isPlanManagerOpen && (
        <UserPlanManagerModal
          currentSubscriber={currentSubscriber}
          onClose={() => setIsPlanManagerOpen(false)}
          onPlanChanged={() => {
            fetchAllData();
            setIsPlanManagerOpen(false);
          }}
        />
      )}

      <FirstAccessGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenScheduler={() => setIsSchedulerOpen(true)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        subscribers={subscribers}
        onLoginSuccess={(user) => {
          handleLoginSuccess(user);
          if (user.role === 'SUBSCRIBER' && activeTab === 'subscribers') {
            setActiveTab('subscribers');
          }
          setIsLoginModalOpen(false);
        }}
      />

      <PriceAlertsModal
        isOpen={isPriceAlertsOpen}
        onClose={() => setIsPriceAlertsOpen(false)}
        priceAlerts={priceAlerts}
        onAddAlert={handleAddPriceAlert}
        onToggleAlert={handleTogglePriceAlert}
        onDeleteAlert={handleDeletePriceAlert}
        products={products}
        onSelectProductToDispatch={(product) => handleOpenConverterWithProduct(product)}
        onRequirePlanActivation={(actionName) => ensureActiveSubscription(actionName)}
      />

      <SubscriptionPaywallModal
        isOpen={isSubscriptionPaywallOpen}
        onClose={() => setIsSubscriptionPaywallOpen(false)}
        onGoToPlans={handleGoToPlansFromPaywall}
        actionName={paywallActionName}
      />
    </div>
  );
}


