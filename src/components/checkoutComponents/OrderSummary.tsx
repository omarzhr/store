import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Package } from 'lucide-react'
import { type CartesResponse, type ProductsResponse, type StoresResponse } from '@/lib/types'
import { formatPrice, type CartSummary } from '@/lib/cart-utils'
import pb from '@/lib/db'

interface OrderSummaryProps {
  cartItems: CartesResponse<unknown, { productId: ProductsResponse[] }>[] 
  cartSummary: CartSummary
  storeSettings: StoresResponse | null
}

export function OrderSummary({
  cartItems,
  cartSummary,
  storeSettings
}: OrderSummaryProps) {
  return (
    <div className="sticky top-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cart Items */}
          <div className="space-y-3">
            {cartItems.map((item) => {
              const product = Array.isArray((item.expand as any)?.productId) ? (item.expand as any).productId[0] : (item.expand as any)?.productId
              const price = item.price || product?.price || 0
              
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {product?.featured_image ? (
                      <img
                        src={pb.files.getUrl(product, product.featured_image, { thumb: '60x60' })}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product?.title || item.productName || 'Product'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatPrice(price * (item.quantity || 1), storeSettings?.currency)}
                  </div>
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(cartSummary.subtotal, storeSettings?.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatPrice(cartSummary.shipping, storeSettings?.currency)}</span>
            </div>
            
            {/* Only show tax if enabled */}
            {cartSummary.taxEnabled && (
              <div className="flex justify-between text-sm">
                <span>Tax ({cartSummary.taxRate}%)</span>
                <span>{formatPrice(cartSummary.tax, storeSettings?.currency)}</span>
              </div>
            )}
            
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(cartSummary.total, storeSettings?.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
