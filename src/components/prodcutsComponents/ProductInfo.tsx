import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Share2 } from 'lucide-react'
import type { ProductsResponse, CategoriesResponse } from '@/lib/types'
import { QuantitySelector } from './QuantitySelector'
import AddToCartButton from './AddToCartButton'

interface ProductInfoProps {
  product: ProductsResponse<{ categories: CategoriesResponse[] }>
  quantity?: number
  cartSettings: { cartEnabled: boolean; checkoutEnabled: boolean }
  onQuantityChange?: (newQuantity: number) => void
}

export function ProductInfo({ 
  product, 
  quantity, 
  cartSettings,
  onQuantityChange 
}: ProductInfoProps) {
  const [internalQuantity, setInternalQuantity] = useState(quantity || 1)
  
  // Use props if provided, otherwise use internal state
  const currentQuantity = quantity !== undefined ? quantity : internalQuantity
  
  // Get current price (no variants, so use base price)
  const getCurrentPrice = () => {
    return product.price
  }
  
  // Calculate total price based on quantity
  const getTotalPrice = () => {
    return getCurrentPrice() * currentQuantity
  }
  
  // Check stock status
  const getStockStatus = () => {
    return { 
      inStock: product.isActive && (product.stockQuantity || 0) > 0, 
      quantity: product.stockQuantity || 0 
    }
  }
  
  const handleQuantityChange = (newQuantity: number) => {
    if (onQuantityChange) {
      onQuantityChange(newQuantity)
    } else {
      setInternalQuantity(newQuantity)
    }
  }
  
  const currentPrice = getCurrentPrice()
  const totalPrice = getTotalPrice()
  const stockStatus = getStockStatus()
  const hasDiscount = product.old_price && product.old_price > currentPrice
  const discountPercentage = hasDiscount && product.old_price
    ? Math.round(((product.old_price - currentPrice) / product.old_price) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="space-y-2">
        {product.expand?.categories && product.expand.categories.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {product.expand.categories[0].name}
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
        {currentQuantity > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="text-lg font-semibold text-primary">
              ${totalPrice.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">
              ({currentQuantity} × ${currentPrice.toFixed(2)})
            </span>
          </div>
        )}
      </div>

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
          quantity={currentQuantity}
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
            quantity={currentQuantity}
            stockStatus={stockStatus}
            totalPrice={totalPrice}
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
          {/* Contact information when cart is disabled */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Interested in this product?</h4>
              <p className="text-gray-600 text-sm mb-3">
                Contact us for pricing and availability information.
              </p>
              <Button className="w-full" size="lg">
                Contact Us
              </Button>
            </CardContent>
          </Card>
          
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
