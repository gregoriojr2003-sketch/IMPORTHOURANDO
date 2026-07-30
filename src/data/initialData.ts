import { MercadoLivreProduct, WhatsAppChannel, OfferPostTemplate, DispatchedOffer, AutoSchedulerConfig, AffiliateConfig } from '../types';

export const INITIAL_PRODUCTS: MercadoLivreProduct[] = [
  {
    id: 'MLB38942019',
    title: 'Smart TV 55" Samsung 4K UHD Crystal UHD 55CU7700',
    originalPrice: 3199.00,
    price: 2199.00,
    discountPercentage: 31,
    installments: '10x de R$ 219,90 sem juros',
    shippingFree: true,
    rating: 4.8,
    reviewsCount: 1420,
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
    originalUrl: 'https://www.mercadolivre.com.br/smart-tv-55-samsung-4k/p/MLB28912',
    affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=ofertastop_app',
    couponCode: 'MELITV200',
    stockStatus: 'OFERTA_RELAMPAGO',
    sellerName: 'Mercado Livre Eletrônicos',
    marketplace: 'MERCADO_LIVRE'
  },
  {
    id: 'SHP89120491',
    title: 'Fone de Ouvido Sem Fio Bluetooth TWS i12 Touch Pro - Shopee Oficial',
    originalPrice: 99.90,
    price: 29.90,
    discountPercentage: 70,
    installments: '3x de R$ 9,96 sem juros',
    shippingFree: true,
    rating: 4.9,
    reviewsCount: 8940,
    category: 'Áudio',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    originalUrl: 'https://shopee.com.br/product/389102/1029381',
    affiliateUrl: 'https://s.shopee.com.br/7xK9pL21?sub_id=shopee_af_top',
    couponCode: 'SHOPEEFRETE',
    stockStatus: 'OFERTA_RELAMPAGO',
    sellerName: 'Shopee Official Store',
    marketplace: 'SHOPEE'
  },
  {
    id: 'AMZ90128301',
    title: 'Kindle Paperwhite 16 GB - Tela de 6,8” com Luz Cautilante Ajustável',
    originalPrice: 799.00,
    price: 599.00,
    discountPercentage: 25,
    installments: '12x de R$ 49,91 sem juros',
    shippingFree: true,
    rating: 4.9,
    reviewsCount: 12400,
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    originalUrl: 'https://www.amazon.com.br/dp/B08N41Y412',
    affiliateUrl: 'https://www.amazon.com.br/dp/B08N41Y412?tag=ofertastop-20',
    couponCode: 'AMAZONPRIME',
    stockStatus: 'EM_ESTOQUE',
    sellerName: 'Amazon.com.br',
    marketplace: 'AMAZON'
  },
  {
    id: 'ALI91823019',
    title: 'Console Portátil Anbernic RG35XX Pro Retro Games 10.000 Jogos',
    originalPrice: 389.00,
    price: 189.00,
    discountPercentage: 51,
    installments: '6x de R$ 31,50 sem juros',
    shippingFree: true,
    rating: 4.8,
    reviewsCount: 3100,
    category: 'Games',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    originalUrl: 'https://pt.aliexpress.com/item/100500691238.html',
    affiliateUrl: 'https://s.click.aliexpress.com/e/_Dk92pX1?aff_fcid=ali_track_88',
    couponCode: 'BRCHOICE20',
    stockStatus: 'OFERTA_RELAMPAGO',
    sellerName: 'AliExpress Choice Direct',
    marketplace: 'ALIEXPRESS'
  },
  {
    id: 'TEM81923012',
    title: 'Mini Projetor Smart 4K Wi-Fi Bluetooth Android HD 1080p',
    originalPrice: 450.00,
    price: 198.50,
    discountPercentage: 56,
    installments: '4x de R$ 49,62 sem juros',
    shippingFree: true,
    rating: 4.7,
    reviewsCount: 1540,
    category: 'Eletrônicos',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    originalUrl: 'https://www.temu.com/goods-129381023.html',
    affiliateUrl: 'https://temu.to/m/us910283?referral_code=temu_code_99',
    couponCode: 'TEMUBONUS100',
    stockStatus: 'POUCAS_UNIDADES',
    sellerName: 'Temu Direct Express',
    marketplace: 'TEMU'
  },
  {
    id: 'MAG91028301',
    title: 'Smartphone Samsung Galaxy S24 FE 256GB 8GB RAM AI Gray',
    originalPrice: 4499.00,
    price: 2899.00,
    discountPercentage: 35,
    installments: '12x de R$ 241,58 sem juros',
    shippingFree: true,
    rating: 4.9,
    reviewsCount: 890,
    category: 'Celulares',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    originalUrl: 'https://www.magazineluiza.com.br/samsung-galaxy-s24-fe/p/238102300',
    affiliateUrl: 'https://www.magazinevoce.com.br/magazinestore10/p/238102300',
    couponCode: 'MAGALU100',
    stockStatus: 'EM_ESTOQUE',
    sellerName: 'Magazine Luiza Oficial',
    marketplace: 'MAGALU'
  }
];

