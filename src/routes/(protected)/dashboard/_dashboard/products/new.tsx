import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Package, Upload, X } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { Switch } from '@/components/ui/switch'
import type { CategoriesResponse, ProductsRecord, StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/products/new')({
  loader: async () => {
    try {
      const [categories, storeSettings] = await Promise.all([
        pb.collection(Collections.Categories).getFullList<CategoriesResponse>({
          requestKey: `categories-new-${Date.now()}`
        }),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-${Date.now()}`
        }).catch(() => null)
      ])
      
      return { categories, storeSettings }
    } catch (error) {
      console.error('Failed to load data:', error)
      throw new Error('Failed to load required data')
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { categories, storeSettings } = Route.useLoaderData()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
  // Format price as "amount DH" for MAD currency
  const formatPrice = (amount: number): string => {
    if (currency === 'MAD') {
      return `${amount.toFixed(2)} ${currencySymbol}`
    }
    return `${currencySymbol}${amount.toFixed(2)}`
  }

  // Form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [cost, setCost] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [oldPrice, setOldPrice] = useState<string>('')
  const [featuredImage, setFeaturedImage] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [description, setDescription] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const [title, setTitle] = useState<string>('')
  const [sku, setSku] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [stockQuantity, setStockQuantity] = useState<string>('0')
  const [reorderLevel, setReorderLevel] = useState<string>('0')

  // Auto-generate slug from title
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Auto-generate slug only if it hasn't been manually edited
    if (!isSlugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setIsSlugManuallyEdited(true)
  }

  const profit = cost && price ? Number(price) - Number(cost) : 0
  const hasDiscount = oldPrice && price && Number(oldPrice) > Number(price)
  const discountPercentage = hasDiscount ? Math.round(((Number(oldPrice) - Number(price)) / Number(oldPrice)) * 100) : 0

  function handleFeaturedImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFeaturedImage(file)
    }
  }

  function handleAdditionalImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    setAdditionalImages(prev => [...prev, ...files])
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    
    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error('Product title is required')
      }
      if (!slug.trim()) {
        throw new Error('Product slug is required')
      }
      if (selectedCategories.length === 0) {
        throw new Error('At least one category must be selected')
      }
      if (!cost || Number(cost) < 0) {
        throw new Error('Valid cost price is required')
      }
      if (!price || Number(price) < 0) {
        throw new Error('Valid selling price is required')
      }

      const productData: Partial<ProductsRecord> = {
        title: title.trim(),
        slug: slug.trim(),
        description: description || undefined,
        sku: sku.trim() || undefined,
        categories: selectedCategories,
        cost: Number(cost),
        price: Number(price),
        old_price: oldPrice && Number(oldPrice) > 0 ? Number(oldPrice) : undefined,
        profit: profit,
        stockQuantity: Number(stockQuantity) || 0,
        reorderLevel: Number(reorderLevel) || 0,
        isActive: isActive,
        baseCurrency: currency,
        basePrice: Number(price),
        store: storeSettings?.id ? [storeSettings.id] : undefined
      }

      const createFormData = new FormData()
      
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'categories' && Array.isArray(value)) {
            value.forEach(categoryId => {
              createFormData.append('categories', categoryId)
            })
          } else if (key === 'store' && Array.isArray(value)) {
            value.forEach(storeId => {
              createFormData.append('store', storeId)
            })
          } else {
            createFormData.append(key, value.toString())
          }
        }
      })

      if (featuredImage) {
        createFormData.append('featured_image', featuredImage)
      }

      additionalImages.forEach(image => {
        createFormData.append('images', image)
      })
      
      await pb.collection(Collections.Products).create(createFormData, {
        requestKey: `product-create-${Date.now()}`
      })
      
      navigate({ to: '/dashboard/products' })
    } catch (err: any) {
      console.error('Create error:', err)
      
      // Handle specific PocketBase validation errors
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Handle unique constraint violations
        if (errorData.slug?.code === 'validation_not_unique') {
          setError('A product with this URL slug already exists. Please use a different slug.')
        } else if (errorData.sku?.code === 'validation_not_unique') {
          setError('A product with this SKU already exists. Please use a different SKU.')
        } else if (errorData.title?.code === 'validation_not_unique') {
          setError('A product with this title already exists. Please use a different title.')
        } else {
          // Handle other validation errors
          const firstError = Object.values(errorData)[0] as any
          setError(firstError?.message || 'Please check your input and try again.')
        }
      } else {
        setError(err.message || 'Failed to create product. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b dark:bg-gray-950/80">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/dashboard/products' })}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg">Add Product</h1>
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
              <strong>Currency:</strong> Moroccan Dirham ({currencySymbol}) - All prices will be saved in DH
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="product-form">
          {/* Product Identity Section */}
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
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter product title"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-sm font-medium">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="product-url-slug"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Used in product URL: /products/{slug || 'product-url-slug'}
                {!isSlugManuallyEdited && ' (auto-generated from title)'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground">(rich text)</span>
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <MDEditor
                  value={description}
                  onChange={(val) => setDescription(val || '')}
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
              />
              <p className="text-xs text-muted-foreground">
                Stock Keeping Unit - must be unique if provided
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categories" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={selectedCategories[0] || ''} 
                onValueChange={(value) => setSelectedCategories([value])} 
                required
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

          {/* Images Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Images
            </h2>
            
            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featured_image" className="text-sm font-medium">
                Featured Image
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
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {featuredImage ? featuredImage.name : 'Click to upload featured image'}
                  </span>
                </Label>
              </div>
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
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload additional images
                  </span>
                </Label>
              </div>
              
              {/* Show selected additional images */}
              {additionalImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {additionalImages.map((file, index) => (
                    <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                      <span className="truncate max-w-[100px]">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAdditionalImage(index)}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section */}
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
                  onChange={(e) => setCost(e.target.value)}
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
                  onChange={(e) => setPrice(e.target.value)}
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
              />
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
                  Initial Stock
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
                />
              </div>
            </div>
          </div>
          
          {/* Product Status Section */}
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
              />
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </form>

        {/* Action buttons - Fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t md:relative md:bottom-auto md:bg-transparent md:border-t-0 md:p-0 md:mt-6">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/dashboard/products' })}
              className="flex-1 h-11"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              form="product-form"
              className="flex-1 h-11"
              disabled={loading || !title.trim() || !slug.trim() || !cost || !price || selectedCategories.length === 0}
            >
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
