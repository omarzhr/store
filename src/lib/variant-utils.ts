// Utility functions for product variants
import type { 
  ProductVariantConfig, 
  SelectedVariants, 
  VariantPriceCalculation, 
  VariantAvailability,
  PricingRule 
} from '@/lib/types/variants'

/**
 * Calculate the final price based on selected variants and pricing rules
 */
export function calculateVariantPrice(
  basePrice: number,
  selectedVariants: SelectedVariants,
  config: ProductVariantConfig
): VariantPriceCalculation {
  let totalModifier = 0
  const appliedRules: PricingRule[] = []

  // First, apply individual variant value modifiers
  config.options.forEach((option: any) => {
    const selectedValue = selectedVariants[option.name]
    if (selectedValue) {
      const variantValue = option.values.find((v: any) => v.value === selectedValue)
      if (variantValue?.priceModifier) {
        totalModifier += variantValue.priceModifier
      }
    }
  })

  // Then, apply pricing rules (more complex conditions)
  if (config.pricingRules) {
    config.pricingRules.forEach((rule: any) => {
      const conditionsMet = Object.entries(rule.conditions).every(([optionName, requiredValue]) => {
        return selectedVariants[optionName] === requiredValue
      })

      if (conditionsMet) {
        if (rule.type === 'percentage') {
          totalModifier += basePrice * (rule.priceModifier / 100)
        } else {
          totalModifier += rule.priceModifier
        }
        appliedRules.push(rule)
      }
    })
  }

  const finalPrice = Math.max(0, basePrice + totalModifier) // Ensure price never goes negative

  return {
    basePrice,
    totalModifier,
    finalPrice,
    appliedRules
  }
}

/**
 * Check if a variant combination is available
 */
export function isVariantAvailable(
  selectedVariants: SelectedVariants,
  config: ProductVariantConfig
): VariantAvailability {
  // Check if all required options are selected
  const missingRequired = config.options.filter((option: any) => 
    option.required && !selectedVariants[option.name]
  )

  if (missingRequired.length > 0) {
    return {
      isAvailable: false,
      reason: `Please select: ${missingRequired.map(o => o.name).join(', ')}`
    }
  }

  // Check if selected values are valid and available
  for (const option of config.options) {
    const selectedValue = selectedVariants[option.name]
    if (selectedValue) {
      const variantValue = option.values.find((v: any) => v.value === selectedValue)
      if (!variantValue) {
        return {
          isAvailable: false,
          reason: `Invalid selection for ${option.name}`
        }
      }
      if (variantValue.isAvailable === false) {
        return {
          isAvailable: false,
          reason: `${variantValue.label} is currently unavailable`
        }
      }
    }
  }

  return { isAvailable: true }
}

/**
 * Generate a SKU based on base SKU and selected variants
 */
export function generateVariantSku(
  baseSku: string,
  selectedVariants: SelectedVariants
): string {
  if (!baseSku || Object.keys(selectedVariants).length === 0) {
    return baseSku
  }

  // Create variant suffix from selected values
  const variantParts = Object.entries(selectedVariants)
    .map(([optionName, value]) => {
      // Take first letter of option name and the value
      const optionPrefix = optionName.charAt(0).toUpperCase()
      const cleanValue = String(value).replace(/[^A-Za-z0-9]/g, '').toUpperCase()
      return `${optionPrefix}${cleanValue}`
    })
    .join('-')

  return `${baseSku}-${variantParts}`
}

/**
 * Get default variant selection based on configuration
 */
export function getDefaultVariantSelection(config: ProductVariantConfig): SelectedVariants {
  const defaultSelection: SelectedVariants = {}

  config.options.forEach((option: any) => {
    const defaultValue = option.values.find((v: any) => v.isDefault)
    if (defaultValue) {
      defaultSelection[option.name] = defaultValue.value
    } else if (option.required && option.values.length > 0) {
      // If no default is set but option is required, select first available option
      const firstAvailable = option.values.find((v: any) => v.isAvailable !== false)
      if (firstAvailable) {
        defaultSelection[option.name] = firstAvailable.value
      }
    }
  })

  return defaultSelection
}