export const INITIAL_CHANNELS: WhatsAppChannel[] = [
  {
    id: 'chan-status',
    name: '📸 Meu Status do WhatsApp (Stories/Feed 24h)',
    type: 'STATUS',
    phoneNumberOrJid: 'status@broadcast',
    membersCount: 0,
    status: 'CONNECTED',
    autoPost: true
  },
  {
    id: 'chan-1',
    name: '⚡ Canal Oficial de Ofertas & Achadinhos',
    type: 'CHANNEL',
    phoneNumberOrJid: '120363019283748291@newsletter',
    inviteLink: 'https://whatsapp.com/channel/0029Va901823748291',
    membersCount: 14850,
    status: 'CONNECTED',
    autoPost: true
  },
  {
    id: 'chan-2',
    name: '📱 Grupo VIP Tech & Promos WhatsApp',
    type: 'GROUP',
    phoneNumberOrJid: '5511999998888-1612345678@g.us',
    inviteLink: 'https://chat.whatsapp.com/G91823748291029381',
    membersCount: 890,
    status: 'CONNECTED',
    autoPost: true
  },
  {
    id: 'chan-3',
    name: '🏠 Achadinhos Shopee & Mercado Livre',
    type: 'CHANNEL',
    phoneNumberOrJid: '120363098127364512@newsletter',
    inviteLink: 'https://whatsapp.com/channel/0029Va891230491203',
    membersCount: 6320,
    status: 'CONNECTED',
    autoPost: false
  },
  {
    id: 'chan-4',
    name: '🎮 Grupo Promoções Gamer Amazon & Ali',
    type: 'GROUP',
    phoneNumberOrJid: '5521988887777-1623456789@g.us',
    inviteLink: 'https://chat.whatsapp.com/H01928301928301928',
    membersCount: 1020,
    status: 'PENDING',
    autoPost: false
  }
];

export const INITIAL_TEMPLATES: OfferPostTemplate[] = [
  {
    id: 'temp-1',
    name: '🔥 Estilo Imperdível Urgente',
    tone: 'URGENT',
    headerText: '🚨 BAIXOU BASTANTE! MENOR PREÇO HISTÓRICO! 🚨',
    includeRating: true,
    includeInstallments: true,
    includeShipping: true,
    includeCoupons: true,
    includeChannelInvite: true,
    sendImage: true,
    callToActionText: '👉 GARANTA O SEU AQUI COM DESCONTO:',
    hashtagTags: ['OfertaImperdivel', 'Desconto', 'Promocao']
  },
  {
    id: 'temp-2',
    name: '✨ Estilo Achadinhos TikTok/Reels',
    tone: 'ACHADINHOS',
    headerText: '✨ ACHADINHO VIRAL QUE VALE CADA CENTAVO! ✨',
    includeRating: true,
    includeInstallments: true,
    includeShipping: true,
    includeCoupons: true,
    includeChannelInvite: true,
    sendImage: true,
    callToActionText: '🛒 LINK DO PRODUTO AQUI:',
    hashtagTags: ['Achadinhos', 'PromoViral', 'AchadosWhatsApp']
  },
  {
    id: 'temp-5',
    name: '📢 Formato Viral para Canal + Convite do Canal',
    tone: 'VIRAL_CHANNEL',
    headerText: '💥 OFERTA EXCLUSIVA DO NOSSO CANAL! 💥',
    includeRating: true,
    includeInstallments: true,
    includeShipping: true,
    includeCoupons: true,
    includeChannelInvite: true,
    sendImage: true,
    callToActionText: '⚡ LINK DIRETO PARA COMPRAR:',
    hashtagTags: ['CanalDeOfertas', 'PromocaoExclusiva']
  },
  {
    id: 'temp-3',
    name: '💻 Estilo Especificações Tech',
    tone: 'TECH',
    headerText: '💻 PROMOÇÃO TECH RECOMENDADA DO DIA',
    includeRating: true,
    includeInstallments: true,
    includeShipping: true,
    includeCoupons: true,
    sendImage: true,
    callToActionText: '⚡ LINK DIRETO PARA COMPRA:',
    hashtagTags: ['TechDeals', 'Hardware', 'Smartphone']
  },
  {
    id: 'temp-4',
    name: '📌 Estilo Direto & Minimalista',
    tone: 'MINIMAL',
    headerText: '📌 Ofertinha do momento:',
    includeRating: false,
    includeInstallments: true,
    includeShipping: true,
    includeCoupons: true,
    sendImage: false,
    callToActionText: '🔗 Compre pelo link:',
    hashtagTags: ['Descontos']
  }
];

