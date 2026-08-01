export type MarketplaceType = 'MERCADO_LIVRE' | 'SHOPEE' | 'AMAZON' | 'ALIEXPRESS' | 'TEMU' | 'MAGALU';

export interface MercadoLivreProduct {
  id: string;
  title: string;
  originalPrice: number;
  price: number;
  discountPercentage: number;
  installments?: string;
  shippingFree: boolean;
  rating: number;
  reviewsCount: number;
  category: string;
  imageUrl: string;
  originalUrl: string;
  affiliateUrl: string;
  couponCode?: string;
  stockStatus: 'EM_ESTOQUE' | 'POUCAS_UNIDADES' | 'OFERTA_RELAMPAGO';
  sellerName: string;
  marketplace?: MarketplaceType;
}

export interface WhatsAppChannel {
  id: string;
  name: string;
  type: 'CHANNEL' | 'GROUP' | 'BROADCAST' | 'STATUS';
  phoneNumberOrJid: string;
  inviteLink?: string; // e.g. https://whatsapp.com/channel/... or https://chat.whatsapp.com/...
  membersCount: number;
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  autoPost: boolean;
}

export interface OfferPostTemplate {
  id: string;
  name: string;
  tone: 'URGENT' | 'CASUAL' | 'ACHADINHOS' | 'TECH' | 'MINIMAL' | 'CUSTOM' | 'VIRAL_CHANNEL';
  headerText: string;
  bodyPattern?: string;
  includeRating: boolean;
  includeInstallments: boolean;
  includeShipping: boolean;
  includeCoupons: boolean;
  includeChannelInvite?: boolean;
  sendImage: boolean;
  callToActionText: string;
  hashtagTags: string[];
}

export interface DispatchedOffer {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  price: number;
  originalPrice: number;
  affiliateUrl: string;
  channelId: string;
  channelName: string;
  messageText: string;
  sentAt: string;
  status: 'ENVIADO' | 'AGENDADO' | 'FALHOU';
  clicksCount: number;
  estimatedComission: number;
  marketplace?: MarketplaceType;
}

export interface AutoSchedulerConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 30 min
  randomizeDelay: boolean; // ±2 min anti-spam
  startTime: string; // e.g. "06:00"
  endTime: string; // e.g. "23:00"
  targetChannels: string[];
  templateId: string;
  minDiscount: number; // default 30%
  autoPost50PercentUrgent: boolean; // Passo 2: Ofertas >=50% disparam imediatamente fura fila
  autoPost70Percent24hRadar: boolean; // Passo 3: Ofertas >=70% radar 24h prioritário sem restrição de horário
  priorityFlowChannelToGroup: boolean; // Passo 4: Disparo prioritário para o Canal do WhatsApp, depois para o Grupo
  autoPostToWhatsAppStatus: boolean; // Disparo automático sincronizado no Meu Status do WhatsApp
  botPriority1?: 'DISCOUNT_PERCENT' | 'SAVINGS_AMOUNT' | 'RATING' | 'LOWEST_PRICE' | 'FREE_SHIPPING' | 'REVIEWS_COUNT';
  botPriority2?: 'DISCOUNT_PERCENT' | 'SAVINGS_AMOUNT' | 'RATING' | 'LOWEST_PRICE' | 'FREE_SHIPPING' | 'REVIEWS_COUNT';
  botPriority3?: 'DISCOUNT_PERCENT' | 'SAVINGS_AMOUNT' | 'RATING' | 'LOWEST_PRICE' | 'FREE_SHIPPING' | 'REVIEWS_COUNT';
  freeShippingOnly: boolean;
  categories: string[];
  marketplaces?: MarketplaceType[];
  maxPostsPerDay: number;
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface MarketplaceAffiliateAccounts {
  mercadoLivreTag: string;
  shopeeTag: string; // e.g. shopee_af_123 or sub_id
  amazonTag: string; // e.g. oferta-20
  aliExpressTag: string; // e.g. ali_track_88
  temuTag: string; // e.g. temu_code_99
  magaluTag: string; // e.g. magazinetop
}

export type LanguageRegionalStyle =
  | 'PORTUGUES_PADRAO'
  | 'NORDESTINO'
  | 'PAULISTANO'
  | 'CARIOCA'
  | 'GAUCHO'
  | 'MINEIRO'
  | 'FORMAL_EXECUTIVO'
  | 'INGLES'
  | 'ESPANHOL';

