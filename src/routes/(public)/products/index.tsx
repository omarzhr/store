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
import { useState, useEffect, useCallback, useMemo } from 'react'
import { z } from 'zod'

// Mock data types from implementation plan
interface MockProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  stockQuantity?: number;
  description: string;
  slug: string;
}

interface MockProductFilters {
  categories: string[];
  priceRange: { min: number; max: number };
  inStock: boolean | null;
  sortBy: 'name' | 'price-low' | 'price-high' | 'newest';
}

type SortOption = 'name' | 'price-low' | 'price-high' | 'newest'

// Generate mock products for infinite scroll
const generateMockProducts = (page: number, pageSize: number = 6): MockProduct[] => {
  const categories = ['Electronics', 'Food & Beverage', 'Clothing', 'Sports & Fitness', 'Home & Garden', 'Beauty & Health']
  const products: MockProduct[] = []
  
  for (let i = 0; i < pageSize; i++) {
    const id = (page * pageSize + i + 1).toString()
    const category = categories[Math.floor(Math.random() * categories.length)]
    const hasDiscount = Math.random() > 0.6
    const price = Math.floor(Math.random() * 200) + 10
    const originalPrice = hasDiscount ? Math.floor(price * 1.3) : undefined
    
    products.push({
      id,
      name: `Product ${id} - ${category}`,
      price,
      originalPrice,
      image: `https://images.unsplash.com/photo-${1500000000 + parseInt(id)}?w=400&h=400&fit=crop`,
      category,
      inStock: Math.random() > 0.1,
      stockQuantity: Math.floor(Math.random() * 50),
      description: `High-quality ${category.toLowerCase()} product with premium features`,
      slug: `product-${id}-${category.toLowerCase().replace(/\s+/g, '-')}`
    })
  }
  
  return products
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
  loader: async () => {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      initialProducts: generateMockProducts(0, 6),
      hasMore: true
    }
  },
  component: RouteComponent,
})

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

// Product Grid Skeleton Component
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  )
}

