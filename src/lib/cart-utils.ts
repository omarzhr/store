import type { CartesResponse, ProductsResponse, StoresResponse } from '@/lib/types'

export interface CartSummary {
  subtotal: number
  shipping: number
  tax: number
  total: number
  itemCount: number
  taxEnabled: boolean
  taxRate: number
}

export function calculateCartSummary(
  cartItems: CartesResponse<unknown, { productId: ProductsResponse[] }>[],
  storeSettings: StoresResponse | null,
  shippingCost: number = 0
): CartSummary {
  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const product = Array.isArray(item.expand?.productId) ? item.expand.productId[0] : item.expand?.productId
    const price = item.price || product?.price || 0
    return sum + (price * (item.quantity || 1))
  }, 0)

  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)

  // Get tax settings from store configuration
  const checkoutSettings = storeSettings?.checkoutSettings as any
  const taxEnabled = checkoutSettings?.taxEnabled || false
  const storeTaxRate = checkoutSettings?.taxRate || storeSettings?.taxRate || 0

  // Calculate tax only if enabled
  const tax = taxEnabled ? (subtotal * storeTaxRate / 100) : 0
  const total = subtotal + shippingCost + tax

  return {
    subtotal,
    shipping: shippingCost,
    tax,
    total,
    itemCount,
    taxEnabled,
    taxRate: storeTaxRate
  }
}

export function formatPrice(amount: number, currency: string = 'MAD'): string {
  const symbols: Record<string, string> = {
    'MAD': 'DH', 'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$', 'AUD': 'A$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
  }
  const symbol = symbols[currency] || 'DH'
  
  if (currency === 'MAD') {
    return `${amount.toFixed(2)} ${symbol}`
  }
  return `${symbol}${amount.toFixed(2)}`
}
