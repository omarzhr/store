import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react'
import { useState } from 'react'
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

// Mock data types for cart
interface MockCartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedVariants: { type: string; value: string }[];
  quantity: number;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  slug: string;
}

interface MockCartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Cart storage utilities
const CART_STORAGE_KEY = 'ecommerce_cart'

const saveCartToStorage = (items: MockCartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.warn('Failed to save cart to localStorage:', error)
  }
}

const loadCartFromStorage = (): MockCartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate that the stored data has the correct structure
      if (Array.isArray(parsed) && parsed.every((item: any) => 
        item.id && item.productName && typeof item.quantity === 'number' && typeof item.price === 'number'
      )) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load cart from localStorage:', error)
  }
  return []
}

export const Route = createFileRoute('/(public)/cart/')({
  loader: () => {
    // Try to load cart from localStorage first, fallback to mock data
    const storedCart = loadCartFromStorage()
    
    const defaultCartItems = [
      {
        id: 'cart-1',
        productId: '1',
        productName: 'Wireless Bluetooth Headphones Pro Max',
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        selectedVariants: [
          { type: 'color', value: 'Black' },
          { type: 'size', value: 'Large' }
        ],
        quantity: 2,
        price: 89.99,
        originalPrice: 99.99,
        inStock: true,
        slug: 'wireless-bluetooth-headphones-pro-max'
      },
      {
        id: 'cart-2',
        productId: '2',
        productName: 'Wireless Earbuds Pro',
        productImage: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
        selectedVariants: [
          { type: 'color', value: 'White' }
        ],
        quantity: 1,
        price: 129.99,
        originalPrice: 149.99,
        inStock: true,
        slug: 'wireless-earbuds-pro'
      },
      {
        id: 'cart-3',
        productId: '3',
        productName: 'USB-C Charging Cable',
        productImage: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=400&fit=crop',
        selectedVariants: [],
        quantity: 3,
        price: 19.99,
        originalPrice: 24.99,
        inStock: true,
        slug: 'usb-c-charging-cable'
      }
    ] as MockCartItem[]

    const cartItems = storedCart.length > 0 ? storedCart : defaultCartItems

    const calculateSummary = (items: MockCartItem[]): MockCartSummary => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
      const shipping = itemCount > 0 ? 9.99 : 0
      const tax = subtotal * 0.1
      const total = subtotal + shipping + tax

      return { subtotal, shipping, tax, total, itemCount }
    }

    return {
      cartItems,
      cartSummary: calculateSummary(cartItems)
    }
  },
  component: RouteComponent,
})