export interface BrandVoiceConfig {
  toneStyle: 'FORMAL' | 'HYPED' | 'SALES' | 'HUMOROUS' | 'URGENT' | 'CUSTOM';
  languageStyle?: LanguageRegionalStyle;
  customLanguageInstructions?: string;
  brandName: string;
  greetingGreeting: string;
  customPromptInstructions: string;
  emojiDensity: 'HIGH' | 'MEDIUM' | 'MINIMAL';
  brandSignatureText: string;
  customCtaPhrase: string;
}

export type WebhookEvent =
  | 'OFFER_DISPATCHED'
  | 'NEW_LEAD_CLICK'
  | 'OFFER_AUTO_POSTED'
  | 'PRICE_ALERT_TRIGGERED'
  | 'SUBSCRIBER_REGISTERED';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  secretKey: string;
  events: WebhookEvent[];
  retryOnFailure: boolean;
  lastTriggeredAt?: string;
  lastStatus?: 'SUCCESS' | 'FAILED';
  lastResponseCode?: number;
}

export interface WebhookLog {
  id: string;
  event: WebhookEvent;
  url: string;
  status: 'SUCCESS' | 'FAILED';
  responseCode: number;
  payloadSummary: string;
  timestamp: string;
}

export interface AffiliateConfig {
  affiliateTag: string; // Legacy / ML tag
  customDomain?: string;
  
  // Multi-Marketplace Accounts
  marketplaceAccounts?: MarketplaceAffiliateAccounts;

  // Brand Voice & AI Copy Directives
  brandVoice?: BrandVoiceConfig;

  // Webhook Integrations
  webhookConfig?: WebhookConfig;

  mlAppId?: string;
  mlSecretKey?: string;
  mlStatus: 'CONNECTED' | 'DISCONNECTED' | 'TESTING';
  
  whatsappApiType: 'EVOLUTION_API' | 'Z_API' | 'META_CLOUD_API' | 'SIMULATOR';
  whatsappToken: string;
  whatsappInstance: string;
  whatsappStatus: 'CONNECTED' | 'DISCONNECTED' | 'TESTING';
  isConnected: boolean;
  botName: string;
  qrCodeUrl?: string;

  defaultChannelInviteLink?: string; // e.g. https://whatsapp.com/channel/0029Va...
}

export interface MLSearchFilter {
  query: string;
  category: string;
  minDiscount: number;
  freeShipping: boolean;
  marketplace?: MarketplaceType | 'ALL';
  sortBy: 'discount' | 'price_low' | 'relevance';
}

export type SubscriptionPlan = 'MENSAL' | 'SEMESTRAL' | 'ANUAL' | 'VITALICIO';
export type SubscriberStatus = 'ATIVO' | 'CANCELADO' | 'RECONQUISTA_3M' | 'EXPIRADO' | 'PENDENTE';

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: SubscriptionPlan;
  status: SubscriberStatus;
  startedAt: string;
  expiresAt: string | null;
  totalPaid: number;
  discountApplied: number; // 0, 10, or 30 (%)
  isLifetimeExemptFromMonitoring: boolean; // Regra 1: Anual é marcado e possui Isenção/Desconto especial
  cancellationRequestedAt?: string;
  reengagementDeadline?: string; // Regra 2: Janela de 3 meses de reconquista
  notes?: string;
}

export interface AdminNotification {
  id: string;
  type: 'NEW_SUBSCRIBER' | 'PLAN_UPGRADE' | 'CANCELLATION_INTERCEPT' | 'DISCOUNT_CONVERSION' | 'RECONQUEST_ALERT' | 'VITALICIO_EXEMPT' | 'ANUAL_EXEMPT';
  subscriberName: string;
  subscriberEmail: string;
  message: string;
  timestamp: string;
  read: boolean;
  badgeColor: string;
}

export interface UserSession {
  currentUser: {
    name: string;
    email: string;
    role: 'ADMIN' | 'SUBSCRIBER';
    actualRole?: 'ADMIN' | 'SUBSCRIBER';
    subscriber?: Subscriber;
    plan?: SubscriptionPlan;
    isFree?: boolean;
  };
}

export interface AdminPaymentConfig {
  pixKey: string;
  pixKeyType: 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP' | 'CPF';
  pixBeneficiary: string;
  pixCopyPasteCode: string;
  mercadoPagoCheckoutUrl: string;
  paymentInstructions: string;
  updatedAt?: string;
}

export interface PriceAlertRule {
  id: string;
  keyword: string;
  targetDiscountPercentage: number;
  targetMaxPrice?: number;
  enabled: boolean;
  createdAt: string;
  matchesCount?: number;
}


