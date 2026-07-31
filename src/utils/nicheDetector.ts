export interface OfferNiche {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  keywords: string[];
  viralHooks: string[];
  slangAndTriggers: string[];
  ctaPhrase: string;
  hashtags: string[];
}

export const OFFER_NICHES: OfferNiche[] = [
  {
    id: 'TECH_ELECTRONICS',
    name: 'Eletrônicos & Tecnologia',
    emoji: '⚡',
    badge: '⚡ TECH & GADGETS',
    keywords: [
      'smarttv', 'tv', '4k', 'oled', 'qled', 'samsung', 'lg', 'xiaomi', 'iphone', 'apple',
      'celular', 'smartphone', 'galaxy', 'motorola', 'ipad', 'tablet', 'notebook', 'macbook',
      'dell', 'lenovo', 'asus', 'carregador', 'powerbank', 'projetor', 'smartwatch', 'relogio inteligente'
    ],
    viralHooks: [
      '⚡ ANOMALIA DE PREÇO EM TECNOLOGIA DE PONTA!',
      '📱 MENOR PREÇO HISTÓRICO NESSE MAQUINÁRIO!',
      '🔥 O SMARTPHONE QUERIDINHO DO BRASIL EM PROMOÇÃO RELÂMPAGO!',
      '💥 PREÇO FURA-FILA NO EQUIPAMENTO QUE TODO MUNDO QUER!'
    ],
    slangAndTriggers: [
      'Tecnologia de ponta',
      'Processador monstruoso',
      'Custo-benefício insano no Brasil',
      'Desconto real que quase nunca aparece',
      'Tela incrível e bateria de longa duração'
    ],
    ctaPhrase: '👉 GARANTA A SUA MÁQUINA COM DESCONTO AQUI:',
    hashtags: ['#TechViral', '#PromoTech', '#OfertaSmartphone', '#AchadinhosTech']
  },
  {
    id: 'GAMER_GEEK',
    name: 'Gamer & Geek',
    emoji: '🎮',
    badge: '🎮 ESPAÇO GAMER',
    keywords: [
      'gamer', 'ps5', 'playstation', 'xbox', 'nintendo', 'switch', 'rtx', 'gtx', 'placa de video',
      'headset gamer', 'teclado mecanico', 'mouse gamer', 'ryzen', 'intel core', 'monitor gamer',
      '144hz', '240hz', 'cadeira gamer', 'console', 'controle dualsense', 'fifa', 'gta', 'jogo'
    ],
    viralHooks: [
      '🎮 ATENÇÃO GAMERS! AUMENTA SEU FPS SEM PESAR NO BOLSO!',
      '🚨 QUEDA INSANA DE PREÇO NO SETUP DOS SONHOS!',
      '💥 PROMOÇÃO FURA-FILA NO CONSOLE / PERIFÉRICO MAIS QUERIDO!',
      '⚡ SEU SETUP MAIS POTENTE PAGANDO UMA PECHINCHA!'
    ],
    slangAndTriggers: [
      'FPS lá no alto e temperatura lá embaixo',
      'Zero lag e máxima performance',
      'O upgrade que o seu setup precisava',
      'Preço de oportunidade para zerar a lista de desejos',
      'Avaliação 5 estrelas pela comunidade gamer'
    ],
    ctaPhrase: '👉 MONTE SEU SETUP COM DESCONTO INSANO:',
    hashtags: ['#SetupGamer', '#OfertaGamer', '#PS5Promocao', '#GamerBR']
  },
  {
    id: 'HOME_KITCHEN',
    name: 'Casa, Cozinha & Eletro',
    emoji: '🍳',
    badge: '🍳 CASA & COZINHA',
    keywords: [
      'airfryer', 'fritadeira', 'cafeteira', 'nespresso', 'dolce gusto', 'panela', 'tramontina',
      'aspirador', 'robo', 'limpeza', 'microondas', 'geladeira', 'fogao', 'liquidificador',
      'batedeira', 'mop', 'ferro de passar', 'cama', 'colchao', 'travesseiro', 'decoracao', 'organizacao'
    ],
    viralHooks: [
      '🍳 A QUERIDINHA DA COZINHA PRÁTICA COM PREÇO DE BANANADA!',
      '🏠 PRATICIDADE TOTAL PARA O SEU LAR COM DESCONTO INACREDITÁVEL!',
      '🚨 O ACHADINHO DE CASA MAIS DESEJADO DAS REDES SOCIAIS!',
      '✨ SUA CASA LINDA E FUNCIONAL PAGANDO MUITO MENOS!'
    ],
    slangAndTriggers: [
      'Economia de tempo e energia na cozinha',
      'Qualidade premium que dura anos',
      'O produto mais elogiado do mês para o lar',
      'Praticidade máxima no dia a dia',
      'Garantia oficial do fabricante'
    ],
    ctaPhrase: '👉 FACILITE SUA ROTINA COM DESCONTO AQUI:',
    hashtags: ['#DicasDeCasa', '#AirfryerPromo', '#AchadinhosCasa', '#CozinhaPratica']
  },
  {
    id: 'AUDIO_GADGETS',
    name: 'Áudio & Fones',
    emoji: '🎧',
    badge: '🎧 ÁUDIO & SOM PREMIUM',
    keywords: [
      'fone', 'headphone', 'earbuds', 'airpods', 'jbl', 'caixa de som', 'bluetooth',
      'anulacao de ruido', 'anc', 'soundbar', 'alexa', 'echo dot', 'redmi airdots', 'kz', 'edifier'
    ],
    viralHooks: [
      '🎧 ÁUDIO PREMIUM & GRAVES POTENTES POR PREÇO HISTÓRICO!',
      '🔊 BATEU O MENOR PREÇO DO ANO NA CAIXA / FONE DE SOM!',
      '💥 CANCELAMENTO DE RUÍDO TOP DE LINHA COM SUPER DESCONTO!',
      '⚡ MÚSICA EM ALTA DEFINIÇÃO SEM PAGAR CARO!'
    ],
    slangAndTriggers: [
      'Graves profundos e agudos cristalinos',
      'Isolamento acústico de respeito',
      'Bateria que dura o dia inteiro sem carregar',
      'Resistente à água e ao suor',
      'Perfeito para treinos, viagens e chamadas'
    ],
    ctaPhrase: '👉 OUÇA COM MÁXIMA QUALIDADE PAGANDO MENOS:',
    hashtags: ['#AudioPremium', '#FoneBluetooth', '#CaixaJBL', '#OfertaMusica']
  },
  {
    id: 'FITNESS_SUPPLEMENTS',
    name: 'Fitness & Suplementos',
    emoji: '💪',
    badge: '💪 FITNESS & SUPLEMENTOS',
    keywords: [
      'whey', 'creatina', 'pre treino', 'growth', 'max titanium', 'integralmedica', 'suplemento',
      'academia', 'haltere', 'elastico', 'rolete', 'tenis de corrida', 'nike', 'adidas', 'asics',
      'olympikus', 'garrafa termo', 'coqueteleira', 'massa muscular', 'protein'
    ],
    viralHooks: [
      '💪 SHAPE DE RESPEITO COM A SUPLEMENTAÇÃO MAIS BARATA DO BRASIL!',
      '⚡ CREATINA / WHEY 100% PURO COM DESCONTO FURA-FILA!',
      '🚨 ECONOMIZE DE VERDADE NO SEU PROJETO FITNESS!',
      '🔥 O COMBO PERFEITO DE MÁXIMA PERFORMANCE COM PREÇO DE OCASIÃO!'
    ],
    slangAndTriggers: [
      'Laudo aprovado e pureza garantida',
      'Máxima absorção e rendimento nos treinos',
      'O suplemento indispensável do seu projeto',
      'Estoque renovado com preço de fábrica',
      'Massa magra e recuperação rápida'
    ],
    ctaPhrase: '👉 GARANTA SEU SHAPE COM MÁXIMA ECONOMIA:',
    hashtags: ['#MarombaOfertas', '#WheyPromocao', '#CreatinaPureza', '#ProjetoFitness']
  },
  {
    id: 'BEAUTY_SKINCARE',
    name: 'Beleza & Skincare',
    emoji: '✨',
    badge: '✨ BELEZA & PERFUMARIA',
    keywords: [
      'perfume', 'secador', 'prancha', 'babyliss', 'taiff', 'srum', 'protetor solar', 'la roche',
      'cerave', 'boticario', 'eudora', 'natura', 'maquiagem', 'batom', 'rímel', 'creme', 'shampoo',
      'mascara capilar', 'cabelo', 'skincare', 'hidratante'
    ],
    viralHooks: [
      '✨ SKINCARE & PERFUMARIA DE LUXO COM DESCONTO VIRAL!',
      '💄 O QUERIDINHO DAS BLOGUEIRAS NO MENOR PREÇO DO MÊS!',
      '🌸 PERFUME IMPORTADO / TRATAMENTO CAPILAR POR PECHINCHA!',
      '💖 SUAS MARCAS FAVORITAS DE BELEZA COM ECONOMIA INSANA!'
    ],
    slangAndTriggers: [
      'Pele radiante e cabelo impecável',
      'Fixação absurda e aroma marcante',
      'Recomendado por dermatologistas e cabeleireiros',
      'Toque aveludado e nutrição profunda',
      'Sensação de sair do salão todos os dias'
    ],
    ctaPhrase: '👉 GARANTA SUA ROTINA DE BELEZA AQUI:',
    hashtags: ['#SkincareBrasil', '#PerfumesImportados', '#DicasDeBeleza', '#AchadinhosMake']
  },
  {
    id: 'FASHION_APPAREL',
    name: 'Moda, Calçados & Estilo',
    emoji: '👟',
    badge: '👟 MODA & CALÇADOS',
    keywords: [
      'tenis', 'sapato', 'sandalia', 'chinelo', 'havaianas', 'camiseta', 'camisa', 'calca',
      'jeans', 'vestido', 'jaqueta', 'moletom', 'bolsa', 'mochila', 'relogio', 'oculos',
      'reserva', 'lacoste', 'tommy', 'oakley', 'vans', 'converse', 'all star'
    ],
    viralHooks: [
      '👟 O TÊNIS / LOOKINHO DOS SONHOS EM PROMOÇÃO RELÂMPAGO!',
      '🔥 MARCAS FAMOSAS DE VESTUÁRIO COM DESCONTO SURPREENDENTE!',
      '😎 ESTILO SUPREMO COM PREÇO DE BANANADA!',
      '🚨 RENOVE SEU GUARDA-ROUPA PAGANDO MENOS DA METADE!'
    ],
    slangAndTriggers: [
      'Conforto absurdo para o dia todo',
      'Design moderno que combina com qualquer look',
      'Tecido leve, respirável e de alta durabilidade',
      '100% original e verificado',
      'Edição desejada em estoque promocional'
    ],
    ctaPhrase: '👉 GARANTA SEU LOOK COM O MENOR PREÇO:',
    hashtags: ['#ModaMasculina', '#ModaFeminina', '#TenisPromocao', '#EstiloViral']
  },
  {
    id: 'BABY_KIDS',
    name: 'Bebês & Infantil',
    emoji: '👶',
    badge: '👶 BEBÊS & INFANTIL',
    keywords: [
      'fralda', 'pampers', 'huggies', 'carrinho de bebe', 'cadeirinha', 'berco', 'mamadeira',
      'brinquedo', 'lego', 'boneca', 'barbie', 'hot wheels', 'jogos infantis', 'roupa infantil', 'chupeta'
    ],
    viralHooks: [
      '👶 O MELHOR PARA O SEU BEBÊ COM SUPER ECONOMIA PARA A FAMÍLIA!',
      '🚨 MEGA ESTOQUE DE FRALDAS / BRINQUEDOS EM PROMOÇÃO IMPERDÍVEL!',
      '🧸 O BRINQUEDO QUERIDINHO DA GAROTADA COM DESCONTO ESPECIAL!',
      '💖 CONFORTO, SEGURANÇA E QUALIDADE PAGANDO MUITO MENOS!'
    ],
    slangAndTriggers: [
      'Máxima absorção e proteção de até 12 horas',
      'Aprovado e recomendado por mamães e papais',
      'Desenvolvimento lúdico e segurança infantil',
      'Material hipoalergênico e toque suave',
      'Economia essencial no orçamento da família'
    ],
    ctaPhrase: '👉 COMPRE PARA SEU BEBÊ COM DESCONTO AQUI:',
    hashtags: ['#MamãeEBebe', '#PromoFraldas', '#BrinquedosOferta', '#EconomiaMaternidade']
  },
  {
    id: 'AUTO_TOOLS',
    name: 'Automotivo & Ferramentas',
    emoji: '🛠️',
    badge: '🛠️ AUTOMOTIVO & FERRAMENTAS',
    keywords: [
      'pneu', 'parafusadeira', 'furadeira', 'bosch', 'makita', 'dewalt', 'som automotivo',
      'central multimidia', 'oleo', 'lubrificante', 'capacete', 'moto', 'carro', 'ferramenta',
      'jogo de chaves', 'lavadora de alta pressao', 'karcher', 'politriz'
    ],
    viralHooks: [
      '🛠️ EQUIPAMENTO / ACESSÓRIO BRUTO COM DESCONTO DE RESPEITO!',
      '🚗 O MELHOR PARA O SEU CARRO OU OFICINA PAGANDO MENOS!',
      '⚡ FERRAMENTAS DE ALTA PERFORMANCE COM PREÇO HISTÓRICO!',
      '🚨 ECONOMIZE DE VERDADE NA MANUTENÇÃO E EQUIPAMENTOS!'
    ],
    slangAndTriggers: [
      'Resistência bruta para trabalhos pesados',
      'Garantia profissional e alta durabilidade',
      'Acessório indispensável na garagem',
      'Precisão e eficiência máxima',
      'Avaliação máxima por mecânicos e profissionais'
    ],
    ctaPhrase: '👉 GARANTA COM O MELHOR PREÇO DO MERCADO:',
    hashtags: ['#FerramentasBR', '#AutoOfertas', '#GaragemOficial', '#PromoCarro']
  }
];