// Product Card Component (reused from home page)
function ProductCard({ product }: { product: MockProduct }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isLowStock = product.inStock && product.stockQuantity && product.stockQuantity <= 10;
  const discountPercentage = hasDiscount && product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  return (
    <Card className="flex flex-col h-full overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-gray-200 hover:border-gray-300">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
          </div>
        )}
        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-xs animate-pulse">
            -{discountPercentage}%
          </Badge>
        )}
        {isLowStock && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-orange-50 text-orange-600 border-orange-200 text-xs">
            Low Stock
          </Badge>
        )}
        {/* Quick view overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button 
            size="sm" 
            variant="secondary"
            className="bg-white/90 text-black hover:bg-white transition-all duration-200"
          >
            Quick View
          </Button>
        </div>
      </div>
      
      <CardContent className="p-3 flex flex-col flex-1">
        {/* Category */}
        <div className="mb-1">
          <Badge variant="secondary" className="text-xs text-gray-600 bg-gray-100">
            {product.category}
          </Badge>
        </div>
        
        <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-tight flex-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">
            ${product.price}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-500 line-through">
              ${product.originalPrice}
            </span>
          )}
        </div>
        
        {/* Stock Information */}
        {product.inStock && product.stockQuantity !== undefined && (
          <div className="flex items-center gap-1 mb-3">
            <div className={`w-2 h-2 rounded-full ${
              product.stockQuantity > 10 ? 'bg-green-500' : 
              product.stockQuantity > 0 ? 'bg-orange-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-600">
              {product.stockQuantity > 10 ? 'In Stock' : 
               product.stockQuantity > 0 ? `Only ${product.stockQuantity} left` : 'Out of Stock'}
            </span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 mt-auto">
        <Button 
          size="sm" 
          className="w-full text-xs h-8 transition-all duration-200 hover:shadow-md"
          disabled={!product.inStock}
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Infinite Scroll Hook
function useInfiniteScroll(callback: () => void, hasMore: boolean, loading: boolean) {
  useEffect(() => {
    const handleScroll = () => {
      if (loading || !hasMore) return
      
      const scrollTop = document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        callback()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [callback, hasMore, loading])
}

// Sort products function
const sortProducts = (products: MockProduct[], sortBy: SortOption): MockProduct[] => {
  const sorted = [...products]
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price)
    case 'newest':
      return sorted.sort((a, b) => parseInt(b.id) - parseInt(a.id))
    default:
      return sorted
  }
}

// Sort Dropdown Component
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

// Search and filter products function
const searchAndFilterProducts = (products: MockProduct[], searchTerm: string, filters: MockProductFilters): MockProduct[] => {
  let filtered = products

  // Apply search filter first
  if (searchTerm.trim()) {
    const search = searchTerm.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search)
    )
  }

  // Apply other filters
  return filtered.filter(product => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false
    }
    
    // Price range filter
    if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
      return false
    }
    
    // Stock filter
    if (filters.inStock !== null && product.inStock !== filters.inStock) {
      return false
    }
    
    return true
  })
}

// Search Input Component with URL sync
function SearchInput({ searchTerm, onSearchChange }: { 
  searchTerm: string
  onSearchChange: (term: string) => void 
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearchTerm, onSearchChange])

  // Sync with external search term changes
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

// Filter products function
const filterProducts = (products: MockProduct[], filters: MockProductFilters): MockProduct[] => {
  return products.filter(product => {
    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false
    }
    
    // Price range filter
    if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
      return false
    }
    
    // Stock filter
    if (filters.inStock !== null && product.inStock !== filters.inStock) {
      return false
    }
    
    return true
  })
}

// Filter Drawer Component with URL sync
function FilterDrawer({ 
  onFiltersChange, 
  currentFilters,
  availableCategories 
}: { 
  onFiltersChange: (filters: MockProductFilters) => void
  currentFilters: MockProductFilters
  availableCategories: string[]
}) {
  const [localFilters, setLocalFilters] = useState<MockProductFilters>(currentFilters)
  const [isOpen, setIsOpen] = useState(false)

  // Sync local filters with current filters when they change
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
    const resetFilters: MockProductFilters = {
      categories: [],
      priceRange: { min: 0, max: 500 },
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
    localFilters.priceRange.max < 500 ||
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
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-base mb-4">Categories</h3>
            <div className="space-y-3">
              {availableCategories.map((category) => (
                <div key={category} className="flex items-center space-x-3">
                  <Checkbox
                    id={category}
                    checked={localFilters.categories.includes(category)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category, checked as boolean)
                    }
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor={category} className="text-sm font-medium cursor-pointer">
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-base mb-4">Price Range</h3>
            <div className="px-3">
              <Slider
                value={[localFilters.priceRange.min, localFilters.priceRange.max]}
                onValueChange={handlePriceRangeChange}
                max={500}
                min={0}
                step={10}
                className="mb-4"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span className="font-medium">${localFilters.priceRange.min}</span>
                <span className="font-medium">${localFilters.priceRange.max}</span>
              </div>
            </div>
          </div>

          {/* Availability */}
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

        {/* Actions */}
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

// Product Grid Component with URL state management
function ProductGrid({ initialProducts }: { initialProducts: MockProduct[] }) {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  
  const [allProducts, setAllProducts] = useState<MockProduct[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  // Initialize state from URL params
  const searchTerm = search.search || ''
  const sortBy: SortOption = search.sortBy || 'newest'
  const filters: MockProductFilters = {
    categories: search.categories || [],
    priceRange: { 
      min: search.minPrice || 0, 
      max: search.maxPrice || 500 
    },
    inStock: search.inStock ? search.inStock === 'true' : null,
    sortBy
  }

  const availableCategories = Array.from(new Set(allProducts.map(p => p.category)))

  // Memoized filtered and sorted products
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = searchAndFilterProducts(allProducts, searchTerm, filters)
    return sortProducts(filtered, sortBy)
  }, [allProducts, searchTerm, filters, sortBy])

  const loadMoreProducts = useCallback(async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newProducts = generateMockProducts(page, 6)
    
    if (page >= 4) {
      setHasMore(false)
    }
    
    setAllProducts(prev => [...prev, ...newProducts])
    setPage(prev => prev + 1)
    setLoading(false)
  }, [page, loading, hasMore])

  const updateSearchParams = useCallback((updates: Partial<typeof search>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates })
    })
  }, [navigate])

  const handleSortChange = useCallback((newSort: SortOption) => {
    updateSearchParams({ sortBy: newSort })
  }, [updateSearchParams])

  const handleFiltersChange = useCallback((newFilters: MockProductFilters) => {
    const updates: Partial<typeof search> = {
      categories: newFilters.categories.length > 0 ? newFilters.categories : undefined,
      minPrice: newFilters.priceRange.min > 0 ? newFilters.priceRange.min : undefined,
      maxPrice: newFilters.priceRange.max < 500 ? newFilters.priceRange.max : undefined,
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

  useInfiniteScroll(loadMoreProducts, hasMore, loading)

  const activeFiltersCount = 
    filters.categories.length + 
    (filters.inStock !== null ? 1 : 0) +
    (filters.priceRange.min > 0 || filters.priceRange.max < 500 ? 1 : 0)

  const totalActiveFilters = activeFiltersCount + (searchTerm.trim() ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="w-full max-w-md mx-auto lg:max-w-lg">
        <SearchInput 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Controls */}
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

      {/* Products or Empty State */}
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
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          )}
          
          {/* End of Results */}
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

function RouteComponent() {
  const { initialProducts } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">All Products</h1>
          <p className="text-sm text-gray-600 mt-1 lg:text-base">
            Discover our complete collection of premium products
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProductGrid initialProducts={initialProducts} />
      </div>
    </div>
  )
}
