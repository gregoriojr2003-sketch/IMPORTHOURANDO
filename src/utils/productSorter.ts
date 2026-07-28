import { MercadoLivreProduct } from '../types';

export type PriorityCriterion =
  | 'DISCOUNT_PERCENT'
  | 'SAVINGS_AMOUNT'
  | 'RATING'
  | 'LOWEST_PRICE'
  | 'FREE_SHIPPING'
  | 'REVIEWS_COUNT';

export interface PriorityOption {
  id: PriorityCriterion;
  label: string;
  badge: string;
  description: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  {
    id: 'DISCOUNT_PERCENT',
    label: 'Maior Porcentagem de Desconto (% OFF)',
    badge: '🔥 Maior % OFF',
    description: 'Prioriza produtos com os maiores cortes percentuais no preço.'
  },
  {
    id: 'SAVINGS_AMOUNT',
    label: 'Maior Economia em Reais (R$ Economizado)',
    badge: '💰 Maior Economia R$',
    description: 'Prioriza ofertas com maior valor absoluto em Reais economizados no bolso.'
  },
  {
    id: 'RATING',
    label: 'Melhor Avaliação / Nota (Estrelas ⭐)',
    badge: '⭐ Maior Nota (4.8-5.0)',
    description: 'Prioriza os produtos mais bem avaliados pelos clientes.'
  },
  {
    id: 'LOWEST_PRICE',
    label: 'Menor Preço Absoluto (R$ Mais Barato)',
    badge: '🏷️ Menor Preço R$',
    description: 'Prioriza as ofertas de menor valor e maior acessibilidade.'
  },
  {
    id: 'FREE_SHIPPING',
    label: 'Prioridade Total para Frete Grátis 🚚',
    badge: '🚚 Frete Grátis 1º',
    description: 'Prioriza produtos com frete grátis sem custo de entrega.'
  },
  {
    id: 'REVIEWS_COUNT',
    label: 'Mais Vendidos / Maior Volume de Avaliações',
    badge: '🔥 Mais Popular',
    description: 'Prioriza os produtos mais comprados e consolidados do mercado.'
  }
];

export function getPriorityOption(id: PriorityCriterion): PriorityOption {
  return PRIORITY_OPTIONS.find(p => p.id === id) || PRIORITY_OPTIONS[0];
}

export function sortProductsByPriorities(
  products: MercadoLivreProduct[],
  p1: PriorityCriterion = 'DISCOUNT_PERCENT',
  p2: PriorityCriterion = 'SAVINGS_AMOUNT',
  p3: PriorityCriterion = 'RATING'
): MercadoLivreProduct[] {
  return [...products].sort((a, b) => {
    // 1st Priority
    const diff1 = compareByCriterion(a, b, p1);
    if (Math.abs(diff1) > 0.0001) return diff1;

    // 2nd Priority (Tie-breaker 1)
    const diff2 = compareByCriterion(a, b, p2);
    if (Math.abs(diff2) > 0.0001) return diff2;

    // 3rd Priority (Tie-breaker 2)
    const diff3 = compareByCriterion(a, b, p3);
    if (Math.abs(diff3) > 0.0001) return diff3;

    return 0;
  });
}

function compareByCriterion(a: MercadoLivreProduct, b: MercadoLivreProduct, criterion: PriorityCriterion): number {
  switch (criterion) {
    case 'DISCOUNT_PERCENT':
      return b.discountPercentage - a.discountPercentage;
    case 'SAVINGS_AMOUNT': {
      const savingsA = a.originalPrice - a.price;
      const savingsB = b.originalPrice - b.price;
      return savingsB - savingsA;
    }
    case 'RATING':
      return b.rating - a.rating;
    case 'LOWEST_PRICE':
      return a.price - b.price;
    case 'FREE_SHIPPING':
      return (b.shippingFree ? 1 : 0) - (a.shippingFree ? 1 : 0);
    case 'REVIEWS_COUNT':
      return b.reviewsCount - a.reviewsCount;
    default:
      return 0;
  }
}
