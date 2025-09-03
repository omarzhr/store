import { Button } from "@/components/ui/button";
import pb from "@/lib/db";
import { Collections, type CartesRecord, type ProductsResponse } from "@/lib/types";
import type { SelectedVariants, VariantPriceCalculation } from "@/lib/types/variants";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";
import { generateVariantSku } from "@/lib/variant-utils";

export default function AddToCartButton({
  product,
  quantity,
  stockStatus,
  totalPrice,
  cartSettings,
  selectedVariants = {},
  variantPrice,
  priceCalculation
}: {
  product: ProductsResponse
  quantity: number
  stockStatus: { inStock: boolean; quantity: number }
  totalPrice: number
  cartSettings: { cartEnabled: boolean; checkoutEnabled: boolean }
  selectedVariants?: SelectedVariants
  variantPrice?: number
  priceCalculation?: VariantPriceCalculation
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const handleAddToCart = async () => {
    if (!stockStatus.inStock || quantity > stockStatus.quantity) return

    setIsLoading(true)
    
    try {
      console.log('AddToCart Debug:', {
        productPrice: product.price,
        variantPrice,
        selectedVariants,
        quantity,
        totalPrice
      })
      
      const cartData: Partial<CartesRecord> = {
        productId: [product.id],
        productName: product.title,
        productImage: product.featured_image ? [product.featured_image] : 
                     (product.images && product.images.length > 0 ? [product.images[0]] : []),
        quantity: quantity,
        price: variantPrice || product.price,
        inStock: stockStatus.inStock,
        selected_variants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
        variantPrice: variantPrice || product.price,
        variantSku: Object.keys(selectedVariants).length > 0 ? generateVariantSku(product.sku || product.id, selectedVariants) : undefined
      }

      await pb.collection(Collections.Cartes).create(cartData, {
        requestKey: `add-to-cart-${product.id}-${Date.now()}`
      })

      if ((window as any).refreshCartCount) {
        (window as any).refreshCartCount()
      }
      
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyNow = () => {
    if (!stockStatus.inStock || quantity > stockStatus.quantity) return
    setShowCheckout(true)
  }

  return (
    <>
      <div className="flex gap-3 flex-1">
        <Button
          size="lg"
          variant="outline"
          className="flex-1 h-12 font-semibold"
          disabled={!stockStatus.inStock || quantity > stockStatus.quantity || isLoading}
          onClick={handleAddToCart}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>

        {cartSettings.checkoutEnabled && (
          <Button
            size="lg"
            className="flex-1 h-12 font-semibold"
            disabled={!stockStatus.inStock || quantity > stockStatus.quantity}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        )}
      </div>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        product={product}
        quantity={quantity}
        selectedVariants={selectedVariants}
        variantPrice={variantPrice}
        priceCalculation={priceCalculation}
      />
    </>
  )
}