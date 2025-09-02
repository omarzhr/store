import pb from '@/lib/db'
import { Collections, type CartesRecord, type CartesResponse } from '@/lib/types'

export interface AddToCartOptions {
  productId: string
  productName: string
  quantity?: number
  price: number
}

export async function addToCart(options: AddToCartOptions) {
  try {
    // Check if item already exists in cart
    const existingItems = await pb.collection(Collections.Cartes).getFullList({
      filter: `productId~"${options.productId}"`
    })

    if (existingItems.length > 0) {
      // Update quantity if item exists
      const existingItem = existingItems[0]
      const newQuantity = (existingItem.quantity || 1) + (options.quantity || 1)
      
      await pb.collection(Collections.Cartes).update(existingItem.id, {
        quantity: newQuantity
      })
    } else {
      // Create new cart item
      const cartData: Partial<CartesRecord> = {
        productId: [options.productId],
        productName: options.productName,
        quantity: options.quantity || 1,
        price: options.price,
        inStock: true
      }

      await pb.collection(Collections.Cartes).create(cartData)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to add to cart:', error)
    return { success: false, error }
  }
}

export async function getCartItemCount(): Promise<number> {
  try {
    const items = await pb.collection(Collections.Cartes).getFullList<CartesResponse>()
    return items.reduce((total, item) => total + (item.quantity || 1), 0)
  } catch (error) {
    console.error('Failed to get cart count:', error)
    return 0
  }
}

export async function getCartItems() {
  try {
    return await pb.collection(Collections.Cartes).getFullList<CartesResponse>({
      sort: '-created'
    })
  } catch (error) {
    console.error('Failed to get cart items:', error)
    return []
  }
}
