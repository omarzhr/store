# Price Calculation Global State Implementation

## Overview

This document outlines the implementation of a global price calculation state system for the product page. The implementation ensures that price calculations are centralized and shared between the `ProductInfo` and `CheckoutForm` components.

## Architecture

### Context-Based State Management

The implementation uses React Context to provide a global state management solution for price calculations. This approach eliminates prop drilling and ensures all components have access to the same price data.

### File Structure

```
store/src/
├── contexts/
│   └── PriceCalculationContext.tsx     # Global price calculation context
├── components/prodcutsComponents/
│   ├── ProductInfo.tsx                 # Updated to use global context
│   └── StickyAddToCartBar.tsx         # Updated to use global context
└── routes/(public)/products/
    └── $productSlug.tsx               # Updated to provide context
```

## Key Components

### 1. PriceCalculationContext (`/contexts/PriceCalculationContext.tsx`)

**Purpose**: Centralized state management for all price-related calculations

**Key Features**:
- Manages product data, quantity, variants, and pricing
- Automatically calculates variant prices when selections change
- Provides stock status information
- Offers actions to update state (quantity, variants)

**State Properties**:
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
  stockStatus: { inStock: boolean; quantity: number }
}
```

**Available Actions**:
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

### 2. Updated ProductInfo Component

**Changes Made**:
- Removed local state management for price and quantity
- Now uses `usePriceCalculation()` hook to access global state
- Price calculations are handled by the context
- Variant changes update the global state
- Quantity changes update the global state

**Removed Props**:
- `quantity?: number` - Now managed globally

**Benefits**:
- Simplified component logic
- Automatic price updates when variants change
- Consistent pricing across all components

### 3. Updated CheckoutForm Component

**Changes Made**:
- Removed price and quantity props
- Now reads price and quantity from global context
- No longer needs price calculations passed from parent

**Removed Props**:
- `quantity: number`
- `totalPrice: number`

**Benefits**:
- Always displays current price from global state
- Automatic updates when quantity or variants change
- Reduced prop dependencies

### 4. Updated StickyAddToCartBar Component

**Changes Made**:
- Removed price-related props
- Now uses global context for price and quantity data
- Automatic synchronization with ProductInfo changes

**Removed Props**:
- `quantity: number`
- `stockStatus: { inStock: boolean; quantity: number }`
- `totalPrice: number`

### 5. Updated ProductSlug Route

**Changes Made**:
- Wrapped components with `PriceCalculationProvider`
- Removed local price calculation logic
- Simplified component structure
- Removed prop passing for price-related data

## Implementation Benefits

### 1. Single Source of Truth
- All price calculations are managed in one place
- Eliminates inconsistencies between components
- Reduces bugs related to state synchronization

### 2. Improved Maintainability
- Price logic is centralized and easier to modify
- Component code is simplified and more focused
- Easier to add new features or components that need price data

### 3. Better Performance
- Reduces unnecessary prop drilling
- Components only re-render when relevant state changes
- Optimized state updates through context

### 4. Enhanced Developer Experience
- Clear separation of concerns
- Intuitive API for accessing price data
- Type-safe implementation with TypeScript

## Usage Example

```tsx
// In any component within the PriceCalculationProvider
function MyComponent() {
  const {
    quantity,
    totalPrice,
    getCurrentPrice,
    setQuantity,
    selectedVariants,
    setSelectedVariants
  } = usePriceCalculation()

  // Access current price
  const currentPrice = getCurrentPrice()
  
  // Update quantity
  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }
  
  // Price and total are automatically calculated
  return (
    <div>
      <p>Price: ${currentPrice.toFixed(2)}</p>
      <p>Total: ${totalPrice.toFixed(2)}</p>
      <p>Quantity: {quantity}</p>
    </div>
  )
}
```

## Data Flow

1. **Initialization**: Product data is loaded and passed to `initializeProduct()`
2. **Variant Selection**: User selects variants in ProductInfo → `setSelectedVariants()` called → Context calculates new price → All components update
3. **Quantity Change**: User changes quantity → `setQuantity()` called → Total price recalculated → All components update
4. **Checkout**: CheckoutForm reads current price and quantity from context

## Error Handling

- Context provides default values for all state properties
- Graceful handling of missing or invalid product data
- Type safety ensures proper data structure usage
- Error boundaries can be added around the provider if needed

## Future Enhancements

1. **Persistence**: Could add localStorage integration to maintain state across page reloads
2. **Cart Integration**: Easy to extend for cart-wide price calculations
3. **Discount Codes**: Simple to add discount calculation logic to the context
4. **Currency Conversion**: Centralized location for implementing currency features
5. **Price History**: Could track price changes for analytics

## Testing Considerations

- Unit tests for context logic
- Integration tests for component interactions
- Mock the context for component testing
- Test variant price calculations
- Test quantity updates across components

## Migration Summary

This implementation successfully migrates from:
- **Local state management** → **Global context-based state**
- **Prop drilling** → **Direct context access**
- **Scattered price logic** → **Centralized calculations**
- **Manual synchronization** → **Automatic state updates**

The result is a more maintainable, scalable, and reliable price calculation system that provides a consistent experience across all components on the product page.

## Issues Resolved

### Infinite Loop Prevention

During implementation, we encountered a "Maximum update depth exceeded" error caused by infinite loops in the useEffect hooks. This was resolved by:

1. **Separating Core State from Computed Values**: Moved computed values (prices, totals) to `useMemo` hooks instead of storing them in state
2. **Using useCallback for Actions**: Prevented unnecessary re-renders by memoizing action functions
3. **Careful Dependency Management**: Ensured useEffect dependencies don't include values that trigger state updates

### Implementation Changes Made

**Before (Problematic)**:
```typescript
// State included computed values
const [state, setState] = useState({
  // ... core state
  currentVariantPrice: 0,
  totalPrice: 0,
  // ... other computed values
})

// useEffect that caused infinite loops
useEffect(() => {
  setState(prev => ({
    ...prev,
    currentVariantPrice: newPrice,
    totalPrice: newPrice * prev.quantity // This triggered re-renders
  }))
}, [state.quantity, state.variants]) // state.quantity in deps caused loops
```

**After (Fixed)**:
```typescript
// Separate core state from computed values
const [coreState, setCoreState] = useState({
  product: null,
  basePrice: 0,
  quantity: 1,
  selectedVariants: {},
  variantConfig: null
})

// Computed values using useMemo (no infinite loops)
const currentVariantPrice = useMemo(() => {
  return priceCalculation.finalPrice
}, [priceCalculation.finalPrice])

const totalPrice = useMemo(() => {
  return currentVariantPrice * coreState.quantity
}, [currentVariantPrice, coreState.quantity])
```

This approach ensures that:
- State updates are minimal and controlled
- Computed values are automatically updated when dependencies change
- No infinite rendering loops occur
- Performance is optimized through memoization