// Remove Item Confirmation Modal Component
function RemoveItemModal({ 
  item, 
  onConfirm 
}: { 
  item: MockCartItem
  onConfirm: () => void
}) {
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
            Are you sure you want to remove "{item.productName}" from your cart? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Product Preview in Modal */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg my-2">
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-12 h-12 object-cover rounded border"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Qty: {item.quantity}</span>
              <span>•</span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
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
        <button className="text-red-300 hover:text-red-100 underline">
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
  onRemove 
}: { 
  item: MockCartItem
  onQuantityChange: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}) {
  const handleDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1)
    }
  }

  const handleIncrease = () => {
    onQuantityChange(item.id, item.quantity + 1)
  }

  const itemTotal = item.price * item.quantity
  const hasDiscount = item.originalPrice && item.originalPrice > item.price

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 lg:p-6">
        <div className="flex gap-3 lg:gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-md border hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => window.open(`/products/${item.slug}`, '_blank')}
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2 lg:mb-3">
              <h3 className="font-medium text-sm lg:text-base line-clamp-2 leading-tight hover:text-primary cursor-pointer transition-colors"
                  onClick={() => window.open(`/products/${item.slug}`, '_blank')}>
                {item.productName}
              </h3>
              <RemoveItemModal 
                item={item} 
                onConfirm={() => onRemove(item.id)} 
              />
            </div>

            {/* Variants */}
            {item.selectedVariants.length > 0 && (
              <div className="flex flex-wrap gap-1 lg:gap-2 mb-2 lg:mb-3">
                {item.selectedVariants.map((variant, index) => (
                  <Badge key={index} variant="secondary" className="text-xs lg:text-sm">
                    {variant.value}
                  </Badge>
                ))}
              </div>
            )}

            {/* Price and Quantity - Desktop Layout */}
            <div className="hidden lg:flex justify-between items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">
                    ${item.price.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      ${item.originalPrice?.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Item total: ${itemTotal.toFixed(2)}
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
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <span className="px-4 py-2 text-sm font-medium min-w-[50px] text-center border-l border-r border-gray-300">
                    {item.quantity}
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
                    ${item.price.toFixed(2)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-500 line-through">
                      ${item.originalPrice?.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  Total: ${itemTotal.toFixed(2)}
                </div>
              </div>

              {/* Quantity Controls - Mobile */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-none border-0"
                  onClick={handleDecrease}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                
                <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center border-l border-r border-gray-300">
                  {item.quantity}
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

// Cart Summary Component
function CartSummary({ 
  summary, 
  promoCode, 
  onPromoCodeChange, 
  onApplyPromo 
}: { 
  summary: MockCartSummary
  promoCode: string
  onPromoCodeChange: (code: string) => void
  onApplyPromo: () => void
}) {
  return (
    <Card className="sticky top-4 lg:top-6">
      <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <h3 className="font-semibold text-lg lg:text-xl">Order Summary</h3>
        
        {/* Promo Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 hidden lg:block">
            Promo Code
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => onPromoCodeChange(e.target.value)}
              className="flex-1 lg:h-11"
            />
            <Button 
              variant="outline" 
              size="sm"
              className="lg:h-11 lg:px-4"
              onClick={onApplyPromo}
              disabled={!promoCode.trim()}
            >
              <Tag className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Apply</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Summary Breakdown */}
        <div className="space-y-3 lg:space-y-4">
          <div className="flex justify-between text-sm lg:text-base">
            <span className="text-gray-600">Subtotal ({summary.itemCount} items)</span>
            <span className="font-medium">${summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm lg:text-base">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">${summary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm lg:text-base">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${summary.tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold text-base lg:text-lg">
            <span>Total</span>
            <span className="text-primary">${summary.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <Button className="w-full h-12 lg:h-14 text-base lg:text-lg font-semibold bg-primary hover:bg-primary/90 transition-colors">
           <a href="/checkout">Proceed to Checkout</a>
        </Button>

        {/* Payment Info */}
        <div className="text-center space-y-2">
          <p className="text-xs lg:text-sm text-gray-500">
            Cash on Delivery available
          </p>
          <div className="flex items-center justify-center gap-2 text-xs lg:text-sm text-gray-400">
            <span>🔒</span>
            <span>Secure checkout</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty Cart Component
function EmptyCart() {
  return (
    <div className="text-center py-12 lg:py-20">
      <ShoppingBag className="w-16 h-16 lg:w-24 lg:h-24 text-gray-300 mx-auto mb-4 lg:mb-6" />
      <h2 className="text-xl lg:text-2xl font-semibold text-gray-600 mb-2 lg:mb-4">Your cart is empty</h2>
      <p className="text-gray-500 mb-6 lg:mb-8 lg:text-lg">Add some products to get started</p>
      <Button asChild size="lg" className="lg:h-12 lg:px-8 lg:text-base">
        <a href="/products">Continue Shopping</a>
      </Button>
    </div>
  )
}

function RouteComponent() {
  const { cartItems: initialItems } = Route.useLoaderData()
  const [cartItems, setCartItems] = useState(initialItems)
  const [promoCode, setPromoCode] = useState('')
  const [removedItem, setRemovedItem] = useState<MockCartItem | null>(null)
  const [showUndoAlert, setShowUndoAlert] = useState(false)

  // Save to localStorage whenever cart items change
  const updateCartItems = (newItems: MockCartItem[]) => {
    setCartItems(newItems)
    saveCartToStorage(newItems)
  }

  // Calculate updated summary when items change
  const calculateSummary = (items: MockCartItem[]): MockCartSummary => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const shipping = itemCount > 0 ? 9.99 : 0
    const tax = subtotal * 0.1 // 10% tax
    const total = subtotal + shipping + tax

    return { subtotal, shipping, tax, total, itemCount }
  }

  const cartSummary = calculateSummary(cartItems)

  const handleQuantityChange = (id: string, quantity: number) => {
    const newItems = cartItems.map((item: MockCartItem) => 
      item.id === id ? { ...item, quantity } : item
    )
    updateCartItems(newItems)
  }

  const handleRemoveItem = (id: string) => {
    const itemToRemove = cartItems.find((item: MockCartItem) => item.id === id)
    if (itemToRemove) {
      setRemovedItem(itemToRemove)
      const newItems = cartItems.filter((item: MockCartItem) => item.id !== id)
      updateCartItems(newItems)
      setShowUndoAlert(true)
      
      // Auto-hide undo alert after 5 seconds
      setTimeout(() => {
        setShowUndoAlert(false)
        setRemovedItem(null)
      }, 5000)
    }
  }

  const handleUndoRemove = () => {
    if (removedItem) {
      const newItems = [...cartItems, removedItem]
      updateCartItems(newItems)
      setRemovedItem(null)
      setShowUndoAlert(false)
    }
  }

  const handleApplyPromo = () => {
    // Mock promo code validation
    console.log('Applying promo code:', promoCode)
    // TODO: Implement promo code logic
  }

  // Clear cart function with confirmation
  const clearCart = () => {
    updateCartItems([])
  }

  // Add item to cart function (for future use)
  const addToCart = (item: MockCartItem) => {
    const existingItemIndex = cartItems.findIndex((cartItem: MockCartItem) => 
      cartItem.productId === item.productId && 
      JSON.stringify(cartItem.selectedVariants) === JSON.stringify(item.selectedVariants)
    )

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      const newItems = cartItems.map((cartItem: MockCartItem, index: number) => 
        index === existingItemIndex 
          ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
          : cartItem
      )
      updateCartItems(newItems)
    } else {
      // Add new item
      updateCartItems([...cartItems, item])
    }
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
                  Removed "{removedItem.productName.length > 20 
                    ? removedItem.productName.substring(0, 20) + '...' 
                    : removedItem.productName}" from cart
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
          <Button variant="ghost" size="sm" asChild className="lg:h-10 lg:px-4">
            <a href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Continue Shopping</span>
              <span className="lg:hidden">Back</span>
            </a>
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
              {cartItems.map((item: MockCartItem) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
            
            {/* Continue Shopping Link - Desktop */}
            <div className="hidden lg:block mt-8">
              <Button variant="outline" asChild>
                <a href="/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </a>
              </Button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4">
            <CartSummary
              summary={cartSummary}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              onApplyPromo={handleApplyPromo}
            />
          </div>
        </div>

        {/* Debug info for development - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-20 right-4 bg-gray-800 text-white p-2 rounded text-xs z-40">
            <div>Cart persisted: {cartItems.length} items</div>
            <ClearCartModal 
              itemCount={cartItems.length}
              onConfirm={clearCart}
            />
          </div>
        )}
      </div>
    </div>
  )
}
