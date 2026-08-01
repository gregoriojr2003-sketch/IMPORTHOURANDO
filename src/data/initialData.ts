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

export const INITIAL_DISPATCHED_LOGS: DispatchedOffer[] = [
  {
    id: 'log-101',
    productId: 'MLB38942019',
    productTitle: 'Smart TV 55" Samsung 4K UHD Crystal UHD 55CU7700',
    productImage: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
    price: 2199.00,
    originalPrice: 3199.00,
    affiliateUrl: 'https://mercadolivre.com/sec/2a8Fk9L?matext=ofertastop_app',
    channelId: 'chan-1',
    channelName: '⚡ Canal Oficial de Ofertas & Achadinhos',
    messageText: '🚨 BAIXOU BASTANTE! MENOR PREÇO HISTÓRICO! 🚨\n\n📺 Smart TV 55" Samsung 4K UHD Crystal\nDe R$ 3.199,00 por apenas R$ 2.199,00 (31% OFF)\n💳 Em 10x de R$ 219,90 sem juros\n🚚 Frete Grátis!\n🎟️ Usar cupom: MELITV200\n\n👉 GARANTA A SUA AQUI COM DESCONTO:\nhttps://mercadolivre.com/sec/2a8Fk9L?matext=ofertastop_app',
    sentAt: '2026-07-26 09:15',
    status: 'ENVIADO',
    clicksCount: 342,
    estimatedComission: 87.96,
    marketplace: 'MERCADO_LIVRE'
  },
  {
    id: 'log-102',
    productId: 'SHP89120491',
    productTitle: 'Fone de Ouvido Sem Fio Bluetooth TWS i12 Touch Pro - Shopee Oficial',
    productImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    price: 29.90,
    originalPrice: 99.90,
    affiliateUrl: 'https://s.shopee.com.br/7xK9pL21?sub_id=shopee_af_top',
    channelId: 'chan-2',
    channelName: '📱 Grupo VIP Tech & Promos WhatsApp',
    messageText: '✨ ACHADINHO VIRAL QUE VALE CADA CENTAVO! ✨\n\n🎧 Fone Bluetooth TWS i12 Pro\nDe R$ 99,90 por R$ 29,90 (70% OFF)\n🚚 Frete Grátis Shopee!\n\n🛒 LINK DO PRODUTO AQUI:\nhttps://s.shopee.com.br/7xK9pL21?sub_id=shopee_af_top',
    sentAt: '2026-07-26 08:30',
    status: 'ENVIADO',
    clicksCount: 289,
    estimatedComission: 14.95,
    marketplace: 'SHOPEE'
  },
  {
    id: 'log-103',
    productId: 'MLB4892018',
    productTitle: 'Fritadeira Air Fryer Oven Mondial 12L 1800W Inox',
    productImage: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80',
    price: 399.90,
    originalPrice: 699.90,
    affiliateUrl: 'https://mercadolivre.com/sec/airfryer12l?matext=ofertastop_app',
    channelId: 'chan-1',
    channelName: '⚡ Canal Oficial de Ofertas & Achadinhos',
    messageText: '🔥 AIR FRYER OVEN MONDIAL 12L EM PROMOÇÃO!\nDe R$ 699,90 por R$ 399,90!\n👉 Compre aqui: https://mercadolivre.com/sec/airfryer12l?matext=ofertastop_app',
    sentAt: '2026-07-25 18:20',
    status: 'ENVIADO',
    clicksCount: 412,
    estimatedComission: 31.99,
    marketplace: 'MERCADO_LIVRE'
  },
  {
    id: 'log-104',
    productId: 'AMZ9102831',
    productTitle: 'Smartphone Samsung Galaxy S23 5G 256GB 8GB RAM Câmera Tripla',
    productImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    price: 2799.00,
    originalPrice: 4299.00,
    affiliateUrl: 'https://amazon.com.br/dp/B0BSLS23?tag=ofertastop-20',
    channelId: 'chan-2',
    channelName: '📱 Grupo VIP Tech & Promos WhatsApp',
    messageText: '💥 MENOR PREÇO DO ANO NO GALAXY S23 256GB!\nDe R$ 4.299 por R$ 2.799 à vista!\n⚡ Link Amazon: https://amazon.com.br/dp/B0BSLS23?tag=ofertastop-20',
    sentAt: '2026-07-25 14:10',
    status: 'ENVIADO',
    clicksCount: 518,
    estimatedComission: 111.96,
    marketplace: 'AMAZON'
  },
  {
    id: 'log-105',
    productId: 'MLB1029381',
    productTitle: 'Notebook Gamer Acer Nitro 5 Intel Core i5 16GB SSD 512GB RTX 3050',
    productImage: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80',
    price: 3899.00,
    originalPrice: 5299.00,
    affiliateUrl: 'https://mercadolivre.com/sec/nitro5acer?matext=ofertastop_app',
    channelId: 'chan-3',
    channelName: '🏠 Achadinhos Shopee & Mercado Livre',
    messageText: '💻 NOTEBOOK GAMER ACER NITRO 5 COM RTX 3050!\nDe R$ 5.299 por R$ 3.899 em 10x sem juros!\n🔗 Garanta o seu: https://mercadolivre.com/sec/nitro5acer?matext=ofertastop_app',
    sentAt: '2026-07-24 20:05',
    status: 'ENVIADO',
    clicksCount: 625,
    estimatedComission: 155.96,
    marketplace: 'MERCADO_LIVRE'
  },
  {
    id: 'log-106',
    productId: 'ALI9012830',
    productTitle: 'Caixa de Som Portátil Bluetooth JBL Flip 6 À Prova D\'água',
    productImage: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    price: 549.00,
    originalPrice: 849.00,
    affiliateUrl: 'https://best.aliexpress.com/item/jblflip6.html',
    channelId: 'chan-1',
    channelName: '⚡ Canal Oficial de Ofertas & Achadinhos',
    messageText: '🎵 JBL FLIP 6 ORIGINAL EM PROMOÇÃO IMPERDÍVEL!\nDe R$ 849 por R$ 549 com frete grátis!\n👉 Link direto: https://best.aliexpress.com/item/jblflip6.html',
    sentAt: '2026-07-24 11:30',
    status: 'ENVIADO',
    clicksCount: 230,
    estimatedComission: 27.45,
    marketplace: 'ALIEXPRESS'
  }
];

