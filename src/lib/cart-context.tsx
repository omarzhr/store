import React, { createContext, useContext, useState, useEffect } from 'react'

interface CartItem {
  id: string
  productId: string
  productName: string
  productImage: string
  selectedVariants: { type: string; value: string }[]
  quantity: number
  price: number
  originalPrice?: number
  inStock: boolean
  slug: string
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ecommerce_cart')
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    } else {
      // Initialize with default items if no saved cart
      const defaultItems = [
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
      ]
      setItems(defaultItems)
    }
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('ecommerce_cart', JSON.stringify(items))
  }, [items])

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.productId === newItem.productId && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(newItem.selectedVariants)
      )

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        return updatedItems
      } else {
        return [...prevItems, { ...newItem, id: `cart-${Date.now()}-${Math.random()}` }]
      }
    })
  }

  const removeItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0)

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
