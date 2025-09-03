
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Heart, Share2 } from 'lucide-react'
import type { ProductsResponse, CategoriesResponse } from '@/lib/types'
import type { SelectedVariants } from '@/lib/types/variants'
import { QuantitySelector } from './QuantitySelector'
import AddToCartButton from './AddToCartButton'
import { VariantSelector } from '@/components/variants/VariantSelector'
import { usePriceCalculation } from '@/contexts/PriceCalculationContext'

interface ProductInfoProps {
  product: ProductsResponse<{ categories: CategoriesResponse[] }>
  cartSettings: { cartEnabled: boolean; checkoutEnabled: boolean }
  onQuantityChange?: (newQuantity: number) => void
}

export function ProductInfo({
  product,
  cartSettings,
  onQuantityChange
}: ProductInfoProps) {
  const {
    quantity,
    selectedVariants,
    variantConfig,
    setQuantity,
    setSelectedVariants,
    getCurrentPrice,
    getTotalPrice,
    stockStatus
  } = usePriceCalculation()

  // Debug: Log variant state to understand what's happening
  console.log('🎯 ProductInfo Debug:', {
    product: product.title,
    hasVariantConfig: !!variantConfig,
    variantConfigOptions: variantConfig?.options?.length || 0,
    selectedVariants,
    selectedVariantsKeys: Object.keys(selectedVariants || {}),
    selectedVariantsCount: Object.keys(selectedVariants || {}).length
  })

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
    if (onQuantityChange) {
      onQuantityChange(newQuantity)
    }
  }

  const handleVariantChange = (variants: SelectedVariants) => {
    console.log('🎨 ProductInfo: Variant selection changed:', variants)
    setSelectedVariants(variants)
  }

  const handlePriceChange = () => {
    // This is called by VariantSelector but we don't need to do anything
    // since price calculation is handled by the global context
  }

  const currentPrice = getCurrentPrice()
  const totalPrice = getTotalPrice()
  const hasDiscount = product.old_price && product.old_price > currentPrice
  const discountPercentage = hasDiscount && product.old_price
    ? Math.round(((product.old_price - currentPrice) / product.old_price) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="space-y-2">
        {(product.expand as { categories?: CategoriesResponse[] })?.categories && (product.expand as { categories?: CategoriesResponse[] }).categories!.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {(product.expand as { categories?: CategoriesResponse[] }).categories![0].name}
          </Badge>
        )}
        <h1 className="text-2xl lg:text-4xl font-bold leading-tight">
          {product.title}
        </h1>
        <p className="text-sm text-gray-600">
          {product.sku && `SKU: ${product.sku}`}
        </p>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-primary">
            ${currentPrice.toFixed(2)}
          </span>
          {hasDiscount && product.old_price && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ${product.old_price.toFixed(2)}
              </span>
              <Badge className="bg-red-500 hover:bg-red-600">
                -{discountPercentage}% OFF
              </Badge>
            </>
          )}
        </div>

        {/* Total Price Display */}
        {quantity > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="text-lg font-semibold text-primary">
              ${totalPrice.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">
              ({quantity} × ${currentPrice.toFixed(2)})
            </span>
          </div>
        )}
      </div>

      {/* Variants Selector */}
      {variantConfig && variantConfig.options.length > 0 && (
        <div className="space-y-4">
          <VariantSelector
            config={variantConfig}
            basePrice={product.price}
            selectedVariants={selectedVariants}
            onVariantChange={handleVariantChange}
            onPriceChange={handlePriceChange}
          />
        </div>
      )}

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          stockStatus.quantity > (product.reorderLevel || 5) ? 'bg-green-500' :
          stockStatus.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
        }`} />
        <span className="text-sm font-medium">
          {stockStatus.quantity > (product.reorderLevel || 5) ? 'In Stock' :
           stockStatus.quantity > 0 ? `Only ${stockStatus.quantity} left!` : 'Out of Stock'}
        </span>
      </div>

      {/* Quantity Selector - Show if in stock */}
      {stockStatus.inStock && (
        <QuantitySelector
          quantity={quantity}
          maxQuantity={stockStatus.quantity}
          onQuantityChange={handleQuantityChange}
          disabled={!stockStatus.inStock}
        />
      )}

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <h3 className="font-semibold">Description</h3>
          <div
            className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Action Buttons or Contact Form */}
      {cartSettings.cartEnabled ? (
        <div className="flex gap-3">
          <AddToCartButton
            product={product}
            cartSettings={cartSettings}
          />
          <Button variant="outline" size="lg" className="h-12 px-4">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-4">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Wishlist and Share buttons */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="lg" className="h-12 px-4">
              <Heart className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Save for Later</span>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-4">
              <Share2 className="w-5 h-5" />
              <span className="ml-2 hidden sm:inline">Share</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
