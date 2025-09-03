# Price Calculation Context Test Guide

This file demonstrates how the global price calculation state works across the ProductInfo and CheckoutForm components.

## Overview

The `PriceCalculationContext` provides a centralized state management system for price calculations in the product page. This ensures that both the `ProductInfo` and `CheckoutForm` components use the same price data.

## Key Features

### 1. Global State Management
- **Single Source of Truth**: All price calculations are managed in one place
- **Shared State**: Both ProductInfo and CheckoutForm components use the same price state
- **Automatic Updates**: When variants or quantity change, all components update automatically

### 2. State Properties
```typescript
interface PriceCalculationState {
  product: ProductsResponse | null
  basePrice: number
  quantity: number
  selectedVariants: SelectedVariants
  variantConfig: ProductVariantConfig | null
  currentVariantPrice: number
  totalPrice: number
  priceCalculation: VariantPriceCalculation
  stockStatus: {
    inStock: boolean
    quantity: number
  }
}
```

### 3. Available Actions
```typescript
interface PriceCalculationActions {
  initializeProduct: (product: ProductsResponse) => void
  setQuantity: (quantity: number) => void
  setSelectedVariants: (variants: SelectedVariants) => void
  getCurrentPrice: () => number
  getTotalPrice: () => number
  reset: () => void
}
```

## Implementation Details

### Context Provider
The `PriceCalculationProvider` wraps the entire product page:

```tsx
<PriceCalculationProvider>
  <ProductRouteContent
    product={product}
    relatedProducts={relatedProducts}
    breadcrumbs={breadcrumbs}
    cartSettings={cartSettings}
    checkoutSettings={checkoutSettings}
  />
</PriceCalculationProvider>
```

### ProductInfo Component
- Sets the price state based on variant selections
- Updates quantity through global context
- Displays calculated prices from context

### CheckoutForm Component
- Reads price and quantity from global context
- No longer needs price props passed from parent
- Uses the same price calculations as ProductInfo

## Testing Scenarios

### Scenario 1: Basic Price Display
1. Load a product page
2. Verify ProductInfo shows correct base price
3. Change quantity in ProductInfo
4. Verify CheckoutForm shows updated total price

### Scenario 2: Variant Price Changes
1. Load a product with variants
2. Select different variants in ProductInfo
3. Verify price updates in both ProductInfo and CheckoutForm
4. Change quantity and verify total updates everywhere

### Scenario 3: State Synchronization
1. Change quantity in ProductInfo
2. Verify quantity updates in CheckoutForm
3. Verify total price updates in CheckoutForm
4. Verify StickyAddToCartBar shows correct price

## Benefits

1. **Consistency**: All components always show the same price data
2. **Maintainability**: Price logic is centralized and easier to maintain
3. **Performance**: Reduces prop drilling and unnecessary re-renders
4. **Scalability**: Easy to add new components that need price data

## Usage Example

```tsx
// In any component within the PriceCalculationProvider
const {
  quantity,
  totalPrice,
  getCurrentPrice,
  setQuantity,
  selectedVariants,
  setSelectedVariants
} = usePriceCalculation()

// Price is automatically calculated and updated
const currentPrice = getCurrentPrice()
const total = totalPrice // Already calculated based on quantity
```

## Migration Notes

The migration from local state to global context involved:

1. **Removed Props**: Components no longer receive price/quantity props
2. **Context Usage**: Components now use `usePriceCalculation()` hook
3. **Centralized Logic**: Price calculation logic moved to context
4. **Automatic Updates**: Price updates propagate automatically

This ensures that price calculation is handled consistently across all components and provides a single source of truth for pricing information.