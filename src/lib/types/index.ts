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