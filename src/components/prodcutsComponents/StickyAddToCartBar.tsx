import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import type { CartesRecord, ProductsResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { useNavigate } from '@tanstack/react-router'
import { usePriceCalculation } from '@/contexts/PriceCalculationContext'
import { generateVariantSku } from '@/lib/variant-utils'

interface StickyAddToCartBarProps {
  product: ProductsResponse
  cartSettings: { cartEnabled: boolean; checkoutEnabled: boolean }
  onQuantityChange: (quantity: number) => void
  isVisible: boolean
}

export function StickyAddToCartBar({
  product,
  cartSettings,
  isVisible
}: StickyAddToCartBarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { quantity, totalPrice, stockStatus, selectedVariants, getCurrentPrice } = usePriceCalculation()

  const handleAddToCart = async () => {
    if (!stockStatus.inStock || quantity > stockStatus.quantity) return

    setIsLoading(true)
    
    try {
      const currentPrice = getCurrentPrice()
      
      // Create cart item with real product data including variants
      const cartData: Partial<CartesRecord> = {
        productId: [product.id],
        productName: product.title,
        quantity: quantity,
        price: currentPrice,
        inStock: stockStatus.inStock,
        selected_variants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
        variantPrice: currentPrice,
        variantSku: Object.keys(selectedVariants).length > 0 ? generateVariantSku(product.sku || product.id, selectedVariants) : undefined
      }

      await pb.collection(Collections.Cartes).create(cartData, {
        requestKey: `add-to-cart-${product.id}-${Date.now()}`
      })

      // Refresh cart count in header
      if ((window as any).refreshCartCount) {
        (window as any).refreshCartCount()
      }
      
      console.log('Added to cart from sticky bar:', {
        productId: product.id,
        productName: product.title,
        quantity,
        price: currentPrice,
        selectedVariants,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyNow = () => {
    if (!stockStatus.inStock || quantity > stockStatus.quantity) return
    // Navigate to checkout page with product info
    navigate({ 
      to: '/checkout',
      search: { 
        product: product.id,
        quantity: quantity.toString(),
        price: getCurrentPrice().toString()
      }
    })
  }

  // Don't show sticky bar when cart is disabled
  if (!isVisible || !cartSettings.cartEnabled) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Product Image and Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img
              src={product.featured_image ? 
                pb.files.getUrl(product, product.featured_image, { thumb: '150x150' }) : 
                (product.images && product.images.length > 0 ? 
                  pb.files.getUrl(product, product.images[0], { thumb: '150x150' }) : 
                  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop'
                )
              }
              alt={product.title}
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium truncate">{product.title}</h4>
              <p className="text-sm font-bold text-primary">
                ${totalPrice.toFixed(2)}
                {quantity > 1 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({quantity} × ${getCurrentPrice().toFixed(2)})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {cartSettings.cartEnabled && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3 font-semibold"
                disabled={!stockStatus.inStock || quantity > stockStatus.quantity || isLoading}
                onClick={handleAddToCart}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            )}

            <Button
              size="sm"
              className="h-10 px-3 font-semibold"
              disabled={!stockStatus.inStock || quantity > stockStatus.quantity}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
