import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Package, Plus, Search, MoreHorizontal, Edit, Eye, Trash2, Copy, CheckSquare, Filter, Download, X } from 'lucide-react'
import type { ProductsResponse, CategoriesResponse, StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/products/')({
  loader: async () => {
    try {
      const [products, categories, storeSettings] = await Promise.all([
        pb.collection(Collections.Products).getFullList<ProductsResponse<{ categories: CategoriesResponse[] }>>({
          expand: 'categories',
          sort: '-created',
          requestKey: `products-list-${Date.now()}`
        }),
        pb.collection(Collections.Categories).getFullList<CategoriesResponse>({
          requestKey: `categories-list-${Date.now()}`
        }),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-${Date.now()}`
        }).catch(() => null)
      ])
      
      return { 
        products, 
        categories,
        storeSettings,
        totalProducts: products.length,
        search: { q: '', category: '', status: '', stockStatus: '' }
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      return { 
        products: [], 
        categories: [],
        storeSettings: null,
        totalProducts: 0,
        search: { q: '', category: '', status: '', stockStatus: '' }
      }
    }
  },
  component: ProductsComponent,
})

function ProductsComponent() {
  const { products: loaderProducts, categories, storeSettings } = Route.useLoaderData()
  
  const [products, setProducts] = useState(loaderProducts)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilters, setShowFilters] = useState(false)
  const [_viewMode, _setViewMode] = useState<'table' | 'cards'>('table')

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

  const getStockStatus = (product: ProductsResponse) => {
    const stock = product.stockQuantity ?? 0
    const reorder = product.reorderLevel ?? 0
    
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200', warning: true }
    if (stock <= reorder) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', warning: true }
    return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200', warning: false }
  }

  const getProductImage = (product: ProductsResponse) => {
    if (product.featured_image) {
      return pb.files.getUrl(product, product.featured_image, { thumb: '50x50' })
    }
    if (product.images && product.images.length > 0) {
      return pb.files.getUrl(product, product.images[0], { thumb: '50x50' })
    }
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=50&h=50&fit=crop'
  }

  const handleProductSelect = (productId: string, selected: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (selected) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }



  const handleDeleteProduct = async (productId: string) => {
    setConfirmDeleteId(productId)
  }

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      try {
        await pb.collection(Collections.Products).delete(confirmDeleteId, {
          requestKey: `product-delete-${confirmDeleteId}-${Date.now()}`
        })
        setProducts(products.filter(product => product.id !== confirmDeleteId))
        setSelectedProducts(prev => {
          const newSet = new Set(prev)
          newSet.delete(confirmDeleteId)
          return newSet
        })
        setConfirmDeleteId(null)
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const handleToggleStatus = async (productId?: string) => {
    try {
      if (productId) {
        const product = products.find(p => p.id === productId)
        if (!product) return
        
        await pb.collection(Collections.Products).update(productId, {
          isActive: !product.isActive
        }, {
          requestKey: `toggle-status-${productId}-${Date.now()}`
        })
        
        setProducts(products =>
          products.map(product =>
            product.id === productId
              ? { ...product, isActive: !product.isActive }
              : product
          )
        )
      }
    } catch (error) {
      console.error('Failed to toggle product status:', error)
    }
  }

  const handleDuplicateProduct = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

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

      window.location.reload()
    } catch (error) {
      console.error('Failed to duplicate product:', error)
    }
  }

  const confirmBulkDeleteAction = async () => {
    try {
      await Promise.all(Array.from(selectedProducts).map(id =>
        pb.collection(Collections.Products).delete(id, {
          requestKey: `bulk-delete-${id}-${Date.now()}`
        })
      ))
      setProducts(products.filter(product => !selectedProducts.has(product.id)))
      setSelectedProducts(new Set())
      setConfirmBulkDelete(false)
    } catch (error) {
      console.error('Failed to bulk delete products:', error)
    }
  }

  // Filter and search products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || 
      product.categories.includes(selectedCategory)
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive)
    
    const stock = product.stockQuantity ?? 0
    const reorder = product.reorderLevel ?? 0
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'in-stock' && stock > reorder) ||
      (stockFilter === 'low-stock' && stock <= reorder && stock > 0) ||
      (stockFilter === 'out-of-stock' && stock === 0)
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'stock':
        return (b.stockQuantity ?? 0) - (a.stockQuantity ?? 0)
      case 'newest':
      default:
        return new Date(b.created).getTime() - new Date(a.created).getTime()
    }
  })

  // Bulk actions
  const handleBulkStatusToggle = async (activate: boolean) => {
    if (selectedProducts.size === 0) return
    
    setLoading(true)
    try {
      await Promise.all(Array.from(selectedProducts).map(id =>
        pb.collection(Collections.Products).update(id, {
          isActive: activate
        }, {
          requestKey: `bulk-status-${id}-${Date.now()}`
        })
      ))
      
      setProducts(products =>
        products.map(product =>
          selectedProducts.has(product.id)
            ? { ...product, isActive: activate }
            : product
        )
      )
      setSelectedProducts(new Set())
    } catch (error) {
      console.error('Failed to update product status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportProducts = () => {
    const exportData = filteredProducts.map(product => ({
      Title: product.title,
      SKU: product.sku || '',
      Price: product.price,
      Cost: product.cost,
      Stock: product.stockQuantity ?? 0,
      Status: product.isActive ? 'Active' : 'Inactive',
      Categories: Array.isArray((product.expand as any)?.categories) 
        ? (product.expand as any).categories.map((cat: any) => cat.name).join(', ')
        : '',
      Created: new Date(product.created).toLocaleDateString()
    }))
    
    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setStatusFilter('all')
    setStockFilter('all')
    setSortBy('newest')
  }

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || stockFilter !== 'all'

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Products
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your store's product inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportProducts} className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button asChild className="shrink-0 h-10 px-4">
              <Link to="/dashboard/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Desktop Filters */}
              <div className="hidden lg:flex gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="price-low">Price Low</SelectItem>
                    <SelectItem value="price-high">Price High</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mobile Filter Button */}
              <div className="flex lg:hidden gap-2">
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                          •
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filter Products</SheetTitle>
                      <SheetDescription>
                        Refine your product search with filters
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="inactive">Inactive</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="space-y-2">
                        <Label>Stock Status</Label>
                        <Tabs value={stockFilter} onValueChange={setStockFilter}>
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="in-stock">In Stock</TabsTrigger>
                          </TabsList>
                          <TabsList className="grid w-full grid-cols-2 mt-2">
                            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
                            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="name">Name A-Z</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="stock">Stock Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={resetFilters}
                          className="flex-1"
                          disabled={!hasActiveFilters}
                        >
                          Reset
                        </Button>
                        <Button 
                          onClick={() => setShowFilters(false)}
                          className="flex-1"
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button variant="outline" size="sm" onClick={handleExportProducts}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {searchQuery}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {categories.find(c => c.id === selectedCategory)?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setSelectedCategory('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setStatusFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {stockFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Stock: {stockFilter.replace('-', ' ')}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-auto p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setStockFilter('all')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Products ({filteredProducts.length})
                {filteredProducts.length !== products.length && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    of {products.length} total
                  </span>
                )}
              </span>
              {selectedProducts.size > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBulkStatusToggle(true)}
                          disabled={loading}
                        >
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Activate ({selectedProducts.size})
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Make selected products active</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkStatusToggle(false)}
                    disabled={loading}
                  >
                    Deactivate ({selectedProducts.size})
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setConfirmBulkDelete(true)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedProducts.size})
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 w-12">
                        <Checkbox
                          checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
                            } else {
                              setSelectedProducts(new Set())
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3 font-medium text-gray-900">Product</th>
                      <th className="text-left p-3 font-medium text-gray-900 hidden sm:table-cell">SKU</th>
                      <th className="text-left p-3 font-medium text-gray-900">Stock</th>
                      <th className="text-left p-3 font-medium text-gray-900 hidden md:table-cell">Price</th>
                      <th className="text-left p-3 font-medium text-gray-900 hidden lg:table-cell">Status</th>
                      <th className="text-right p-3 font-medium text-gray-900 w-12">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product)
                      const isSelected = selectedProducts.has(product.id)
                      const hasDiscount = product.old_price && product.old_price > product.price

                      return (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <img
                                  src={getProductImage(product)}
                                  alt={product.title}
                                  className="w-12 h-12 sm:w-10 sm:h-10 object-cover rounded-lg border"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                  {product.title}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.isArray((product.expand as any)?.categories) &&
                                    (product.expand as any).categories.slice(0, 2).map((cat: any) => (
                                      <Badge key={cat.id} variant="secondary" className="text-xs">
                                        {cat.name}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <span className="text-sm font-mono text-gray-600">
                              {product.sku || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <Badge className={`text-xs ${stockStatus.color}`}>
                                {stockStatus.label}
                              </Badge>
                              <p className="text-xs text-gray-500">
                                {product.stockQuantity ?? 0} units
                              </p>
                            </div>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <div className="space-y-1">
                              {hasDiscount ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-red-600">
                                    {formatPrice(product.price)}
                                  </span>
                                  <span className="text-xs text-gray-500 line-through">
                                    {formatPrice(product.old_price!)}
                                  </span>
                                </div>
                              ) : (
                                <p className="font-medium text-gray-900">
                                  {formatPrice(product.price)}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                Cost: {formatPrice(product.cost)}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 hidden lg:table-cell">
                            <Badge variant={product.isActive ? 'default' : 'secondary'}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link to="/dashboard/products/$productSlug" params={{ productSlug: product.slug }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to="/dashboard/products/$productSlug/edit" params={{ productSlug: product.slug }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Product
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateProduct(product.id)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(product.id)}>
                                  <CheckSquare className="mr-2 h-4 w-4 text-green-600" />
                                  {product.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                {hasActiveFilters ? (
                  <>
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search or filters to find what you're looking for
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      Clear all filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Get started by creating your first product
                    </p>
                    <Button asChild>
                      <Link to="/dashboard/products/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              Are you sure you want to delete this product? This action cannot be undone.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Delete Confirmation Dialog */}
        <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Selected Products</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              Are you sure you want to delete {selectedProducts.size} selected product{selectedProducts.size > 1 ? 's' : ''}? This action cannot be undone.
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmBulkDeleteAction}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
