// Re-export all auto-generated PocketBase types
export * from '../types'

// Export custom variant types
export * from './variants'

// Type aliases for commonly used typed variants
export type {
  ProductWithVariants,
  ProductWithVariantsResponse,
  CartWithVariants,
  CartWithVariantsResponse,
  OrderItemWithVariants,
  OrderItemWithVariantsResponse,
  ProductVariantConfig,
  VariantOption,
  VariantValue,
  SelectedVariants,
  PricingRule,
  VariantSelection,
  VariantPriceCalculation,
  VariantAvailability,
  VariantCalculator
} from './variants'

// Checkout settings interface
export interface CheckoutFieldConfig {
  id: string
  label: string
  required: boolean
  enabled: boolean
  order: number
}

export interface CheckoutSettings {
  fields?: {
    phoneRequired?: boolean
    companyNameEnabled?: boolean
    emailEnabled?: boolean
    addressEnabled?: boolean
    customFields?: string[]
    configurableFields?: CheckoutFieldConfig[]
  }
  appearance?: {
    primaryColor?: string
    buttonText?: string
    submitButtonText?: string
  }
  features?: {
    guestCheckoutEnabled?: boolean
    showOrderSummary?: boolean
    enableCouponCodes?: boolean
  }
  messages?: {
    thankYouMessage?: string
    processingMessage?: string
  }
}

// Notification types
export interface NotificationData {
  id: string
  type: 'new_order' | 'low_stock'
  title: string
  message: string
  timestamp: Date
  read: boolean
  orderId?: string
  productId?: string
  productName?: string
  stockLevel?: number
}