// Custom variant types for product variants system
// This file contains type definitions that extend the auto-generated PocketBase types

// Main variant configuration structure for products.variants field
export interface ProductVariantConfig {
  options: VariantOption[]
  pricingRules?: PricingRule[]
}

// Individual variant option (e.g., Size, Color, Material)
export interface VariantOption {
  name: string                          // e.g., "Size", "Color", "Material"
  type: 'select' | 'radio' | 'swatch'  // UI display type
  required: boolean                     // Whether this option must be selected
  values: VariantValue[]               // Available values for this option
}

// Individual variant value (e.g., Large, Red, Cotton)
export interface VariantValue {
  id: string                           // Unique identifier (e.g., "size-l", "color-red")
  label: string                        // Display name (e.g., "Large", "Red")
  value: string                        // Actual value (e.g., "L", "#FF0000", "cotton")
  priceModifier?: number              // Price adjustment (+5, -2, etc.)
  image?: string                      // Image URL for swatches/previews
  isDefault?: boolean                 // Whether this is the default selection
  isAvailable?: boolean               // Whether this option is currently available
}

// Pricing rules for dynamic variant pricing
export interface PricingRule {
  conditions: Record<string, string>   // Conditions to match (e.g., {"size": "XL"})
  priceModifier: number               // Price adjustment amount
  type: 'fixed' | 'percentage'        // Type of price modification
  description?: string                // Optional description for admin
}

// Selected variants structure for cart and orders
export interface SelectedVariants {
  [optionName: string]: string        // e.g., {"size": "L", "color": "red"}
}

// Utility types for working with variants
export type VariantSelection = {
  optionName: string
  valueId: string
  value: string
  label: string
  priceModifier?: number
}

// Helper type for calculating variant prices
export interface VariantPriceCalculation {
  basePrice: number
  totalModifier: number
  finalPrice: number
  appliedRules: PricingRule[]
}

// Type for variant availability checking
export interface VariantAvailability {
  isAvailable: boolean
  stockQuantity?: number
  reason?: string // e.g., "Out of stock", "Discontinued"
}

// Extended types that combine PocketBase types with our custom variant types
import type { 
  ProductsRecord, 
  ProductsResponse, 
  CartesRecord, 
  CartesResponse, 
  OrderItemsRecord, 
  OrderItemsResponse 
} from '../types'

// Typed versions of PocketBase records with proper variant typing
export type ProductWithVariants = ProductsRecord<ProductVariantConfig>
export type ProductWithVariantsResponse = ProductsResponse<ProductVariantConfig>

export type CartWithVariants = CartesRecord<SelectedVariants>
export type CartWithVariantsResponse = CartesResponse<SelectedVariants>

export type OrderItemWithVariants = OrderItemsRecord<SelectedVariants>
export type OrderItemWithVariantsResponse = OrderItemsResponse<SelectedVariants>

// Utility functions type definitions
export type VariantCalculator = {
  calculatePrice: (basePrice: number, selectedVariants: SelectedVariants, config: ProductVariantConfig) => VariantPriceCalculation
  isVariantAvailable: (selectedVariants: SelectedVariants, config: ProductVariantConfig) => VariantAvailability
  generateSku: (baseSku: string, selectedVariants: SelectedVariants) => string
}