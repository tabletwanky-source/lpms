export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
}

export const products: Product[] = [
  {
    id: 'prod_ULCp7koPUiinTr',
    priceId: 'price_1TMWPjRpnzu1xmnIFcy259n0',
    name: 'LMS2',
    description: 'Advanced learning management system with premium features',
    mode: 'subscription',
    price: 20.00,
    currency: 'usd'
  },
  {
    id: 'prod_ULCpjltQS1aonb',
    priceId: 'price_1TMWPRRpnzu1xmnIOkU6X49p',
    name: 'LMS',
    description: 'Standard learning management system with core features',
    mode: 'subscription',
    price: 10.00,
    currency: 'usd'
  }
];

export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};