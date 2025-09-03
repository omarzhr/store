import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { ProductsResponse } from '@/lib/types'
import type { SelectedVariants, VariantPriceCalculation, ProductVariantConfig } from '@/lib/types/variants'
import { getDefaultVariantSelection, calculateVariantPrice } from '@/lib/variant-utils'

interface PriceCalculationState {
  // Base product data
  product: ProductsResponse | null
  basePrice: number
  
  // Quantity state
  quantity: number
  
  // Variant state
  selectedVariants: SelectedVariants
  variantConfig: ProductVariantConfig | null
  
  // Price calculation results (computed)
  currentVariantPrice: number
  totalPrice: number
  priceCalculation: VariantPriceCalculation
  
  // Stock information (computed)
  stockStatus: {
    inStock: boolean
    quantity: number
  }
}

interface PriceCalculationActions {
  // Initialize with product data
  initializeProduct: (product: ProductsResponse) => void
  
  // Update quantity
  setQuantity: (quantity: number) => void
  
  // Update selected variants
  setSelectedVariants: (variants: SelectedVariants) => void
  
  // Get current prices
  getCurrentPrice: () => number
  getTotalPrice: () => number
  
  // Reset state
  reset: () => void
}

type PriceCalculationContextType = PriceCalculationState & PriceCalculationActions

interface PriceCalculationCoreState {
  product: ProductsResponse | null
  basePrice: number
  quantity: number
  selectedVariants: SelectedVariants
  variantConfig: ProductVariantConfig | null
}

const initialCoreState: PriceCalculationCoreState = {
  product: null,
  basePrice: 0,
  quantity: 1,
  selectedVariants: {},
  variantConfig: null
}

const PriceCalculationContext = createContext<PriceCalculationContextType | undefined>(undefined)

interface PriceCalculationProviderProps {
  children: ReactNode
}

export function PriceCalculationProvider({ children }: PriceCalculationProviderProps) {
  const [coreState, setCoreState] = useState<PriceCalculationCoreState>(initialCoreState)

  // Memoized price calculation
  const priceCalculation = useMemo((): VariantPriceCalculation => {
    if (!coreState.variantConfig || Object.keys(coreState.selectedVariants).length === 0) {
      return {
        basePrice: coreState.basePrice,
        totalModifier: 0,
        finalPrice: coreState.basePrice,
        appliedRules: []
      }
    }

    const calculation = calculateVariantPrice(
      coreState.basePrice, 
      coreState.selectedVariants, 
      coreState.variantConfig
    )
    


    return calculation
  }, [coreState.basePrice, coreState.selectedVariants, coreState.variantConfig])

  // Memoized current variant price
  const currentVariantPrice = useMemo(() => {
    return priceCalculation.finalPrice
  }, [priceCalculation.finalPrice])

  // Memoized total price
  const totalPrice = useMemo(() => {
    return currentVariantPrice * coreState.quantity
  }, [currentVariantPrice, coreState.quantity])

  // Memoized stock status
  const stockStatus = useMemo(() => {
    if (!coreState.product) {
      return { inStock: false, quantity: 0 }
    }
    return {
      inStock: coreState.product.isActive && (coreState.product.stockQuantity || 0) > 0,
      quantity: coreState.product.stockQuantity || 0
    }
  }, [coreState.product])

  // Initialize product data
  const initializeProduct = useCallback((product: ProductsResponse) => {
    const variantConfig: ProductVariantConfig | null = product.variants 
      ? (typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants)
      : null

    const defaultVariants = variantConfig ? getDefaultVariantSelection(variantConfig) : {}
    
    setCoreState({
      product,
      basePrice: product.price,
      quantity: 1,
      variantConfig,
      selectedVariants: defaultVariants
    })
  }, [])

  // Update quantity
  const setQuantity = useCallback((quantity: number) => {
    const newQuantity = Math.max(1, quantity)
    
    setCoreState(prevState => ({
      ...prevState,
      quantity: newQuantity
    }))
  }, [])

  // Update selected variants
  const setSelectedVariants = useCallback((variants: SelectedVariants) => {
    setCoreState(prevState => ({
      ...prevState,
      selectedVariants: variants
    }))
  }, [])

  // Get current price (memoized function)
  const getCurrentPrice = useCallback(() => {
    return currentVariantPrice
  }, [currentVariantPrice])

  // Get total price (memoized function)
  const getTotalPrice = useCallback(() => {
    return totalPrice
  }, [totalPrice])

  // Reset state
  const reset = useCallback(() => {
    setCoreState(initialCoreState)
  }, [])

  // Combine all state and actions
  const contextValue: PriceCalculationContextType = useMemo(() => {
    return {
      // Core state
      ...coreState,
      
      // Computed values
      currentVariantPrice,
      totalPrice,
      priceCalculation,
      stockStatus,
      
      // Actions
      initializeProduct,
      setQuantity,
      setSelectedVariants,
      getCurrentPrice,
      getTotalPrice,
      reset
    }
  }, [
    coreState,
    currentVariantPrice,
    totalPrice,
    priceCalculation,
    stockStatus,
    initializeProduct,
    setQuantity,
    setSelectedVariants,
    getCurrentPrice,
    getTotalPrice,
    reset
  ])

  return (
    <PriceCalculationContext.Provider value={contextValue}>
      {children}
    </PriceCalculationContext.Provider>
  )
}

export function usePriceCalculation() {
  const context = useContext(PriceCalculationContext)
  if (context === undefined) {
    throw new Error('usePriceCalculation must be used within a PriceCalculationProvider')
  }
  return context
}

export default PriceCalculationContext