# Product Variants Guide

This guide explains how to use the product variants feature in your store application.

## Overview

Product variants allow you to offer multiple options for a single product (e.g., different sizes, colors, materials) with optional price modifications. This feature supports:

- Multiple variant options per product (Size, Color, Material, etc.)
- Different UI display types (dropdown, radio buttons, color swatches)
- Price modifiers for specific variants
- Advanced pricing rules based on variant combinations
- Cart and order management with variant selection tracking

## Database Schema

The variants feature uses the existing database schema with these key fields:

### Products Table
- `variants` (JSON): Stores the variant configuration
- `price` (number): Base price used for variant calculations

### Cart Items Table  
- `selected_variants` (JSON): Stores customer's variant selections
- `variantPrice` (number): Final price after variant calculations
- `variantSku` (string): Generated SKU for the variant combination

### Order Items Table
- `selectedVariants` (JSON): Stores the ordered variant selections

## How to Add Variants to Products

### 1. In the Admin Dashboard

1. Go to **Products > Add Product** or edit an existing product
2. Scroll down to the **Product Variants** section
3. Click **Add Option** to create your first variant option

### 2. Configuring Variant Options

For each variant option, configure:

- **Option Name**: e.g., "Size", "Color", "Material"
- **Display Type**:
  - **Dropdown**: Traditional select dropdown
  - **Radio Buttons**: Radio button selection with labels
  - **Color/Image Swatches**: Visual swatches for colors or images
- **Required**: Whether customers must select this option
- **Values**: The available choices for this option

### 3. Setting Up Variant Values

For each value in an option:

- **Label**: Display name (e.g., "Large", "Red", "Cotton")
- **Value**: Internal value (e.g., "L", "#FF0000", "cotton")
- **Price Modifier**: Additional cost (+5) or discount (-2) for this variant
- **Color/Image**: For swatch display types, use hex colors (#FF0000) or image URLs
- **Default**: Mark as the default selection for this option

### 4. Example Configuration

```json
{
  "options": [
    {
      "name": "Size",
      "type": "select",
      "required": true,
      "values": [
        {
          "id": "size-s",
          "label": "Small",
          "value": "S",
          "isDefault": true
        },
        {
          "id": "size-l", 
          "label": "Large",
          "value": "L",
          "priceModifier": 5
        }
      ]
    },
    {
      "name": "Color",
      "type": "swatch", 
      "required": true,
      "values": [
        {
          "id": "color-red",
          "label": "Red",
          "value": "#FF0000"
        },
        {
          "id": "color-blue", 
          "label": "Blue",
          "value": "#0000FF"
        }
      ]
    }
  ]
}
```

## Advanced Pricing Rules

You can create complex pricing rules based on variant combinations:

### 1. Adding Pricing Rules

1. In the variant configuration, scroll to **Advanced Pricing Rules**
2. Click **Add Rule**
3. Configure the rule:
   - **Price Modifier**: Amount to add/subtract
   - **Type**: Fixed amount or percentage
   - **Conditions**: Which variant combinations trigger this rule

### 2. Example Pricing Rule

```json
{
  "conditions": {"Size": "XL", "Color": "Red"},
  "priceModifier": 10,
  "type": "fixed",
  "description": "XL Red variant surcharge"
}
```

This rule adds $10 when both Size=XL and Color=Red are selected.

## Customer Experience

### Product Page

Customers will see:
1. Variant selectors based on your configuration
2. Real-time price updates as they select options
3. Stock status per variant combination
4. Selected variant summary

### Cart & Checkout

- Cart items display selected variants
- Pricing reflects variant calculations
- Order confirmation includes variant details

## Display Types

### Dropdown (select)
```typescript
{
  "name": "Size",
  "type": "select",
  "required": true,
  "values": [...]
}
```

### Radio Buttons (radio)
```typescript
{
  "name": "Material", 
  "type": "radio",
  "required": false,
  "values": [...]
}
```

### Color/Image Swatches (swatch)
```typescript
{
  "name": "Color",
  "type": "swatch", 
  "required": true,
  "values": [
    {
      "id": "red",
      "label": "Red", 
      "value": "#FF0000"  // Hex color
    },
    {
      "id": "pattern", 
      "label": "Floral Pattern",
      "value": "pattern1",
      "image": "https://example.com/pattern.jpg"  // Image URL
    }
  ]
}
```

## Pricing Logic

The system calculates variant prices using this hierarchy:

1. **Base Price**: Product's default price
2. **Variant Value Modifiers**: Individual price adjustments per variant value
3. **Pricing Rules**: Complex rules based on variant combinations
4. **Final Price**: Base price + all applicable modifiers

### Example Calculation

- Base price: $20
- Size "Large" modifier: +$5
- Color "Premium" modifier: +$3
- Rule: Large + Premium = +$2 additional
- **Final price: $30** ($20 + $5 + $3 + $2)

## API Usage

### TypeScript Types

```typescript
import type { 
  ProductVariantConfig,
  SelectedVariants, 
  VariantPriceCalculation 
} from '@/lib/types/variants'
```

### Utility Functions

```typescript
import { 
  calculateVariantPrice,
  isVariantAvailable,
  generateVariantSku,
  getDefaultVariantSelection
} from '@/lib/variant-utils'

// Calculate price for selected variants
const calculation = calculateVariantPrice(basePrice, selectedVariants, config)

// Check if variant combination is available  
const availability = isVariantAvailable(selectedVariants, config)

// Generate SKU for variant
const sku = generateVariantSku(baseSku, selectedVariants)
```

## Best Practices

### 1. Option Naming
- Use clear, customer-friendly names
- Be consistent across products
- Consider translation if supporting multiple languages

### 2. Value Organization
- Set logical defaults for required options
- Order values sensibly (S, M, L, XL)
- Use descriptive labels

### 3. Pricing Strategy
- Keep price modifiers reasonable
- Use pricing rules for complex combinations
- Test pricing logic thoroughly

### 4. Visual Design
- Use swatches for colors and patterns
- Consider radio buttons for 2-4 options
- Use dropdowns for many options

## Troubleshooting

### Common Issues

1. **Variants not showing**: Check that variant config is properly saved in the product
2. **Price not updating**: Verify price modifiers and rules are correctly configured
3. **Cart issues**: Ensure variant selection is being passed to cart functions

### Debug Tools

Use browser console to inspect:
```javascript
// Check variant configuration
console.log(product.variants)

// Check selected variants
console.log(selectedVariants)

// Check price calculation
console.log(priceCalculation)
```

## Migration

If you have existing products without variants:
1. Products without variant configuration work normally
2. Existing cart items without variants remain functional
3. Add variants to products gradually as needed

## Support

The variant system is fully integrated with:
- ✅ Product creation and editing
- ✅ Product display pages
- ✅ Shopping cart
- ✅ Checkout process
- ✅ Order management
- ✅ Price calculations
- ✅ SKU generation

For technical support or feature requests, check the component files:
- `src/components/variants/VariantConfig.tsx` - Admin configuration
- `src/components/variants/VariantSelector.tsx` - Customer selection
- `src/components/variants/VariantDisplay.tsx` - Cart/order display
- `src/lib/variant-utils.ts` - Utility functions