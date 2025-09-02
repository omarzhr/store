import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { ArrowUpDown, Filter, X, Search, ShoppingBag } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { z } from 'zod'
import { type ProductsResponse, type CategoriesResponse, type StoresResponse, Collections } from '@/lib/types'
import pb from '@/lib/db'
import { useNavigate } from '@tanstack/react-router'
import { addToCart } from '@/lib/cart'

// Types
type ProductFilters = {
  categories: string[]
  priceRange: { min: number; max: number }
  inStock: boolean | null
  sortBy: 'name' | 'price-low' | 'price-high' | 'newest'
}

// Search params schema
const productsSearchSchema = z.object({
  search: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'price-low', 'price-high', 'newest']).optional(),
})

export const Route = createFileRoute('/(public)/products/')({
  validateSearch: productsSearchSchema,
  loaderDeps: ({ search }) => ({
    search: search.search,
    categories: search.categories,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    inStock: search.inStock,
    sortBy: search.sortBy,
  }),
  loader: async ({ deps }) => {
    let filter = 'isActive = true'
    
    if (deps.categories && deps.categories.length > 0) {
      filter += ` && (${deps.categories.map(cat => `categories ~ "${cat}"`).join(' || ')})`
    }
    if (deps.minPrice !== undefined) {
      filter += ` && price >= ${deps.minPrice}`
    }
    if (deps.maxPrice !== undefined) {
      filter += ` && price <= ${deps.maxPrice}`
    }
    if (deps.inStock === 'true') {
      filter += ` && stockQuantity > 0`
    } else if (deps.inStock === 'false') {
      filter += ` && stockQuantity = 0`
    }

    // Add search query if provided - fix search syntax
    if (deps.search && deps.search.trim()) {
      const searchTerm = deps.search.trim()
      filter += ` && (title ~ "${searchTerm}" || sku ~ "${searchTerm}")`
    }

    let sort = '-created'
    if (deps.sortBy === 'name') sort = 'title'
    if (deps.sortBy === 'price-low') sort = 'price'
    if (deps.sortBy === 'price-high') sort = '-price'
    if (deps.sortBy === 'newest') sort = '-created'

    const [result, storeSettings] = await Promise.all([
      pb.collection(Collections.Products).getList<ProductsResponse<{ categories: CategoriesResponse[] }>>(1, 24, {
        filter,
        sort,
        expand: 'categories'
      }),
      pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-settings-${Date.now()}`
      }).catch(() => null)
    ])

    // Get all categories for the filter
    const allCategories = await pb.collection(Collections.Categories).getFullList<CategoriesResponse>()
    
    return {
      initialProducts: result.items,
      hasMore: result.totalPages > 1,
      availableCategories: allCategories.map(cat => ({ id: cat.id, name: cat.name })),
      currentPage: 1,
      totalPages: result.totalPages,
      storeSettings
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { initialProducts, storeSettings } = Route.useLoaderData()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Our Products
          </h1>
          <p className="text-gray-600 lg:text-lg">
            Discover our curated collection of quality products
          </p>
        </div>
        <ProductGrid initialProducts={initialProducts} storeSettings={storeSettings} />
      </div>
    </div>
  )
}

// Product Card Skeleton Component
function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-3 flex flex-col flex-1">
        <Skeleton className="h-3 w-16 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-3 w-24 mb-3" />
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Skeleton className="h-8 w-full" />
      </CardFooter>
    </Card>
  )
}

// Product Card Component
function ProductCard({ 
  product, 
  storeSettings 
}: { 
  product: ProductsResponse & { expand: { categories: CategoriesResponse[] } }
  storeSettings: StoresResponse | null
}) {
  const navigate = useNavigate()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Check if cart feature is enabled using the correct field name
  const isCartEnabled = storeSettings?.is_cart_enabled ?? false

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

  const handleProductClick = () => {
    // Use SKU as slug if available, otherwise fall back to ID
    const productSlug = product.sku || product.id
    navigate({ to: `/products/${productSlug}` })
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // If cart is not enabled, redirect to product page
    if (!isCartEnabled) {
      const productSlug = product.sku || product.id
      navigate({ to: `/products/${productSlug}` })
      return
    }
    
    setIsAddingToCart(true)
    
    try {
      const result = await addToCart({
        productId: product.id,
        productName: product.title,
        quantity: 1,
        price: product.price
      })
      
      if (result.success) {
        // Refresh cart count in header
        if ((window as any).refreshCartCount) {
          (window as any).refreshCartCount()
        }
        console.log('Added to cart:', product.title)
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // Get product image URL from PocketBase
  const getProductImage = () => {
    if (product.featured_image) {
      return pb.files.getUrl(product, product.featured_image, { thumb: '400x400' })
    }
    if (product.images && product.images.length > 0) {
      return pb.files.getUrl(product, product.images[0], { thumb: '400x400' })
    }
    // Fallback image
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
  }

  // Check stock status using ProductsRecord fields
  const isLowStock = (product.stockQuantity ?? 0) > 0 && (product.stockQuantity ?? 0) <= (product.reorderLevel ?? 5)
  const isOutOfStock = (product.stockQuantity ?? 0) === 0
  const isInStock = (product.stockQuantity ?? 0) > (product.reorderLevel ?? 5)

  return (
    <Card 
      className="flex flex-col h-full overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-gray-200 hover:border-gray-300"
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={getProductImage()} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
          </div>
        )}
        {isLowStock && !isOutOfStock && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-orange-50 text-orange-600 border-orange-200 text-xs">
            Low Stock
          </Badge>
        )}
      </div>

      <CardContent className="p-3 flex flex-col flex-1">
        <div className="mb-1 flex flex-wrap gap-1">
          {Array.isArray(product.expand?.categories) &&
            product.expand.categories.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-xs text-gray-600 bg-gray-100">
                {cat.name}
              </Badge>
            ))}
        </div>
        <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-tight flex-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">
            {formatPrice(product.price)}
          </span>
          {product.old_price && product.old_price > product.price && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.old_price)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            Cost: {formatPrice(product.cost)}
          </span>
          <span className="text-xs text-gray-500">
            Profit: {formatPrice(product.profit)}
          </span>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <div className={`w-2 h-2 rounded-full ${
            isInStock ? 'bg-green-500' :
            isLowStock ? 'bg-orange-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-600">
            {isInStock ? 'In Stock' :
             isLowStock ? `Low Stock (${product.stockQuantity})` : 'Out of Stock'}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 mt-auto">
        <Button
          size="sm"
          className="w-full text-xs h-8 transition-all duration-200 hover:shadow-md"
          disabled={!product.isActive || isOutOfStock || isAddingToCart}
          onClick={handleAddToCart}
        >
          {isAddingToCart ? 'Loading...' : 
           !product.isActive || isOutOfStock ? 'Unavailable' :
           isCartEnabled ? 'Add to Cart' : 'View Details'}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Sort Dropdown Component
type SortOption = 'name' | 'price-low' | 'price-high' | 'newest'
function SortDropdown({ onSortChange, currentSort }: { 
  onSortChange: (sort: SortOption) => void
  currentSort: SortOption 
}) {
  const sortOptions = [
    { value: 'newest' as const, label: 'Newest First' },
    { value: 'name' as const, label: 'Name A-Z' },
    { value: 'price-low' as const, label: 'Price: Low to High' },
    { value: 'price-high' as const, label: 'Price: High to Low' }
  ]
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-gray-500" />
      <Select value={currentSort} onValueChange={onSortChange}>
        <SelectTrigger className="w-48 lg:w-52">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Search Input Component
function SearchInput({ searchTerm, onSearchChange }: { 
  searchTerm: string
  onSearchChange: (term: string) => void 
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchTerm, onSearchChange])
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        type="text"
        placeholder="Search products..."
        value={localSearchTerm}
        onChange={(e) => setLocalSearchTerm(e.target.value)}
        className="pl-10 h-10 lg:h-12"
      />
      {localSearchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocalSearchTerm('')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

// Filter Drawer Component
function FilterDrawer({ 
  onFiltersChange, 
  currentFilters,
  availableCategories 
}: { 
  onFiltersChange: (filters: ProductFilters) => void
  currentFilters: ProductFilters
  availableCategories: { id: string; name: string }[]
}) {
  const [localFilters, setLocalFilters] = useState<ProductFilters>(currentFilters)
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters])
  
  const handleCategoryChange = (category: string, checked: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      categories: checked 
        ? [...prev.categories, category]
        : prev.categories.filter(c => c !== category)
    }))
  }
  
  const handlePriceRangeChange = (value: number[]) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: { min: value[0], max: value[1] }
    }))
  }
  
  const handleStockChange = (inStock: boolean | null) => {
    setLocalFilters(prev => ({
      ...prev,
      inStock
    }))
  }
  
  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }
  
  const clearFilters = () => {
    const resetFilters: ProductFilters = {
      categories: [],
      priceRange: { min: 0, max: 1000 },
      inStock: null,
      sortBy: currentFilters.sortBy
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
    setIsOpen(false)
  }
  
  const hasActiveFilters = 
    localFilters.categories.length > 0 || 
    localFilters.priceRange.min > 0 || 
    localFilters.priceRange.max < 1000 ||
    localFilters.inStock !== null
    
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {localFilters.categories.length + (localFilters.inStock !== null ? 1 : 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-md p-0 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <SheetHeader>
            <SheetTitle className="text-left">Filters</SheetTitle>
            <SheetDescription className="text-left">
              Refine your product search
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h3 className="font-semibold text-base mb-4">Categories</h3>
            <div className="space-y-3">
              {Array.isArray(availableCategories) && availableCategories.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={cat.id}
                    checked={localFilters.categories.includes(cat.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(cat.id, checked as boolean)
                    }
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor={cat.id} className="text-sm font-medium cursor-pointer">
                    {cat.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-4">Price Range</h3>
            <div className="px-3">
              <Slider
                value={[localFilters.priceRange.min, localFilters.priceRange.max]}
                onValueChange={handlePriceRangeChange}
                max={1000}
                min={0}
                step={10}
                className="mb-4"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span className="font-medium">${localFilters.priceRange.min}</span>
                <span className="font-medium">${localFilters.priceRange.max}+</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-base mb-4">Availability</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="all-products"
                  checked={localFilters.inStock === null}
                  onCheckedChange={() => handleStockChange(null)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="all-products" className="text-sm font-medium cursor-pointer">
                  All Products
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="in-stock"
                  checked={localFilters.inStock === true}
                  onCheckedChange={() => handleStockChange(true)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="in-stock" className="text-sm font-medium cursor-pointer">
                  In Stock Only
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="out-of-stock"
                  checked={localFilters.inStock === false}
                  onCheckedChange={() => handleStockChange(false)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="out-of-stock" className="text-sm font-medium cursor-pointer">
                  Out of Stock
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 p-6 space-y-3 bg-gray-50">
          <Button onClick={applyFilters} className="w-full h-12 font-semibold">
            Apply Filters
          </Button>
          <Button 
            onClick={clearFilters} 
            variant="outline" 
            className="w-full h-12 font-semibold"
          >
            Clear All
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Empty State Component
function EmptyState({ 
  searchTerm, 
  activeFiltersCount, 
  onClearSearch, 
  onClearFilters 
}: { 
  searchTerm: string
  activeFiltersCount: number
  onClearSearch: () => void
  onClearFilters: () => void
}) {
  const hasSearch = searchTerm.trim().length > 0
  const hasFilters = activeFiltersCount > 0
  return (
    <div className="text-center py-16 lg:py-24">
      <div className="max-w-md mx-auto">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-6 lg:w-20 lg:h-20" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2 lg:text-xl">
          No products found
        </h3>
        <p className="text-gray-600 mb-6 lg:text-lg">
          {hasSearch ? (
            <>We couldn't find any products matching "<span className="font-medium">{searchTerm}</span>"</>
          ) : hasFilters ? (
            "No products match your current filters"
          ) : (
            "Try adjusting your search or filters"
          )}
        </p>
        <div className="space-y-3">
          {hasSearch && (
            <Button 
              variant="outline" 
              onClick={onClearSearch}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear search
            </Button>
          )}
          {hasFilters && (
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear all filters
            </Button>
          )}
          {!hasSearch && !hasFilters && (
            <Button 
              variant="outline"
              className="w-full"
            >
              Browse all categories
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Product Grid Component
function ProductGrid({ 
  initialProducts, 
  storeSettings 
}: { 
  initialProducts: (ProductsResponse & { expand: { categories: CategoriesResponse[] } })[]
  storeSettings: StoresResponse | null
}) { 
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const loaderData = Route.useLoaderData()
  const [allProducts, setAllProducts] = useState<(ProductsResponse & { expand: { categories: CategoriesResponse[] } })[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(loaderData.hasMore)
  const [page, setPage] = useState(2)
  const availableCategories = loaderData.availableCategories

  // Reset products when search params change
  useEffect(() => {
    setAllProducts(initialProducts)
    setPage(2)
    setHasMore(loaderData.hasMore)
  }, [initialProducts, loaderData.hasMore])

  // Filters state
  const searchTerm = search.search || ''
  const sortBy: SortOption = search.sortBy || 'newest'
  const filters: ProductFilters = {
    categories: search.categories || [],
    priceRange: { 
      min: search.minPrice || 0, 
      max: search.maxPrice || 1000 
    },
    inStock: search.inStock ? search.inStock === 'true' : null,
    sortBy
  }

  // Products are already filtered on server, no need for client-side filtering
  const filteredAndSortedProducts = allProducts

  // Infinite scroll: fetch next page from PocketBase with same filters
  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    
    try {
      let filter = 'isActive = true'
      
      if (search.categories && search.categories.length > 0) {
        filter += ` && (${search.categories.map(cat => `categories ~ "${cat}"`).join(' || ')})`
      }
      if (search.minPrice !== undefined) {
        filter += ` && price >= ${search.minPrice}`
      }
      if (search.maxPrice !== undefined) {
        filter += ` && price <= ${search.maxPrice}`
      }
      if (search.inStock === 'true') {
        filter += ` && stockQuantity > 0`
      } else if (search.inStock === 'false') {
        filter += ` && stockQuantity = 0`
      }

      if (search.search && search.search.trim()) {
        const searchTerm = search.search.trim()
        filter += ` && (title ~ "${searchTerm}" || sku ~ "${searchTerm}")`
      }

      let sort = '-created'
      if (search.sortBy === 'name') sort = 'title'
      if (search.sortBy === 'price-low') sort = 'price'
      if (search.sortBy === 'price-high') sort = '-price'
      if (search.sortBy === 'newest') sort = '-created'

      const result = await pb.collection(Collections.Products).getList<ProductsResponse<{ categories: CategoriesResponse[] }>>(page, 24, {
        filter,
        sort,
        expand: 'categories'
      })

      setAllProducts(prev => [...prev, ...result.items])
      setPage(prev => prev + 1)
      setHasMore(page < result.totalPages)
    } catch (error) {
      console.error('Failed to load more products:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, search])

  const updateSearchParams = useCallback((updates: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates })
    })
  }, [navigate])

  const handleSortChange = useCallback((newSort: SortOption) => {
    updateSearchParams({ sortBy: newSort })
  }, [updateSearchParams])

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    const updates: Partial<typeof search> = {
      categories: newFilters.categories.length > 0 ? newFilters.categories : undefined,
      minPrice: newFilters.priceRange.min > 0 ? newFilters.priceRange.min : undefined,
      maxPrice: newFilters.priceRange.max < 1000 ? newFilters.priceRange.max : undefined,
      inStock: newFilters.inStock !== null ? (newFilters.inStock ? 'true' : 'false') : undefined,
    }
    updateSearchParams(updates)
  }, [updateSearchParams])

  const handleSearchChange = useCallback((term: string) => {
    updateSearchParams({ search: term.trim() || undefined })
  }, [updateSearchParams])

  const clearSearch = useCallback(() => {
    updateSearchParams({ search: undefined })
  }, [updateSearchParams])

  const clearFilters = useCallback(() => {
    updateSearchParams({
      categories: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    })
  }, [updateSearchParams])

  const clearAll = useCallback(() => {
    updateSearchParams({
      search: undefined,
      categories: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    })
  }, [updateSearchParams])

  // Infinite scroll hook
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return
      const scrollTop = document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        loadMoreProducts()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreProducts, hasMore, loading])

  const activeFiltersCount = 
    filters.categories.length + 
    (filters.inStock !== null ? 1 : 0) +
    (filters.priceRange.min > 0 || filters.priceRange.max < 1000 ? 1 : 0)
  const totalActiveFilters = activeFiltersCount + (searchTerm.trim() ? 1 : 0)

  return (
    <div className="space-y-6">
      <div className="w-full max-w-md mx-auto lg:max-w-lg">
        <SearchInput 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center gap-4">
          <FilterDrawer 
            onFiltersChange={handleFiltersChange}
            currentFilters={filters}
            availableCategories={availableCategories}
          />
          {totalActiveFilters > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all ({totalActiveFilters})
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 lg:text-base">
            {filteredAndSortedProducts.length} products
          </p>
          <SortDropdown onSortChange={handleSortChange} currentSort={sortBy} />
        </div>
      </div>
      {filteredAndSortedProducts.length === 0 && !loading ? (
        <EmptyState
          searchTerm={searchTerm}
          activeFiltersCount={activeFiltersCount}
          onClearSearch={clearSearch}
          onClearFilters={clearFilters}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {filteredAndSortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} storeSettings={storeSettings} />
            ))}
          </div>
          {loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          )}
          {!hasMore && filteredAndSortedProducts.length > 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm lg:text-base">
                You've reached the end of our product catalog
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Back to Top
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
