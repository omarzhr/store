import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Package, AlertCircle, Loader2 } from 'lucide-react'
import pb from '@/lib/db'
import { Collections } from '@/lib/types'
import type { OrderItemsResponse, ProductsResponse, OrdersResponse } from '@/lib/types'

interface OrderItemsListProps {
  order: OrdersResponse
  formatPrice: (price: number) => string
}

interface OrderItemWithProduct extends OrderItemsResponse {
  product?: ProductsResponse | null
}

export function OrderItemsList({ order, formatPrice }: OrderItemsListProps) {
  const [orderItems, setOrderItems] = useState<OrderItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!order?.id) return

      setLoading(true)
      setError(null)

      try {
        console.log('🔍 Fetching order items for order:', order.id)

        // Direct query for order items by orderId
        const items = await pb.collection(Collections.OrderItems).getFullList<OrderItemsResponse>({
          filter: `orderId ~ "${order.id}"`,
          sort: 'created',
          requestKey: `order-items-${order.id}-${Date.now()}`
        })

        console.log(`📦 Found ${items.length} order items`)

        // Fetch product details for each item
        const itemsWithProducts: OrderItemWithProduct[] = []
        
        for (const item of items) {
          let product: ProductsResponse | null = null
          
          if (item.products && item.products.length > 0) {
            try {
              product = await pb.collection(Collections.Products).getOne<ProductsResponse>(
                item.products[0],
                { requestKey: `product-${item.products[0]}-${Date.now()}` }
              )
            } catch (productError) {
              console.warn(`⚠️ Could not fetch product ${item.products[0]}:`, productError)
            }
          }

          itemsWithProducts.push({
            ...item,
            product
          })
        }

        setOrderItems(itemsWithProducts)
        console.log('✅ Order items loaded with product details')

      } catch (err) {
        console.error('❌ Failed to fetch order items:', err)
        setError(err instanceof Error ? err.message : 'Failed to load order items')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderItems()
  }, [order?.id])

  const renderVariants = (selectedVariants: any) => {
    if (!selectedVariants) return null

    try {
      const variants = typeof selectedVariants === 'string' 
        ? JSON.parse(selectedVariants) 
        : selectedVariants

      if (typeof variants === 'object' && variants !== null) {
        const variantEntries = Object.entries(variants)
        if (variantEntries.length === 0) return null

        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {variantEntries.map(([key, value], index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {key}: {String(value)}
              </Badge>
            ))}
          </div>
        )
      }
    } catch (error) {
      console.warn('Failed to parse variants:', error)
      return (
        <Badge variant="secondary" className="text-xs">
          Variants: Yes
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="text-xs">
        {String(selectedVariants)}
      </Badge>
    )
  }

  const getProductImage = (item: OrderItemWithProduct) => {
    if (item.product?.featured_image) {
      return pb.files.getUrl(item.product, item.product.featured_image, { thumb: '60x60' })
    }
    if (item.product?.images && item.product.images.length > 0) {
      return pb.files.getUrl(item.product, item.product.images[0], { thumb: '60x60' })
    }
    return null
  }

  const calculateItemTotal = (item: OrderItemWithProduct) => {
    return (item.price || 0) * (item.quantity || 1)
  }

  const calculateOrderTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0)
    return {
      subtotal,
      shipping: order.shipping || 0,
      total: order.total || subtotal + (order.shipping || 0)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading order items...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load order items: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const totals = calculateOrderTotals()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {orderItems.length > 0 ? (
            orderItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 sm:gap-4 p-3 border rounded-lg">
                {/* Product Image */}
                {getProductImage(item) ? (
                  <img
                    src={getProductImage(item)!}
                    alt={item.product?.title || 'Product'}
                    className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gray-200 rounded flex items-center justify-center">
                    <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                )}

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {item.product?.title || 'Unknown Product'}
                  </div>
                  
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Qty: {item.quantity || 1} × {formatPrice(item.price || 0)}
                  </div>

                  {/* Product SKU */}
                  {item.product?.sku && (
                    <div className="text-xs text-muted-foreground mt-1">
                      SKU: {item.product.sku}
                    </div>
                  )}

                  {/* Selected Variants */}
                  {renderVariants(item.selectedVariants)}

                  {/* Product ID for debugging */}
                  {!item.product && item.products && (
                    <div className="text-xs text-red-500 mt-1">
                      Product ID: {item.products[0]} (Product not found)
                    </div>
                  )}
                </div>

                {/* Item Total */}
                <div className="font-medium text-sm">
                  {formatPrice(calculateItemTotal(item))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No order items found</p>
              <p className="text-xs mt-1">Order ID: {order.id}</p>
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <>
            <Separator className="my-4" />

            {/* Order Summary */}
            <div className="space-y-2 max-w-sm ml-auto">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              
              {totals.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(totals.shipping)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(totals.total)}</span>
              </div>

              {/* Discrepancy Warning */}
              {Math.abs(totals.total - (order.total || 0)) > 0.01 && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Calculated total ({formatPrice(totals.total)}) differs from order total ({formatPrice(order.total || 0)})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}