import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, X, Save, Loader2 } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CategoriesResponse, ProductsRecord, ProductsResponse, StoresResponse } from '@/lib/types'
import type { ProductVariantConfig } from '@/lib/types/variants'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { VariantConfig } from '@/components/variants/VariantConfig'

export const Route = createFileRoute(
  '/(protected)/dashboard/_dashboard/products/$productSlug/edit',
)({
  loader: async ({ params }) => {
    try {
      const [product, categories, storeSettings] = await Promise.all([
        pb.collection(Collections.Products).getFirstListItem<ProductsResponse<any, { categories: CategoriesResponse[] }>>(
          `slug="${params.productSlug}"`,
          {
            expand: 'categories',
            requestKey: `product-edit-${params.productSlug}-${Date.now()}`
          }
        ),
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
  const { productSlug } = Route.useParams()
  const { product, categories, storeSettings } = Route.useLoaderData()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
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

  // Form state - initialize with existing product data
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
  const [slug, setSlug] = useState<string>(product.slug)
  const [stockQuantity, setStockQuantity] = useState<string>(product.stockQuantity?.toString() || '0')
  const [reorderLevel, setReorderLevel] = useState<string>(product.reorderLevel?.toString() || '0')
  const [variantConfig, setVariantConfig] = useState<ProductVariantConfig | null>(
    product.variants as ProductVariantConfig || null
  )

  // Images to remove (for existing images)
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])

  // Calculate profit whenever cost or price changes
  const profit = Number(price) - Number(cost)

  useEffect(() => {
    // Mark as having changes when any form field changes from initial values
    const hasFormChanges = 
      title !== product.title ||
      sku !== (product.sku || '') ||
      slug !== product.slug ||
      description !== (product.description || '') ||
      JSON.stringify(selectedCategories.sort()) !== JSON.stringify((product.categories || []).sort()) ||
      cost !== product.cost.toString() ||
      price !== product.price.toString() ||
      oldPrice !== (product.old_price?.toString() || '') ||
      stockQuantity !== (product.stockQuantity?.toString() || '0') ||
      reorderLevel !== (product.reorderLevel?.toString() || '0') ||
      isActive !== (product.isActive ?? true) ||
      featuredImage !== null ||
      additionalImages.length > 0 ||
      imagesToRemove.length > 0 ||
      JSON.stringify(variantConfig) !== JSON.stringify(product.variants)

    setHasChanges(hasFormChanges)
  }, [
    title, sku, slug, description, selectedCategories, cost, price, oldPrice,
    stockQuantity, reorderLevel, isActive, featuredImage, additionalImages,
    imagesToRemove, variantConfig, product
  ])

  // Auto-generate slug from title
  useEffect(() => {
    if (title && slug === product.slug) { // Only auto-generate if slug hasn't been manually changed
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      if (generatedSlug !== slug) {
        setSlug(generatedSlug)
      }
    }
  }, [title, slug, product.slug])

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

  function removeExistingImage(imageName: string, isFeatured = false) {
    if (isFeatured) {
      setImagesToRemove(prev => [...prev, product.featured_image!])
    } else {
      setImagesToRemove(prev => [...prev, imageName])
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

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
        store: storeSettings?.id ? [storeSettings.id] : undefined,
        variants: variantConfig ? variantConfig : undefined
      }

      const updateFormData = new FormData()
      
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'categories' && Array.isArray(value)) {
            value.forEach(categoryId => {
              updateFormData.append('categories', categoryId)
            })
          } else if (key === 'store' && Array.isArray(value)) {
            value.forEach(storeId => {
              updateFormData.append('store', storeId)
            })
          } else {
            updateFormData.append(key, value?.toString() || '')
          }
        }
      })

      // Handle image updates
      if (featuredImage) {
        updateFormData.append('featured_image', featuredImage)
      }

      additionalImages.forEach(image => {
        updateFormData.append('images', image)
      })

      // Handle image removals
      if (imagesToRemove.length > 0) {
        imagesToRemove.forEach(imageName => {
          updateFormData.append('images-', imageName)
        })
      }
      
      const updatedProduct = await pb.collection(Collections.Products).update(product.id, updateFormData, {
        requestKey: null
      })
      
      console.log('Product updated successfully:', updatedProduct)
      
      // Navigate back to product detail page
      navigate({ 
        to: '/dashboard/products/$productSlug',
        params: { productSlug: updatedProduct.slug }
      })
      
    } catch (error: any) {
      console.error('Error updating product:', error)
      setError(error.message || 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ 
              to: '/dashboard/products/$productSlug',
              params: { productSlug }
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Product
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-sm text-muted-foreground">Update product information and settings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline">Unsaved Changes</Badge>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="pricing">Pricing & Inventory</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter product title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Product SKU (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Product Slug *</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-url-slug"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used in the product URL
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Categories *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedCategories.length === 0 && (
                    <p className="text-xs text-destructive">At least one category is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <div data-color-mode="light">
                    <MDEditor
                      value={description}
                      onChange={(value) => setDescription(value || '')}
                      preview="edit"
                      hideToolbar={false}
                      visibleDragbar={false}
                      textareaProps={{
                        placeholder: 'Enter product description...',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Product is active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost Price * ({currencySymbol})</Label>
                    <Input
                      id="cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price * ({currencySymbol})</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oldPrice">Original Price ({currencySymbol})</Label>
                    <Input
                      id="oldPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Profit Display */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profit:</span>
                    <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPrice(profit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-muted-foreground">Margin:</span>
                    <span className="text-sm text-muted-foreground">
                      {Number(price) > 0 ? ((profit / Number(price)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stockQuantity">Stock Quantity</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      min="0"
                      value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <Card>
              <CardHeader>
                <CardTitle>Product Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Featured Image */}
                {product.featured_image && !imagesToRemove.includes(product.featured_image) && (
                  <div className="space-y-2">
                    <Label>Current Featured Image</Label>
                    <div className="relative inline-block">
                      <img
                        src={pb.files.getUrl(product, product.featured_image)}
                        alt="Current featured"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => removeExistingImage(product.featured_image!, true)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* New Featured Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="featuredImage">
                    {product.featured_image && !imagesToRemove.includes(product.featured_image) 
                      ? 'Replace Featured Image' 
                      : 'Featured Image'
                    }
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="featuredImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {featuredImage && (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(featuredImage)}
                          alt="Featured preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-5 w-5 p-0"
                          onClick={() => setFeaturedImage(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Additional Images */}
                {product.images && product.images.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Additional Images</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {product.images
                        .filter(img => !imagesToRemove.includes(img))
                        .map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={pb.files.getUrl(product, image)}
                              alt={`Product image ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-5 w-5 p-0"
                              onClick={() => removeExistingImage(image)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Additional Images Upload */}
                <div className="space-y-2">
                  <Label htmlFor="additionalImages">Add More Images</Label>
                  <Input
                    id="additionalImages"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImagesChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                  />
                  
                  {/* Preview new additional images */}
                  {additionalImages.length > 0 && (
                    <div className="grid grid-cols-6 gap-2 mt-4">
                      {additionalImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-5 w-5 p-0"
                            onClick={() => removeAdditionalImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
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
                <VariantConfig
                  config={variantConfig}
                  onChange={(config) => setVariantConfig(config)}
                  basePrice={Number(price) || 0}
                  currency={currency}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ 
              to: '/dashboard/products/$productSlug',
              params: { productSlug }
            })}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !hasChanges}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}