/**
 * Validate variant configuration structure
 */
export function validateVariantConfig(config: ProductVariantConfig): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.options || !Array.isArray(config.options)) {
    errors.push('Options must be an array')
    return { isValid: false, errors }
  }

  if (config.options.length === 0) {
    errors.push('At least one variant option is required')
  }

  config.options.forEach((option: any, optionIndex: number) => {
    if (!option.name || typeof option.name !== 'string') {
      errors.push(`Option ${optionIndex + 1}: Name is required and must be a string`)
    }

    if (!option.type || !['select', 'radio', 'swatch'].includes(option.type)) {
      errors.push(`Option ${optionIndex + 1}: Type must be 'select', 'radio', or 'swatch'`)
    }

    if (!option.values || !Array.isArray(option.values) || option.values.length === 0) {
      errors.push(`Option ${optionIndex + 1}: At least one value is required`)
    } else {
      option.values.forEach((value: any, valueIndex: number) => {
        if (!value.id || !value.label || !value.value) {
          errors.push(`Option ${optionIndex + 1}, Value ${valueIndex + 1}: id, label, and value are required`)
        }
      })

      // Check for duplicate value IDs within an option
      const valueIds = option.values.map((v: any) => v.id)
      const duplicateIds = valueIds.filter((id: any, index: number) => valueIds.indexOf(id) !== index)
      if (duplicateIds.length > 0) {
        errors.push(`Option ${optionIndex + 1}: Duplicate value IDs found: ${duplicateIds.join(', ')}`)
      }
    }
  })

  // Check for duplicate option names
  const optionNames = config.options.map((o: any) => o.name)
  const duplicateNames = optionNames.filter((name: any, index: number) => optionNames.indexOf(name) !== index)
  if (duplicateNames.length > 0) {
    errors.push(`Duplicate option names found: ${duplicateNames.join(', ')}`)
  }

  // Validate pricing rules if they exist
  if (config.pricingRules) {
    config.pricingRules.forEach((rule: any, ruleIndex: number) => {
      if (typeof rule.priceModifier !== 'number') {
        errors.push(`Pricing rule ${ruleIndex + 1}: priceModifier must be a number`)
      }

      if (!rule.type || !['fixed', 'percentage'].includes(rule.type)) {
        errors.push(`Pricing rule ${ruleIndex + 1}: type must be 'fixed' or 'percentage'`)
      }

      if (!rule.conditions || typeof rule.conditions !== 'object') {
        errors.push(`Pricing rule ${ruleIndex + 1}: conditions must be an object`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get all possible variant combinations
 */
export function getAllVariantCombinations(config: ProductVariantConfig): SelectedVariants[] {
  if (config.options.length === 0) {
    return [{}]
  }

  function cartesianProduct(arrays: string[][]): string[][] {
    return arrays.reduce((acc, array) => {
      return acc.flatMap(x => array.map(y => [...x, y]))
    }, [[]] as string[][])
  }

  const optionValues = config.options.map((option: any) => 
    option.values.filter((v: any) => v.isAvailable !== false).map((v: any) => v.value)
  )

  const combinations = cartesianProduct(optionValues)

  return combinations.map(combination => {
    const variant: SelectedVariants = {}
    config.options.forEach((option: any, index: number) => {
      variant[option.name] = combination[index]
    })
    return variant
  })
}

/**
 * Format variant selection for display
 */
export function formatVariantSelection(
  selectedVariants: SelectedVariants,
  config: ProductVariantConfig
): string {
  const labels = Object.entries(selectedVariants).map(([optionName, value]) => {
    const option = config.options.find((o: any) => o.name === optionName)
    if (!option) return `${optionName}: ${value}`
    
    const variantValue = option.values.find((v: any) => v.value === value)
    return `${option.name}: ${variantValue?.label || value}`
  })

  return labels.join(', ')
}