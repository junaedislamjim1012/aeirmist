import { Product, Store, Order } from '../../components/discover/MarketplaceTypes';
import { CartItem } from '../../components/discover/MarketplaceCart';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rate: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BDT: { code: 'BDT', symbol: '৳', rate: 1.0 },
  USD: { code: 'USD', symbol: '$', rate: 1 / 120 },
  EUR: { code: 'EUR', symbol: '€', rate: 1 / 130 },
  GBP: { code: 'GBP', symbol: '£', rate: 1 / 155 },
  JPY: { code: 'JPY', symbol: '¥', rate: 1 / 0.78 },
  AED: { code: 'AED', symbol: 'Dh', rate: 1 / 32.5 },
  INR: { code: 'INR', symbol: '₹', rate: 1 / 1.4 }
};

export const PROMO_CODES: Record<string, { percent: number; freeShipping?: boolean }> = {
  'AEIRMIST25': { percent: 25 },
  'LAUNCH10': { percent: 10 },
  'FREESHIP': { percent: 0, freeShipping: true }
};

export class MarketplaceService {
  formatPrice(bdtAmount: number, currencyCode: string = 'BDT'): string {
    const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.BDT;
    const converted = bdtAmount * config.rate;
    return `${config.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  calculateCartTotals(
    cart: CartItem[],
    couponCode?: string,
    deliveryType: string = 'standard',
    currencyCode: string = 'BDT'
  ) {
    const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.BDT;

    const subtotalBDT = cart.reduce((acc, item) => {
      const price = item.product.discountPrice || item.product.price;
      return acc + price * item.quantity;
    }, 0);

    const cleanCode = couponCode?.trim().toUpperCase() || '';
    const promo = PROMO_CODES[cleanCode] || null;

    const discountAmountBDT = promo ? (subtotalBDT * promo.percent) / 100 : 0;

    let deliveryFeeBDT = 0;
    if (cart.length > 0) {
      if (promo?.freeShipping || cleanCode === 'FREESHIP') {
        deliveryFeeBDT = 0;
      } else {
        const baseFee = deliveryType === 'drone' ? 950 : deliveryType === 'express' ? 350 : 150;
        const uniqueStores = new Set(cart.map(i => i.product.storeName || i.product.storeId)).size;
        deliveryFeeBDT = baseFee + Math.max(0, uniqueStores - 1) * 100;
      }
    }

    const taxAmountBDT = Math.max(0, subtotalBDT - discountAmountBDT) * 0.05;
    const grandTotalBDT = Math.max(0, subtotalBDT - discountAmountBDT + deliveryFeeBDT + taxAmountBDT);

    return {
      subtotalBDT,
      discountAmountBDT,
      deliveryFeeBDT,
      taxAmountBDT,
      grandTotalBDT,
      subtotalFormatted: this.formatPrice(subtotalBDT, currencyCode),
      discountFormatted: this.formatPrice(discountAmountBDT, currencyCode),
      deliveryFeeFormatted: this.formatPrice(deliveryFeeBDT, currencyCode),
      taxFormatted: this.formatPrice(taxAmountBDT, currencyCode),
      grandTotalFormatted: this.formatPrice(grandTotalBDT, currencyCode),
      appliedPromo: promo ? { code: cleanCode, ...promo } : null
    };
  }

  buildTrackingTimeline(currentStatus: Order['currentStatus']) {
    const statuses: Array<{ status: Order['currentStatus']; label: string; desc: string }> = [
      { status: 'processing', label: 'Order Processing', desc: 'Verifying payment and routing node parameters.' },
      { status: 'packed', label: 'Staged & Packed', desc: 'Inventory certified at merchant warehouse.' },
      { status: 'shipped', label: 'Shipped Out', desc: 'Enroute via air cargo transit node.' },
      { status: 'delivered', label: 'Delivered', desc: 'Handed over securely to destination receiver.' }
    ];

    const currentIdx = statuses.findIndex(s => s.status === currentStatus);
    const dateNow = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return statuses.map((item, index) => ({
      status: item.status,
      label: item.label,
      date: index <= currentIdx ? dateNow : '',
      desc: item.desc,
      active: index <= currentIdx
    }));
  }

  validateShippingAddress(address: { fullName: string; addressLine: string; phone: string; city: string; postalCode?: string }) {
    const errors: string[] = [];
    if (!address.fullName.trim()) errors.push('Full recipient name is required.');
    if (!address.addressLine.trim()) errors.push('Street address / location line is required.');
    if (!address.phone.trim()) errors.push('Contact phone number is required.');
    if (!address.city.trim()) errors.push('City / region node is required.');
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const marketplaceService = new MarketplaceService();
