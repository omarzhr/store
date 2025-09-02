import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { ProductsResponse, CategoriesResponse } from '@/lib/types'
import pb from '@/lib/db'

interface RelatedProductsProps {
  products: ProductsResponse<{ categories: CategoriesResponse[] }>[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) return null

  const getProductImage = (product: ProductsResponse) => {
    if (product.featured_image) {
      return pb.files.getUrl(product, product.featured_image, { thumb: '400x400' })
    }
    if (product.images && product.images.length > 0) {
      return pb.files.getUrl(product, product.images[0], { thumb: '400x400' })
    }
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold lg:text-xl">You might also like</h3>
      
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-48 snap-start cursor-pointer group"
              onClick={() => {
                const slug = product.sku || product.id
                window.location.href = `/products/${slug}`
              }}
            >
              <Card className="h-full overflow-hidden group-hover:shadow-lg transition-shadow duration-200">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={getProductImage(product)}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {(!product.isActive || (product.stockQuantity || 0) === 0) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                    </div>
                  )}
                  {product.old_price && product.old_price > product.price && (
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-xs">
                      -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-3 space-y-2">
                  {product.expand?.categories && product.expand.categories.length > 0 && (
                    <Badge variant="secondary" className="text-xs text-gray-600 bg-gray-100">
                      {product.expand.categories[0].name}
                    </Badge>
                  )}
                  
                  <h4 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {product.title}
                  </h4>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                    {product.old_price && product.old_price > product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ${product.old_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
