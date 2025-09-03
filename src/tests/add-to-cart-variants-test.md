# Add to Cart with Variants - Test Documentation

## Overview

This document outlines test cases for the Add to Cart functionality with variant support. The implementation uses a global price calculation context to ensure consistent pricing across all components.

## Test Environment Setup

### Prerequisites
1. Product page with variants configured
2. Global price calculation context active
3. Cart functionality enabled in store settings

### Test Product Requirements
- Product with multiple variant options (e.g., Size, Color, Material)
- Different prices for different variant combinations
- Stock availability for variants

## Test Cases

### 1. Basic Add to Cart without Variants

**Test Steps:**
1. Navigate to a product without variants
2. Set quantity to 2
3. Click "Add to Cart" button
4. Verify cart item creation

**Expected Results:**
- Cart item created with correct product information
- Price matches base product price
- Quantity reflects selected amount
- No variant information stored

**Verification Points:**
```javascript
// Cart data structure
{
  productId: [product.id],
  productName: product.title,
  quantity: 2,
  price: product.price,
  selected_variants: undefined,
  variantPrice: product.price,
  variantSku: undefined
}
```

### 2. Add to Cart with Single Variant

**Test Steps:**
1. Navigate to product with variants (e.g., Size options)
2. Select "Large" size variant
3. Set quantity to 1
4. Click "Add to Cart" button

**Expected Results:**
- Cart item includes selected variant information
- Price reflects variant-specific pricing
- Variant SKU generated correctly
- Global context updates reflected in cart data

**Verification Points:**
```javascript
// Cart data structure
{
  productId: [product.id],
  productName: product.title,
  quantity: 1,
  price: variantCalculatedPrice,
  selected_variants: { size: "large" },
  variantPrice: variantCalculatedPrice,
  variantSku: "PROD123-size-large"
}
```

### 3. Add to Cart with Multiple Variants

**Test Steps:**
1. Navigate to product with multiple variant types
2. Select "Red" color and "Large" size
3. Verify price updates in ProductInfo
4. Set quantity to 3
5. Click "Add to Cart" button

**Expected Results:**
- All selected variants included in cart data
- Price calculation considers all variant modifications
- Complex variant SKU generated
- Quantity multiplied by final variant price

**Verification Points:**
```javascript
// Cart data structure
{
  productId: [product.id],
  productName: product.title,
  quantity: 3,
  price: finalVariantPrice,
  selected_variants: { color: "red", size: "large" },
  variantPrice: finalVariantPrice,
  variantSku: "PROD123-color-red-size-large"
}
```

### 4. Sticky Add to Cart Bar Functionality

**Test Steps:**
1. Navigate to product page
2. Select variants in ProductInfo component
3. Scroll down to trigger sticky bar appearance
4. Verify sticky bar shows correct price
5. Click "Add to Cart" in sticky bar

**Expected Results:**
- Sticky bar displays same price as ProductInfo
- Variant selections from ProductInfo carried over
- Cart item created with identical data to main add to cart
- No loss of variant information

### 5. Price Synchronization Test

**Test Steps:**
1. Load product with variants
2. Change variant selection in ProductInfo
3. Observe price updates in:
   - ProductInfo component
   - CheckoutForm (if cart disabled)
   - StickyAddToCartBar
4. Add to cart and verify price consistency

**Expected Results:**
- All components show identical prices
- Cart data reflects current global context state
- No price discrepancies between components

### 6. Variant Price Calculation Test

**Test Steps:**
1. Select variants with price modifiers:
   - Base price: $50
   - Large size: +$10
   - Premium material: +$25
2. Set quantity to 2
3. Add to cart

**Expected Results:**
- Single item price: $85 ($50 + $10 + $25)
- Total price: $170 (2 × $85)
- Cart data shows $85 as variant price
- Global context totalPrice shows $170

### 7. Stock Validation with Variants

**Test Steps:**
1. Select variant combination with limited stock
2. Set quantity exceeding available stock
3. Attempt to add to cart

**Expected Results:**
- Add to cart button disabled
- Error message displayed
- No cart item created
- Stock status properly validated

### 8. Variant SKU Generation Test

**Test Steps:**
1. Test various variant combinations
2. Verify SKU generation patterns:
   - Single variant: `BASE-type-value`
   - Multiple variants: `BASE-type1-value1-type2-value2`
   - Special characters handled properly

**Expected Results:**
- Consistent SKU format
- Unique SKUs for different combinations
- Proper encoding of variant values

## Edge Cases

### 9. Rapid Variant Changes

**Test Steps:**
1. Quickly change between different variants
2. Immediately add to cart after last change
3. Verify cart data accuracy

**Expected Results:**
- Cart data reflects final variant selection
- No race conditions in price calculation
- Proper state synchronization

### 10. Default Variant Selection

**Test Steps:**
1. Load product page with variants
2. Verify default variant selection
3. Add to cart without changing selections

**Expected Results:**
- Default variants properly selected
- Price calculation includes defaults
- Cart data shows default variant information

## Error Handling Tests

### 11. Invalid Variant Selection

**Test Steps:**
1. Simulate invalid variant combination
2. Attempt to add to cart

**Expected Results:**
- Graceful error handling
- User feedback provided
- No corrupted cart data

### 12. Network Failure Simulation

**Test Steps:**
1. Disconnect network during add to cart
2. Verify error handling

**Expected Results:**
- Proper error message
- Loading state management
- Retry capability

## Performance Tests

### 13. Large Variant Set Performance

**Test Steps:**
1. Test product with many variant options (10+ types)
2. Measure price calculation performance
3. Verify UI responsiveness

**Expected Results:**
- Sub-100ms price calculations
- Smooth UI interactions
- No performance degradation

## Integration Tests

### 14. Cart Integration

**Test Steps:**
1. Add multiple products with variants to cart
2. Navigate to cart page
3. Verify variant information display
4. Test quantity updates in cart

**Expected Results:**
- All variant information preserved
- Accurate pricing in cart
- Proper variant display in cart UI

### 15. Checkout Integration

**Test Steps:**
1. Add product with variants to cart
2. Proceed to checkout
3. Complete order process

**Expected Results:**
- Variant information in order details
- Correct pricing throughout checkout
- Order confirmation includes variants

## Debug Information

### Console Logging
Enable debug mode to verify:
- Price calculation steps
- Variant selection changes
- Cart data creation
- Context state updates

### Expected Debug Output:
```javascript
// When variant selected
"🎨 Variants updated: { color: 'red', size: 'large' }"

// When adding to cart
"AddToCart Debug: {
  productPrice: 50,
  currentPrice: 85,
  selectedVariants: { color: 'red', size: 'large' },
  quantity: 2,
  totalPrice: 170
}"
```

## Success Criteria

All tests must pass with:
- ✅ Correct variant data in cart
- ✅ Accurate price calculations
- ✅ Proper SKU generation
- ✅ State synchronization across components
- ✅ Error handling for edge cases
- ✅ Performance within acceptable limits

## Known Limitations

1. Variant combinations with complex pricing rules may require additional testing
2. Large numbers of variants (50+) should be performance tested
3. International character support in variant names needs validation

This test suite ensures the add to cart functionality works correctly with variants across all components using the global price calculation context.