export const GENERAL_NICHE: OfferNiche = {
  id: 'GENERAL_DEALS',
  name: 'Achadinhos Gerais & Utilidades',
  emoji: '🔥',
  badge: '🔥 ACHADINHOS & UTILIDADES',
  keywords: [],
  viralHooks: [
    '🔥 ACHADINHO VIRAL COM DESCONTO INACREDITÁVEL!',
    '🚨 OPORTUNIDADE ÚNICA! BATEU O MENOR PREÇO DO MÊS!',
    '⚡ PREÇO FURA-FILA NO PRODUTO MAIS VENDIDO!',
    '💥 OPORTUNIDADE IMPERDÍVEL COM ECONOMIA REAL!'
  ],
  slangAndTriggers: [
    'Custo-benefício sensacional',
    'Procedência verificada e estoque limitado',
    'Sucesso absoluto de vendas no Brasil',
    'Economia garantida no seu bolso',
    'Entrega rápida e compra segura'
  ],
  ctaPhrase: '👉 GARANTA SUA OFERTA COM DESCONTO AQUI:',
  hashtags: ['#AchadinhosVirais', '#PromoçõesDoDia', '#OfertasImbatíveis']
};

/**
 * Intelligent Niche Detection Function
 * Inspects Title, Category, and Description to automatically determine the product specialty.
 */