export const INITIAL_DISPATCHED_LOGS: DispatchedOffer[] = [];

export const INITIAL_SCHEDULER_CONFIG: AutoSchedulerConfig = {
  enabled: true,
  intervalMinutes: 30,
  randomizeDelay: true,
  startTime: '06:00',
  endTime: '23:00',
  targetChannels: ['chan-status', 'chan-1'],
  templateId: 'temp-1',
  minDiscount: 30,
  autoPost50PercentUrgent: true,
  autoPost70Percent24hRadar: true,
  priorityFlowChannelToGroup: true,
  autoPostToWhatsAppStatus: true,
  botPriority1: 'DISCOUNT_PERCENT',
  botPriority2: 'SAVINGS_AMOUNT',
  botPriority3: 'RATING',
  freeShippingOnly: true,
  categories: ['Eletrônicos', 'Celulares', 'Eletrodomésticos', 'Games', 'Áudio'],
  marketplaces: ['MERCADO_LIVRE', 'SHOPEE', 'AMAZON', 'ALIEXPRESS', 'TEMU', 'MAGALU'],
  maxPostsPerDay: 48,
  lastRunAt: 'Sem execuções anteriores',
  nextRunAt: 'Próxima execução automatizada pronta'
};

export const INITIAL_AFFILIATE_CONFIG: AffiliateConfig = {
  affiliateTag: 'ofertastop_app',
  customDomain: 'm.ofertastop.com.br',
  marketplaceAccounts: {
    mercadoLivreTag: 'ofertastop_app',
    shopeeTag: 'shopee_af_top',
    amazonTag: 'ofertastop-20',
    aliExpressTag: 'ali_track_88',
    temuTag: 'temu_code_99',
    magaluTag: 'magazinestore10'
  },
  brandVoice: {
    toneStyle: 'HYPED',
    brandName: 'IMPORTHOURANDO',
    greetingGreeting: '🔥 Fala galera do IMPORTHOURANDO!',
    customPromptInstructions: 'Destaque a economia no valor do produto, crie senso de urgência motivando a compra imediata e mencione que a oferta é de procedência verificada.',
    emojiDensity: 'HIGH',
    brandSignatureText: '⚡ IMPORTHOURANDO - O robô que garante o menor preço para você!',
    customCtaPhrase: '👉 GARANTA A SUA OFERTA COM DESCONTO AQUI:'
  },
  webhooks: [
    {
      id: 'webhook-sample-n8n',
      name: 'Webhook N8N / Make (Notificação de Disparo)',
      url: 'https://n8n.webhook.site/importhourando/disparos',
      enabled: true,
      events: ['DISPATCH_SUCCESS', 'DISPATCH_FAILURE'],
      secretToken: 'sec_imp_token_9812',
      createdAt: '2026-07-30',
      lastStatus: 200,
      lastTriggeredAt: 'Hoje'
    }
  ],
  defaultChannelInviteLink: 'https://whatsapp.com/channel/0029Va901823748291',
  mlAppId: '829401827410293',
  mlSecretKey: 'ml_sec_91028301928371',
  mlStatus: 'CONNECTED',
  whatsappApiType: 'EVOLUTION_API',
  whatsappToken: 'evo_sec_981273918237',
  whatsappInstance: 'inst_meli_deals_01',
  whatsappStatus: 'CONNECTED',
  isConnected: true,
  botName: 'ZapAffiliate Multi-Marketplace Bot'
};

export const INITIAL_SUBSCRIBERS: any[] = [
  {
    id: 'sub-owner-001',
    name: 'Gregório Jr. (Proprietário IMPORTHOURANDO)',
    email: 'gregoriojr2003@gmail.com',
    phone: '+55 (11) 98888-0000',
    plan: 'ANUAL',
    status: 'ATIVO',
    startedAt: '2026-01-01',
    expiresAt: '2030-01-01',
    totalPaid: 0,
    discountApplied: 100,
    isLifetimeExemptFromMonitoring: true,
    notes: 'Conta Administrador Geral / Proprietário.'
  }
];

export const INITIAL_ADMIN_NOTIFICATIONS: any[] = [];

export const INITIAL_PRICE_ALERTS: any[] = [];


