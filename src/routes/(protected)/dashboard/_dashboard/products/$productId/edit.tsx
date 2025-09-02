import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Package, Upload, X, AlertCircle } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ProductsResponse, CategoriesResponse, ProductsRecord, StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/products/$productId/edit')({
  loader: async ({ params }) => {
    try {
      const [product, categories, storeSettings] = await Promise.all([
        pb.collection(Collections.Products).getOne<ProductsResponse<{ categories: CategoriesResponse[] }>>(params.productId, {
          expand: 'categories',
          requestKey: `edit-product-${params.productId}-${Date.now()}`
        }),
        pb.collection(Collections.Categories).getFullList<CategoriesResponse>({
          requestKey: `categories-edit-${Date.now()}`
        }),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-edit-${Date.now()}`
        }).catch(() => null)
      ])
      
      return { product, categories, storeSettings }
    } catch (error) {
      console.error('Failed to load product:', error)
      throw new Error('Product not found')
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { product, categories, storeSettings } = Route.useLoaderData()
  
  // Get currency info from store settings - default to MAD
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Pre-filled form state from existing product
  const [selectedCategories, setSelectedCategories] = useState<string[]>(product.categories || [])
  const [cost, setCost] = useState<string>(product.cost.toString())
  const [price, setPrice] = useState<string>(product.price.toString())
  const [oldPrice, setOldPrice] = useState<string>(product.old_price?.toString() || '')
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [description, setDescription] = useState<string>(product.description || '')
  const [isActive, setIsActive] = useState<boolean>(product.isActive ?? true)
  const [title, setTitle] = useState<string>(product.title)
  const [sku, setSku] = useState<string>(product.sku || '')
  const [stockQuantity, setStockQuantity] = useState<string>((product.stockQuantity ?? 0).toString())
  const [reorderLevel, setReorderLevel] = useState<string>((product.reorderLevel ?? 0).toString())

  const profit = cost && price ? Number(price) - Number(cost) : 0
  const hasDiscount = oldPrice && price && Number(oldPrice) > Number(price)
  const discountPercentage = hasDiscount ? Math.round(((Number(oldPrice) - Number(price)) / Number(oldPrice)) * 100) : 0

  // Form validation
  const isFormValid = title.trim().length > 0 && selectedCategories.length > 0 && Number(cost) >= 0 && Number(price) > 0

  function handleFeaturedImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFeaturedImage(file)
      setError(null)
    }
  }

  function handleAdditionalImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setAdditionalImages(prev => [...prev, ...files])
    setError(null)
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
  }

  function removeFeaturedImage() {
    setFeaturedImage(null)
  }

  // Show current images
  const getCurrentImages = () => {
    const images = []
    if (product.featured_image) {
      images.push({
        url: pb.files.getUrl(product, product.featured_image, { thumb: '150x150' }),
        filename: product.featured_image,
        type: 'featured'
      })
    }
    if (product.images && product.images.length > 0) {
      images.push(...product.images.map(img => ({
        url: pb.files.getUrl(product, img, { thumb: '150x150' }),
        filename: img,
        type: 'additional'
      })))
    }
    return images
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!isFormValid) {
      setError('Please fill in all required fields: title, category, and valid pricing')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // If we have file uploads, use FormData
      if (featuredImage || additionalImages.length > 0) {
        const formData = new FormData()
        
        // Add all text fields
        formData.append('title', title.trim())
        if (description.trim()) {
          formData.append('description', description.trim())
        }
        if (sku.trim()) {
          formData.append('sku', sku.trim())
        }
        
        // Add categories
        selectedCategories.forEach(categoryId => {
          formData.append('categories', categoryId)
        })
        
        // Add pricing
        formData.append('cost', cost)
        formData.append('price', price)
        if (oldPrice && Number(oldPrice) > 0) {
          formData.append('old_price', oldPrice)
        }
        formData.append('profit', profit.toString())
        
        // Add inventory
        formData.append('stockQuantity', stockQuantity)
        formData.append('reorderLevel', reorderLevel)
        
        // Add status
        formData.append('isActive', isActive.toString())

        // Add new images
        if (featuredImage) {
          formData.append('featured_image', featuredImage)
        }
        additionalImages.forEach(image => {
          formData.append('images', image)
        })

        await pb.collection(Collections.Products).update(product.id, formData, {
          requestKey: `product-update-${product.id}-${Date.now()}`
        })
      } else {
        // No file uploads, use regular data update
        const updateData: Partial<ProductsRecord> = {
          title: title.trim(),
          description: description.trim() || undefined,
          sku: sku.trim() || undefined,
          categories: selectedCategories,
          cost: Number(cost),
          price: Number(price),
          old_price: oldPrice && Number(oldPrice) > 0 ? Number(oldPrice) : undefined,
          profit: profit,
          stockQuantity: Number(stockQuantity) || 0,
          reorderLevel: Number(reorderLevel) || 0,
          isActive: isActive
        }

        await pb.collection(Collections.Products).update(product.id, updateData, {
          requestKey: `product-update-${product.id}-${Date.now()}`
        })
      }
      
      setSuccess(true)
      setTimeout(() => {
        navigate({ to: `/dashboard/products/${product.id}` })
      }, 1000)
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentImages = getCurrentImages()

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Mobile-first header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b dark:bg-gray-950/80">
        <div className="flex items-center justify-between gap-3 p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/dashboard/products/${product.id}` })}
              className="shrink-0"
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg">Edit Product</h1>
            </div>
          </div>
          
          <div className="hidden sm:flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: `/dashboard/products/${product.id}` })}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="product-form"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="p-4 max-w-2xl mx-auto pb-24 md:pb-8">
        {/* Store & Currency Info Alert */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-blue-800">
              <strong>Store:</strong> {storeSettings?.storeName || 'Default Store'}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Currency:</strong> Moroccan Dirham ({currencySymbol}) - All prices are in DH
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Product updated successfully! Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="product-form">
          {/* Product Details Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Product Details
            </h2>
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Product Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  setError(null) // Clear error when user types
                }}
                placeholder="Enter product title"
                className="h-11"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <MDEditor
                  value={description}
                  onChange={(val) => {
                    setDescription(val || '')
                    setError(null)
                  }}
                  preview="edit"
                  hideToolbar={false}
                  height={200}
                  data-color-mode="light"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use markdown syntax or the toolbar to format text
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="sku"
                name="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., PROD-001"
                className="h-11"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={selectedCategories[0] || ''} 
                onValueChange={(value) => {
                  setSelectedCategories([value])
                  setError(null)
                }}
                required
                disabled={loading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Images Section */}
          {currentImages.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Current Images
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg border overflow-hidden">
                      <img
                        src={image.url}
                        alt={`Current ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      {image.type === 'featured' ? 'Main' : 'Gallery'}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate" title={image.filename}>
                      {image.filename}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload new images below to replace or add to existing ones
              </p>
            </div>
          )}

          {/* Update Images Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {currentImages.length > 0 ? 'Update Images' : 'Add Images'}
            </h2>
            
            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featured_image" className="text-sm font-medium">
                {product.featured_image ? 'Replace Main Image' : 'Main Image'}
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <Input
                  id="featured_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageChange}
                  className="hidden"
                />
                <Label
                  htmlFor="featured_image"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2 min-h-[80px]"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {featuredImage ? featuredImage.name : 'Click to upload main image'}
                  </span>
                </Label>
              </div>
              
              {/* Show selected featured image */}
              {featuredImage && (
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm truncate">{featuredImage.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFeaturedImage}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div className="space-y-2">
              <Label htmlFor="additional_images" className="text-sm font-medium">
                Additional Images <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <Input
                  id="additional_images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className="hidden"
                />
                <Label
                  htmlFor="additional_images"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2 min-h-[80px]"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    Click to add gallery images
                  </span>
                </Label>
              </div>
              
              {/* Show selected additional images */}
              {additionalImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">New images to add:</p>
                  <div className="space-y-1">
                    {additionalImages.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAdditionalImage(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section - Updated with Moroccan Dirham */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pricing (Moroccan Dirham - {currencySymbol})
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Cost Price ({currencySymbol}) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="h-11"
                  value={cost}
                  onChange={(e) => {
                    setCost(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Selling Price ({currencySymbol}) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="h-11"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="old_price" className="text-sm font-medium">
                Original Price ({currencySymbol}) <span className="text-muted-foreground">(optional - for discounts)</span>
              </Label>
              <Input
                id="old_price"
                name="old_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-11"
                value={oldPrice}
                onChange={(e) => setOldPrice(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Set this higher than selling price to show a discount
              </p>
            </div>

            {/* Price Preview - Updated with Moroccan Dirham */}
            {price && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Price Preview (Moroccan Dirham):</h4>
                  <div className="flex items-center gap-3">
                    {hasDiscount ? (
                      <>
                        <span className="text-lg font-bold text-red-600">
                          {formatPrice(Number(price))}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(Number(oldPrice))}
                        </span>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-semibold">
                          {discountPercentage}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold text-gray-900">
                        {formatPrice(Number(price))}
                      </span>
                    )}
                  </div>
                </div>
                
                {cost && (
                  <div className="flex justify-between items-center text-sm border-t pt-3">
                    <span className="text-muted-foreground">Estimated Profit:</span>
                    <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(profit)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Inventory Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Inventory
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity" className="text-sm font-medium">
                  Stock Quantity
                </Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-11"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reorderLevel" className="text-sm font-medium">
                  Reorder Level
                </Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="h-11"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Product Status
            </h2>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active Product
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, this product will be visible to customers
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={loading}
              />
            </div>
          </div>
        </form>

        {/* Action buttons - Fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:mt-6">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: `/dashboard/products/${product.id}` })}
              className="flex-1 h-11"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="product-form"
              className="flex-1 h-11"
              disabled={loading || !isFormValid}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


