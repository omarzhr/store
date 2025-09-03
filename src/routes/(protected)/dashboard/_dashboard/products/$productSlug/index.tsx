import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  Package, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Copy,
  ExternalLink,
  Camera
} from 'lucide-react'
import type { ProductsResponse, CategoriesResponse, StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute(
  '/(protected)/dashboard/_dashboard/products/$productSlug/',
)({
  loader: async ({ params }) => {
    try {
      const [product, storeSettings] = await Promise.all([
        pb.collection(Collections.Products).getFirstListItem<ProductsResponse<any, { categories: CategoriesResponse[] }>>(
          `slug="${params.productSlug}"`,
          {
            expand: 'categories',
            requestKey: `product-${params.productSlug}-${Date.now()}`
          }
        ),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-${Date.now()}`
        }).catch(() => null)
      ])
      
      return { product, storeSettings }
    } catch (error) {
      console.error('Failed to load product:', error)
      throw new Error('Product not found')
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { productSlug } = Route.useParams()
  const { product, storeSettings } = Route.useLoaderData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  // Get currency info from store settings - default to MAD (Moroccan Dirham)
  const currency = storeSettings?.currency || 'MAD'
  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      'MAD': 'DH',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹'
    }
    return symbols[curr] || 'DH'
  }
  
  const currencySymbol = getCurrencySymbol(currency)
  const formatPrice = (amount: number): string => {
    if (currency === 'MAD') {
      return `${amount.toFixed(2)} ${currencySymbol}`
    }
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await pb.collection(Collections.Products).delete(product.id)
      navigate({ to: '/dashboard/products' })
    } catch (error) {
      console.error('Failed to delete product:', error)
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  const handleCopySlug = () => {
    navigator.clipboard.writeText(product.slug)
  }

  const profit = product.price - product.cost
  const profitMargin = product.price > 0 ? (profit / product.price) * 100 : 0
  const stockStatus = (product.stockQuantity || 0) <= (product.reorderLevel || 0) ? 'low' : 'good'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/dashboard/products' })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>SKU: {product.sku || 'N/A'}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Slug: {product.slug}</span>
              <Button variant="ghost" size="sm" onClick={handleCopySlug}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={stockStatus === 'low' ? 'destructive' : 'default'}>
            {stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
          </Badge>
          
          <Link
            to="/dashboard/products/$productSlug/edit"
            params={{ productSlug }}
          >
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/products/${product.slug}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Store
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopySlug}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Slug
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setConfirmDelete(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Price</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(product.price)}</div>
                {product.old_price && product.old_price > product.price && (
                  <p className="text-xs text-muted-foreground">
                    Was {formatPrice(product.old_price)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(product.cost)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(profit)}</div>
                <p className="text-xs text-muted-foreground">
                  {profitMargin.toFixed(1)}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock</CardTitle>
                {stockStatus === 'low' ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{product.stockQuantity || 0}</div>
                {product.reorderLevel && (
                  <p className="text-xs text-muted-foreground">
                    Reorder at {product.reorderLevel}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <p className="text-sm text-muted-foreground">{product.title}</p>
                </div>
                
                {product.sku && (
                  <div>
                    <label className="text-sm font-medium">SKU</label>
                    <p className="text-sm text-muted-foreground">{product.sku}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Categories</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {product.expand?.categories?.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">No categories</span>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <p className="text-sm text-muted-foreground">
                    {product.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Price</label>
                    <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Cost</label>
                    <p className="text-sm text-muted-foreground">{formatPrice(product.cost)}</p>
                  </div>
                </div>

                {product.old_price && (
                  <div>
                    <label className="text-sm font-medium">Original Price</label>
                    <p className="text-sm text-muted-foreground">{formatPrice(product.old_price)}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Stock Quantity</label>
                    <p className="text-sm text-muted-foreground">{product.stockQuantity || 0}</p>
                  </div>
                  
                  {product.reorderLevel && (
                    <div>
                      <label className="text-sm font-medium">Reorder Level</label>
                      <p className="text-sm text-muted-foreground">{product.reorderLevel}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              {product.description ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-muted-foreground">No description provided</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.featured_image && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Featured Image</h4>
                    <img
                      src={pb.files.getUrl(product, product.featured_image)}
                      alt="Featured"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                {product.images && product.images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Additional Images</h4>
                    <div className="grid grid-cols-6 gap-2">
                      {product.images.map((image, index) => (
                        <img
                          key={index}
                          src={pb.files.getUrl(product, image)}
                          alt={`Product image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {!product.featured_image && (!product.images || product.images.length === 0) && (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No images uploaded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              {product.variants ? (
                <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                  {JSON.stringify(product.variants, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground">No variants configured</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{product.title}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}