export const INITIAL_SCHEDULER_CONFIG: AutoSchedulerConfig = {
  enabled: true,
  intervalMinutes: 30,
  randomizeDelay: true,
  startTime: '06:00',
  endTime: '23:00',
  targetChannels: ['chan-status', 'chan-1', 'chan-2'],
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
  lastRunAt: '2026-07-25 09:30',
  nextRunAt: '2026-07-25 10:00 (±2min anti-spam)'
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
    languageStyle: 'PORTUGUES_PADRAO',
    brandName: 'IMPORTHOURANDO',
    greetingGreeting: '🔥 Fala galera do IMPORTHOURANDO!',
    customPromptInstructions: 'Destaque a economia no valor do produto, crie senso de urgência motivando a compra imediata e mencione que a oferta é de procedência verificada.',
    emojiDensity: 'HIGH',
    brandSignatureText: '⚡ IMPORTHOURANDO - O robô que garante o menor preço para você!',
    customCtaPhrase: '👉 GARANTA A SUA OFERTA COM DESCONTO AQUI:'
  },
  webhookConfig: {
    enabled: true,
    url: 'https://webhook.site/importhourando-demo',
    secretKey: 'whsec_importhourando_2026_key',
    events: ['OFFER_DISPATCHED', 'NEW_LEAD_CLICK', 'OFFER_AUTO_POSTED', 'SUBSCRIBER_REGISTERED'],
    retryOnFailure: true,
    lastTriggeredAt: '2026-07-31 14:20',
    lastStatus: 'SUCCESS',
    lastResponseCode: 200
  },
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
    phone: '+55 11 98888-0000',
    plan: 'ANUAL',
    status: 'ATIVO',
    startedAt: '2025-01-01',
    expiresAt: '2027-01-01',
    totalPaid: 0,
    discountApplied: 100,
    isLifetimeExemptFromMonitoring: true,
    notes: 'Conta Administrador Geral / Proprietário - Acesso Anual Gratuito.'
  },
  {
    id: 'sub-101',
    name: 'Carlos Alberto Silva',
    email: 'carlos.silva@gmail.com',
    phone: '+55 11 97123-4567',
    plan: 'ANUAL',
    status: 'ATIVO',
    startedAt: '2025-11-10',
    expiresAt: '2026-11-10',
    totalPaid: 247.00,
    discountApplied: 0,
    isLifetimeExemptFromMonitoring: true,
    notes: 'Regra 1: Licença Anual. Marcado com Isenção/Tratamento Especial de Monitoramento.'
  },
  {
    id: 'sub-102',
    name: 'Fernanda Oliveira (Converteu 30% OFF)',
    email: 'fernanda.ofertas@outlook.com',
    phone: '+55 21 98234-5678',
    plan: 'ANUAL',
    status: 'ATIVO',
    startedAt: '2026-06-15',
    expiresAt: '2027-06-15',
    totalPaid: 172.90,
    discountApplied: 30,
    isLifetimeExemptFromMonitoring: true,
    notes: 'Regra 3: Tentou cancelar o plano Mensal e aceitou a oferta de retenção com 30% de desconto no Plano Anual!'
  },
  {
    id: 'sub-103',
    name: 'Marcelo Ribeiro',
    email: 'marcelo.tech@hotmail.com',
    phone: '+55 31 99123-8822',
    plan: 'SEMESTRAL',
    status: 'ATIVO',
    startedAt: '2026-03-01',
    expiresAt: '2026-09-01',
    totalPaid: 147.00,
    discountApplied: 0,
    isLifetimeExemptFromMonitoring: false,
    notes: 'Plano Semestral Ativo com renovação automática prevista para Setembro/2026.'
  },
  {
    id: 'sub-104',
    name: 'Amanda Souza (Converteu 10% OFF)',
    email: 'amanda.mkt@yahoo.com.br',
    phone: '+55 41 98877-6655',
    plan: 'SEMESTRAL',
    status: 'ATIVO',
    startedAt: '2026-07-02',
    expiresAt: '2027-01-02',
    totalPaid: 132.30,
    discountApplied: 10,
    isLifetimeExemptFromMonitoring: false,
    notes: 'Regra 3: Migrou do plano Mensal para Semestral aproveitando o desconto de 10% OFF.'
  },
  {
    id: 'sub-105',
    name: 'Roberto Diniz',
    email: 'roberto.diniz@gmail.com',
    phone: '+55 19 97766-5544',
    plan: 'MENSAL',
    status: 'ATIVO',
    startedAt: '2026-07-01',
    expiresAt: '2026-08-01',
    totalPaid: 29.90,
    discountApplied: 0,
    isLifetimeExemptFromMonitoring: false,
    notes: 'Assinante Mensal ativo sem fidelidade.'
  },
  {
    id: 'sub-106',
    name: 'Lucas Mendes (Sem Renovação)',
    email: 'lucas.mendes@gmail.com',
    phone: '+55 81 99887-1122',
    plan: 'SEMESTRAL',
    status: 'RECONQUISTA_3M',
    startedAt: '2025-12-15',
    expiresAt: '2026-06-15',
    totalPaid: 147.00,
    discountApplied: 0,
    isLifetimeExemptFromMonitoring: false,
    reengagementDeadline: '2026-09-15',
    notes: 'Regra 2: Assinatura expirou há 1 mês. Em ciclo de reconquista (janela de 3 meses de notificações da vantagem de voltar).'
  }
];

