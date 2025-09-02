import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Copy, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProductsResponse, CategoriesResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/products/sgfgsfg')({
  loader: async ({ params }) => {
    try {
      const product = await pb.collection(Collections.Products).getOne<ProductsResponse<{ categories: CategoriesResponse[] }>>(params.productId, {
        expand: 'categories',
        requestKey: `product-${params.productId}-${Date.now()}`
      })
      
      return { product }
    } catch (error) {
      console.error('Failed to load product:', error)
      throw new Error('Product not found')
    }
  },
  component: ProductDetailView,
})

function ProductDetailView() {
  const { product } = Route.useLoaderData()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleEdit = () => {
    navigate({ to: `/dashboard/products/${product.id}/edit` })
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await pb.collection(Collections.Products).delete(product.id, {
        requestKey: `delete-product-${product.id}-${Date.now()}`
      })
      navigate({ to: '/dashboard/products' })
    } catch (error) {
      console.error('Failed to delete product:', error)
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      const duplicateData = {
        title: `${product.title} (Copy)`,
        description: product.description,
        sku: product.sku ? `${product.sku}-copy` : undefined,
        categories: product.categories,
        cost: product.cost,
        price: product.price,
        old_price: product.old_price,
        profit: product.profit,
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel,
        isActive: false
      }

      await pb.collection(Collections.Products).create(duplicateData, {
        requestKey: `duplicate-product-${Date.now()}`
      })
      
      navigate({ to: '/dashboard/products' })
    } catch (error) {
      console.error('Failed to duplicate product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPublic = () => {
    window.open(`/products/${product.id}`, '_blank')
  }

  const getProductImages = () => {
    const images = []
    if (product.featured_image) {
      images.push(pb.files.getUrl(product, product.featured_image, { thumb: '800x800' }))
    }
    if (product.images && product.images.length > 0) {
      images.push(...product.images.map(img => pb.files.getUrl(product, img, { thumb: '800x800' })))
    }
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop')
    }
    return images
  }

  const getStockStatus = () => {
    const stock = product.stockQuantity ?? 0
    const reorder = product.reorderLevel ?? 0
    
    if (stock === 0) return { 
      label: 'Out of Stock', 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: XCircle,
      warning: true 
    }
    if (stock <= reorder) return { 
      label: 'Low Stock', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: AlertTriangle,
      warning: true 
    }
    return { 
      label: 'In Stock', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle,
      warning: false 
    }
  }

  const stockStatus = getStockStatus()
  const hasDiscount = product.old_price && product.old_price > product.price
  const discountPercentage = hasDiscount ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0
  const productImages = getProductImages()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Mobile-First Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/dashboard/products' })}
              className="shrink-0 h-10 w-10 p-0 sm:h-auto sm:w-auto sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Back</span>
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
              <h1 className="font-semibold text-sm sm:text-base lg:text-lg truncate">
                {product.title}
              </h1>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPublic}
              className="h-9"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Live
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="h-9"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={loading}
              className="h-9"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="h-9"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>

          {/* Mobile Actions Menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={handleViewPublic} className="py-3">
                  <ExternalLink className="h-4 w-4 mr-3" />
                  View Live Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit} className="py-3">
                  <Edit className="h-4 w-4 mr-3" />
                  Edit Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate} disabled={loading} className="py-3">
                  <Copy className="h-4 w-4 mr-3" />
                  Duplicate Product
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-red-600 py-3">
                  <Trash2 className="h-4 w-4 mr-3" />
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Content Layout */}
      <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto pb-20 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Enhanced Mobile Image Gallery */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Main Image */}
                <div className="aspect-square bg-gray-100 relative">
                  <img
                    src={productImages[selectedImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {hasDiscount && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                      {discountPercentage}% OFF
                    </div>
                  )}
                  {!product.isActive && (
                    <div className="absolute top-3 right-3 bg-gray-800 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold">
                      Inactive
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Enhanced Mobile Thumbnails */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-gray-100 rounded-lg border-2 overflow-hidden transition-all touch-manipulation ${
                      index === selectedImageIndex 
                        ? 'border-primary shadow-md scale-105' 
                        : 'border-gray-200 hover:border-gray-300 active:scale-95'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Mobile Product Details */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Info Card */}
            <Card>
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-4">
                  {/* Title and SKU */}
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                      {product.title}
                    </h2>
                    {product.sku && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-xs px-2 py-1">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={`${stockStatus.color} text-xs px-2 py-1`}>
                      <stockStatus.icon className="w-3 h-3 mr-1" />
                      {stockStatus.label}
                    </Badge>
                  </div>

                  {/* Categories */}
                  {Array.isArray(product.expand?.categories) && product.expand.categories.length > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Categories</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {product.expand.categories.map((category) => (
                          <Badge key={category.id} variant="outline" className="text-xs px-2 py-1">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Mobile Pricing Card */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Pricing & Profit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Display */}
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Customer Price</p>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {hasDiscount ? (
                      <>
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="text-sm sm:text-lg text-gray-500 line-through">
                          ${product.old_price!.toFixed(2)}
                        </span>
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-1">
                          Save ${(product.old_price! - product.price).toFixed(2)}
                        </Badge>
                      </>
                    ) : (
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cost and Profit Grid - Mobile Optimized */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Cost</p>
                    <p className="text-base sm:text-lg font-bold">${product.cost.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Profit</p>
                    <p className={`text-base sm:text-lg font-bold ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${product.profit.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Profit Margin */}
                {product.price > 0 && (
                  <div className="pt-2 text-center">
                    <p className="text-xs sm:text-sm text-gray-600">
                      Profit Margin: <span className="font-medium">{((product.profit / product.price) * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Mobile Inventory Card */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg">Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">In Stock</p>
                    <p className="text-lg sm:text-xl font-bold">{product.stockQuantity ?? 0}</p>
                    <p className="text-xs text-gray-500">units</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Reorder At</p>
                    <p className="text-lg sm:text-xl font-bold">{product.reorderLevel ?? 0}</p>
                    <p className="text-xs text-gray-500">units</p>
                  </div>
                </div>
                
                {/* Stock Alert */}
                {stockStatus.warning && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                      <p className="text-xs sm:text-sm font-medium text-yellow-800">
                        {stockStatus.label}
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Consider restocking soon
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Description Section */}
        {product.description && (
          <Card className="mt-4 sm:mt-6 lg:mt-8">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-links:text-primary [&>*]:text-sm sm:[&>*]:text-base"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Mobile Action Bar - Better spacing and touch targets */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t lg:hidden">
        <div className="flex gap-2 max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex-1 h-12 text-xs sm:text-sm font-medium touch-manipulation"
          >
            <Edit className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleViewPublic}
            className="flex-1 h-12 text-xs sm:text-sm font-medium touch-manipulation"
          >
            <ExternalLink className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Live</span>
          </Button>
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={loading}
            className="flex-1 h-12 text-xs sm:text-sm font-medium touch-manipulation"
          >
            <Copy className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Copy</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Mobile Delete Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm sm:max-w-md mx-3">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <p className="text-sm text-gray-600 mb-3 sm:mb-4">
              Are you sure you want to delete "{product.title}"? This action cannot be undone.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-800">
                This will permanently remove the product from your store and all associated data.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDelete(false)} 
              className="flex-1 h-11 text-sm touch-manipulation"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={loading} 
              className="flex-1 h-11 text-sm touch-manipulation"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