export function detectProductNiche(
  title: string,
  category?: string,
  description?: string
): OfferNiche {
  const textToAnalyze = `${title || ''} ${category || ''} ${description || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents for matching

  let bestMatch: OfferNiche | null = null;
  let maxScore = 0;

  for (const niche of OFFER_NICHES) {
    let score = 0;
    for (const kw of niche.keywords) {
      const cleanKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (textToAnalyze.includes(cleanKw)) {
        // Longer matching keywords carry higher weights
        score += cleanKw.length > 5 ? 3 : 2;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = niche;
    }
  }

  return bestMatch || GENERAL_NICHE;
}

/**
 * Builds a highly viral, exciting, and niche-specialized copy for WhatsApp
 */
export function buildViralNicheCopy(params: {
  productTitle: string;
  originalPrice: number;
  price: number;
  discountPercentage: number;
  affiliateUrl: string;
  category?: string;
  marketplaceName?: string;
  installments?: string;
  shippingFree?: boolean;
  couponCode?: string;
  rating?: number;
  brandName?: string;
  greetingHeader?: string;
  customCtaPhrase?: string;
  brandSignatureText?: string;
  channelInviteLink?: string;
}): { copy: string; niche: OfferNiche } {
  const niche = detectProductNiche(params.productTitle, params.category);

  const discountAmount = (params.originalPrice - params.price).toFixed(2).replace('.', ',');
  const formattedOrigPrice = params.originalPrice.toFixed(2).replace('.', ',');
  const formattedPrice = params.price.toFixed(2).replace('.', ',');
  const mpName = params.marketplaceName || 'Mercado Livre';

  // Random viral hook from niche
  const randomHook = niche.viralHooks[Math.floor(Math.random() * niche.viralHooks.length)];
  const randomSlang = niche.slangAndTriggers[Math.floor(Math.random() * niche.slangAndTriggers.length)];

  const greeting = params.greetingHeader || '🔥 *IMPORTHOURANDO - ALERTA DE ACHADINHOS VIRAL*';
  const cta = params.customCtaPhrase || niche.ctaPhrase;
  const signature = params.brandSignatureText ? `\n\n${params.brandSignatureText}` : '\n\n⚡ *IMPORTHOURANDO - Garantindo o menor preço para você!*';

  let copy = `${greeting}\n\n`;
  copy += `${niche.badge}\n`;
  copy += `${randomHook}\n\n`;
  copy += `📦 *${params.productTitle}* (${mpName})\n\n`;

  if (params.originalPrice > params.price) {
    copy += `❌ De R$ ${formattedOrigPrice}\n`;
    copy += `✅ Por apenas: *R$ ${formattedPrice}* (${params.discountPercentage}% OFF!)\n`;
    copy += `💸 *Você economiza direto: R$ ${discountAmount}!*\n`;
  } else {
    copy += `✅ Por apenas: *R$ ${formattedPrice}*\n`;
  }

  if (params.installments) {
    copy += `💳 ${params.installments}\n`;
  }

  if (params.shippingFree) {
    copy += `🚚 *FRETE GRÁTIS para todo o Brasil*\n`;
  }

  if (params.couponCode) {
    copy += `🎟️ Cupom de Desconto: *${params.couponCode}* (Copie antes de finalizar!)\n`;
  }

  if (params.rating) {
    copy += `⭐ Avaliação: ${params.rating} de 5 estrelas\n`;
  }

  copy += `\n🎯 *Por que vale a pena neste nicho?*\n`;
  copy += `• ${randomSlang}\n`;
  copy += `• Produto em estoque promocional com procedência verificada\n\n`;

  copy += `${cta}\n`;
  copy += `${params.affiliateUrl}`;

  if (params.channelInviteLink) {
    copy += `\n\n📢 *Receba mais achadinhos virais desse nicho no Canal:* \n👉 ${params.channelInviteLink}`;
  }

  copy += `${signature}\n\n`;
  copy += `${niche.hashtags.join(' ')}`;

  return { copy, niche };
}