export const INITIAL_ADMIN_NOTIFICATIONS: any[] = [
  {
    id: 'notif-1',
    type: 'DISCOUNT_CONVERSION',
    subscriberName: 'Fernanda Oliveira',
    subscriberEmail: 'fernanda.ofertas@outlook.com',
    message: '🎉 SUCESSO DE RETENÇÃO! O cliente solicitou cancelamento do plano Mensal e CONVERTEU para Anual com 30% OFF (R$ 172,90 pago via PIX)!',
    timestamp: 'Hoje às 09:12',
    read: false,
    badgeColor: 'bg-purple-600'
  },
  {
    id: 'notif-2',
    type: 'PLAN_UPGRADE',
    subscriberName: 'Amanda Souza',
    subscriberEmail: 'amanda.mkt@yahoo.com.br',
    message: '✨ MIGRAÇÃO DE PLANO: O cliente migrou de Mensal para Semestral com 10% OFF (R$ 132,30 pago)!',
    timestamp: 'Ontem às 18:45',
    read: false,
    badgeColor: 'bg-emerald-600'
  },
  {
    id: 'notif-3',
    type: 'RECONQUEST_ALERT',
    subscriberName: 'Lucas Mendes',
    subscriberEmail: 'lucas.mendes@gmail.com',
    message: '🔔 ALERTA DE RECONQUISTA (3 MESES): Assinatura de Lucas Mendes expirou. Enviado lembrete das vantagens de retornar ao grupo seleto IMPORTHOURANDO.',
    timestamp: '23/07/2026 14:00',
    read: true,
    badgeColor: 'bg-amber-600'
  },
  {
    id: 'notif-4',
    type: 'ANUAL_EXEMPT',
    subscriberName: 'Carlos Alberto Silva',
    subscriberEmail: 'carlos.silva@gmail.com',
    message: '✨ LICENÇA ANUAL APLICADA: Carlos Alberto adquiriu o Plano ANUAL com renovação anual ativada.',
    timestamp: '20/07/2026 11:20',
    read: true,
    badgeColor: 'bg-[#2D3277]'
  }
];

export const INITIAL_PRICE_ALERTS = [
  {
    id: 'alert-1',
    keyword: 'iPhone',
    targetDiscountPercentage: 20,
    targetMaxPrice: 4500,
    enabled: true,
    createdAt: '2026-07-01'
  },
  {
    id: 'alert-2',
    keyword: 'Smart TV',
    targetDiscountPercentage: 25,
    targetMaxPrice: 3000,
    enabled: true,
    createdAt: '2026-07-05'
  },
  {
    id: 'alert-3',
    keyword: 'Fone',
    targetDiscountPercentage: 40,
    targetMaxPrice: 150,
    enabled: true,
    createdAt: '2026-07-10'
  },
  {
    id: 'alert-4',
    keyword: 'Kindle',
    targetDiscountPercentage: 20,
    targetMaxPrice: 650,
    enabled: true,
    createdAt: '2026-07-15'
  }
];


