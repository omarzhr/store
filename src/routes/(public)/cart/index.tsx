import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import type { CartesResponse, ProductsResponse, StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { calculateCartSummary, formatPrice, type CartSummary } from '@/lib/cart-utils'

export const Route = createFileRoute('/(public)/cart/')({
  loader: async () => {
    const [cartItems, storeSettings] = await Promise.all([
      pb.collection(Collections.Cartes).getFullList<CartesResponse<{ 
        productId: ProductsResponse[] 
      }>>(50, {
        expand: 'productId',
        sort: '-created',
        requestKey: `cart-items-${Date.now()}`
      }),
      pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-cart-${Date.now()}`
      }).catch(() => null)
    ])

    // Parse checkout settings
    const settings = storeSettings?.checkoutSettings ? 
      (typeof storeSettings.checkoutSettings === 'string' ? 
        JSON.parse(storeSettings.checkoutSettings) : 
        storeSettings.checkoutSettings) : {}

    return { 
      cartItems, 
      storeSettings,
      cartEnabled: storeSettings?.is_cart_enabled ?? false,
      checkoutEnabled: settings.checkoutEnabled ?? true
    }
  },
  component: RouteComponent,
})

// Remove Item Confirmation Modal Component
function RemoveItemModal({ 
  item, 
  onConfirm,
  storeSettings
}: { 
  item: CartesResponse<{ productId: ProductsResponse[] }>
  onConfirm: () => void
  storeSettings: StoresResponse | null
}) {
  const product = Array.isArray(item.expand?.productId) ? item.expand.productId[0] : item.expand?.productId
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 lg:h-9 lg:w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md mx-4 lg:mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base lg:text-lg">Remove item from cart?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm lg:text-base">
            Are you sure you want to remove "{item.productName || product?.title || 'this item'}" from your cart? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Product Preview in Modal */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg my-2">
          {product?.featured_image && (
            <img
              src={pb.files.getUrl(product, product.featured_image, { thumb: '100x100' })}
              alt={item.productName || product.title}
              className="w-12 h-12 object-cover rounded border"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{item.productName || product?.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Qty: {item.quantity}</span>
              <span>•</span>
              <span>{formatPrice((item.price || product?.price || 0) * (item.quantity || 1), storeSettings?.currency)}</span>
            </div>
          </div>
        </div>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Keep in cart
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            Remove item
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Clear Cart Confirmation Modal Component
function ClearCartModal({ 
  itemCount, 
  onConfirm 
}: { 
  itemCount: number
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="text-red-600 hover:text-red-800 underline text-sm">
          Clear cart
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md mx-4 lg:mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base lg:text-lg">Clear entire cart?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm lg:text-base">
            Are you sure you want to remove all {itemCount} {itemCount === 1 ? 'item' : 'items'} from your cart? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Keep items
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            Clear cart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Cart Item Component
function CartItem({ 
  item, 
  onQuantityChange, 
  onRemove,
  storeSettings
}: { 
  item: CartesResponse<{ productId: ProductsResponse[] }>
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  storeSettings: StoresResponse | null
}) {
  const product = Array.isArray(item.expand?.productId) ? item.expand.productId[0] : item.expand?.productId
  const price = item.price || product?.price || 0
  const quantity = item.quantity || 1
  
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(item.id, quantity - 1)
    }
  }

  const handleIncrease = () => {
    onQuantityChange(item.id, quantity + 1)
  }

  const itemTotal = price * quantity
  
  // Get product image
  const getProductImage = () => {
    if (product?.featured_image) {
      return pb.files.getUrl(product, product.featured_image, { thumb: '200x200' })
    }
    if (product?.images && product.images.length > 0) {
      return pb.files.getUrl(product, product.images[0], { thumb: '200x200' })
    }
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop'
  }

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 lg:p-6">
        <div className="flex gap-3 lg:gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img
              src={getProductImage()}
              alt={item.productName || product?.title || 'Product'}
              className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-md border hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => product && window.open(`/products/${product.id}`, '_blank')}
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2 lg:mb-3">
              <h3 className="font-medium text-sm lg:text-base line-clamp-2 leading-tight hover:text-primary cursor-pointer transition-colors"
                  onClick={() => product && window.open(`/products/${product.id}`, '_blank')}>
                {item.productName || product?.title || 'Product'}
              </h3>
              <RemoveItemModal 
                item={item} 
                onConfirm={() => onRemove(item.id)} 
                storeSettings={storeSettings}
              />
            </div>

            {/* Stock Status */}
            {product && (
              <div className="flex items-center gap-1 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  (product.stockQuantity || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-600">
                  {(product.stockQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            )}

            {/* Price and Quantity - Desktop Layout */}
            <div className="hidden lg:flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">
                    {formatPrice(price, storeSettings?.currency)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Item total: {formatPrice(itemTotal, storeSettings?.currency)}
                </div>
              </div>

              {/* Quantity Controls - Desktop */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Qty:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
                    onClick={handleDecrease}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <span className="px-4 py-2 text-sm font-medium min-w-[50px] text-center border-l border-r border-gray-300">
                    {quantity}
                  </span>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
                    onClick={handleIncrease}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Price and Quantity - Mobile Layout */}
            <div className="flex justify-between items-end lg:hidden">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {formatPrice(price, storeSettings?.currency)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Total: {formatPrice(itemTotal, storeSettings?.currency)}
                </div>
              </div>

              {/* Quantity Controls - Mobile */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none border-0"
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                
                <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center border-l border-r border-gray-300">
                  {quantity}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none border-0"
                  onClick={handleIncrease}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty Cart Component
function EmptyCart() {
  const navigate = useNavigate()
  
  return (
    <div className="text-center py-12 lg:py-20">
      <ShoppingBag className="w-16 h-16 lg:w-24 lg:h-24 text-gray-300 mx-auto mb-4 lg:mb-6" />
      <h2 className="text-xl lg:text-2xl font-semibold text-gray-600 mb-2 lg:mb-4">Your cart is empty</h2>
      <p className="text-gray-500 mb-6 lg:mb-8 lg:text-lg">Add some products to get started</p>
      <Button 
        size="lg" 
        className="lg:h-12 lg:px-8 lg:text-base"
        onClick={() => navigate({ to: '/products' })}
      >
        Continue Shopping
      </Button>
    </div>
  )
}

function RouteComponent() {
  const { cartItems: initialCartItems, storeSettings, cartEnabled, checkoutEnabled } = Route.useLoaderData()
  const navigate = useNavigate()
  
  // Local state for cart items
  const [cartItems, setCartItems] = useState(initialCartItems)
  const [cartSummary, setCartSummary] = useState(() => 
    calculateCartSummary(initialCartItems, storeSettings)
  )
  const [removedItem, setRemovedItem] = useState<CartesResponse<{ productId: ProductsResponse[] }> | null>(null)
  const [showUndoAlert, setShowUndoAlert] = useState(false)

  // Update cart summary when cart items change
  useEffect(() => {
    setCartSummary(calculateCartSummary(cartItems, storeSettings))
  }, [cartItems, storeSettings])

  // Listen for tax settings changes
  useEffect(() => {
    const handleTaxChange = (event: CustomEvent) => {
      // Recalculate cart summary when tax settings change
      const updatedStoreSettings = {
        ...storeSettings,
        checkoutSettings: {
          ...(storeSettings?.checkoutSettings as any || {}),
          taxEnabled: event.detail.taxEnabled,
          taxRate: event.detail.taxRate
        }
      } as StoresResponse
      
      setCartSummary(calculateCartSummary(cartItems, updatedStoreSettings))
    }

    window.addEventListener('taxSettingsChanged', handleTaxChange as EventListener)
    return () => window.removeEventListener('taxSettingsChanged', handleTaxChange as EventListener)
  }, [cartItems, storeSettings])

  const handleQuantityChange = async (id: string, quantity: number) => {
    try {
      await pb.collection(Collections.Cartes).update(id, { quantity }, {
        requestKey: `update-cart-quantity-${id}-${Date.now()}`
      })
      const newItems = cartItems.map((item) => 
        item.id === id ? { ...item, quantity } : item
      )
      setCartItems(newItems)
      
      // Refresh cart count in header
      if ((window as any).refreshCartCount) {
        (window as any).refreshCartCount()
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const handleRemoveItem = async (id: string) => {
    try {
      const itemToRemove = cartItems.find((item) => item.id === id)
      if (itemToRemove) {
        setRemovedItem(itemToRemove)
        await pb.collection(Collections.Cartes).delete(id, {
          requestKey: `delete-cart-item-${id}-${Date.now()}`
        })
        const newItems = cartItems.filter((item) => item.id !== id)
        setCartItems(newItems)
        setShowUndoAlert(true)
        
        // Refresh cart count in header
        if ((window as any).refreshCartCount) {
          (window as any).refreshCartCount()
        }
        
        // Auto-hide undo alert after 5 seconds
        setTimeout(() => {
          setShowUndoAlert(false)
          setRemovedItem(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const handleUndoRemove = async () => {
    if (removedItem) {
      try {
        // Re-create the item in PocketBase
        const product = Array.isArray(removedItem.expand?.productId) ? removedItem.expand.productId[0] : removedItem.expand?.productId
        await pb.collection(Collections.Cartes).create({
          productId: product?.id,
          productName: removedItem.productName,
          quantity: removedItem.quantity,
          price: removedItem.price,
          inStock: removedItem.inStock
        }, {
          requestKey: `restore-cart-item-${Date.now()}`
        })
        
        // Reload cart items
        const updatedItems = await pb.collection(Collections.Cartes).getFullList<CartesResponse<{ 
          productId: ProductsResponse[] 
        }>>(50, {
          expand: 'productId',
          sort: '-created',
          requestKey: `reload-cart-${Date.now()}`
        })
        
        setCartItems(updatedItems)
        setRemovedItem(null)
        setShowUndoAlert(false)
        
        // Refresh cart count in header
        if ((window as any).refreshCartCount) {
          (window as any).refreshCartCount()
        }
      } catch (error) {
        console.error('Failed to undo remove:', error)
      }
    }
  }

  // Clear cart function with confirmation
  const clearCart = async () => {
    try {
      // Delete all cart items
      for (const item of cartItems) {
        await pb.collection(Collections.Cartes).delete(item.id, {
          requestKey: `clear-cart-${item.id}-${Date.now()}`
        })
      }
      setCartItems([])
      
      // Refresh cart count in header
      if ((window as any).refreshCartCount) {
        (window as any).refreshCartCount()
      }
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  // Redirect if cart is disabled
  if (!cartEnabled) {
    navigate({ to: '/products' })
    return null
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <EmptyCart />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-12">
        {/* Undo Alert */}
        {showUndoAlert && removedItem && (
          <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-8 lg:w-96 z-50">
            <Alert className="bg-gray-900 text-white border-gray-700">
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">
                  Removed "{(removedItem.productName || 'item').length > 20 
                    ? (removedItem.productName || 'item').substring(0, 20) + '...' 
                    : (removedItem.productName || 'item')}" from cart
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-gray-800 h-8 px-3 ml-2"
                  onClick={handleUndoRemove}
                >
                  Undo
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 lg:mb-8">
          <Button variant="ghost" size="sm" className="lg:h-10 lg:px-4" onClick={() => navigate({ to: '/products' })}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">Continue Shopping</span>
            <span className="lg:hidden">Back</span>
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <div className="hidden lg:block text-sm text-gray-500">
            ({cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'item' : 'items'})
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-8">
            <div className="space-y-0">
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  storeSettings={storeSettings}
                />
              ))}
            </div>
            
            {/* Continue Shopping Link - Desktop */}
            <div className="hidden lg:block mt-8">
              <Button variant="outline" onClick={() => navigate({ to: '/products' })}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cartSummary.itemCount} items)</span>
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
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(cartSummary.total, storeSettings?.currency)}</span>
                  </div>
                </div>

                {checkoutEnabled ? (
                  <Button 
                    onClick={() => navigate({ to: '/checkout' })}
                    className="w-full h-12"
                    disabled={cartItems.length === 0}
                  >
                    Proceed to Checkout
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 text-center">
                        <strong>Checkout is currently disabled</strong>
                      </p>
                      <p className="text-xs text-yellow-700 text-center mt-1">
                        Contact us to place your order
                      </p>
                    </div>
                    
                    {storeSettings?.phone && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`tel:${storeSettings.phone}`, '_self')}
                        className="w-full h-12"
                      >
                        Call to Order: {storeSettings.phone}
                      </Button>
                    )}
                    
                    {storeSettings?.email && (
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`mailto:${storeSettings.email}?subject=Order Inquiry&body=I'm interested in ordering the items in my cart.`, '_self')}
                        className="w-full h-12"
                      >
                        Email to Order
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Clear Cart Option */}
        <div className="mt-8 text-center">
          <ClearCartModal 
            itemCount={cartItems.length}
            onConfirm={clearCart}
          />
        </div>
      </div>
    </div>
  )
}
