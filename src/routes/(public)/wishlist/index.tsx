import { createFileRoute } from '@tanstack/react-router'
import { Heart, Trash2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

export const Route = createFileRoute('/(public)/wishlist/')({
  component: WishlistPage,
})

function WishlistPage() {
  // Simple wishlist - empty for now, could be managed via localStorage or state
  const [wishlistItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const removeFromWishlist = (itemId: string) => {
    setLoading(true)
    // In a real implementation, you would remove from wishlist storage
    console.log('Removed from wishlist:', itemId)
    setLoading(false)
  }

  const addToCart = (itemId: string) => {
    setLoading(true)
    // In a real implementation, you would add to cart
    console.log('Added to cart:', itemId)
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            My Wishlist
          </h1>
          <p className="text-gray-600 mt-2">
            Save your favorite items for later
          </p>
        </div>

        {/* Wishlist Content */}
        {wishlistItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Start browsing our products and add items you love to your wishlist
              </p>
              <Button asChild>
                <a href="/products">
                  Browse Products
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg bg-gray-100 aspect-square">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => removeFromWishlist(item.id)}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">
                        ${item.price?.toFixed(2)}
                      </span>
                      {item.old_price && item.old_price > item.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${item.old_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => addToCart(item.id)}
                      disabled={loading}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}