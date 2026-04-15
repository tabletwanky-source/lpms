export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  mode: 'subscription' | 'payment';
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    id: 'prod_ULCp7koPUiinTr',
    priceId: 'price_1TMWPjRpnzu1xmnIFcy259n0',
    name: 'LUMINA BASIC',
    description: 'Essential hotel management features for small properties',
    price: 29.00,
    currency: 'usd',
    mode: 'subscription'
  },
  {
    id: 'prod_ULCpjltQS1aonb',
    priceId: 'price_1TMWPRRpnzu1xmnIOkU6X49p',
    name: 'LUMINA PRO',
    description: 'Advanced features and analytics for growing hotels',
    price: 79.00,
    currency: 'usd',
    mode: 'subscription'
  }
];

export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.priceId === priceId);
}

export function getProductById(productId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find(product => product.id === productId);
}