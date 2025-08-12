import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, ZoomIn, Heart, Share2, Star, Minus, Plus, ShoppingCart, ChevronRight as ChevronRightBreadcrumb, ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState, useRef, useEffect } from 'react'

// Mock data types extending the home page structure
interface MockProductVariant {
  id: string;
  name: string;
  value: string;
  type: 'color' | 'size' | 'material';
  price?: number;
  image?: string;
  inStock: boolean;
}

interface MockProductDetail {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  inStock: boolean;
  stockQuantity: number;
  description: string;
  slug: string;
  variants: MockProductVariant[];
  specifications: { label: string; value: string }[];
  reviews: { rating: number; count: number };
  brand: string;
  sku: string;
  relatedProducts: MockProduct[];
}

interface MockProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  inStock: boolean;
  description?: string;
  slug: string;
}

// Route configuration
export const Route = createFileRoute('/(public)/products/$productSlug')({
  loader: ({ params }) => {
    // Mock product data based on slug
    return {
      product: {
        id: '1',
        name: 'Wireless Bluetooth Headphones Pro Max',
        price: 79.99,
        originalPrice: 99.99,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop'
        ],
        category: 'Electronics',
        inStock: true,
        stockQuantity: 15,
        description: 'Experience premium sound quality with our latest wireless headphones featuring advanced noise cancellation technology, 30-hour battery life, and crystal-clear audio for music and calls.',
        slug: params.productSlug,
        brand: 'AudioTech',
        sku: 'AT-BH-001',
        variants: [
          { id: '1', name: 'Color', value: 'Black', type: 'color', inStock: true },
          { id: '2', name: 'Color', value: 'White', type: 'color', inStock: true },
          { id: '3', name: 'Color', value: 'Silver', type: 'color', inStock: false },
          { id: '4', name: 'Size', value: 'Standard', type: 'size', inStock: true },
          { id: '5', name: 'Size', value: 'Large', type: 'size', inStock: true, price: 89.99 },
        ],
        specifications: [
          { label: 'Driver Size', value: '40mm' },
          { label: 'Frequency Response', value: '20Hz - 20kHz' },
          { label: 'Battery Life', value: '30 hours' },
          { label: 'Charging Time', value: '2 hours' },
          { label: 'Weight', value: '250g' },
          { label: 'Connectivity', value: 'Bluetooth 5.0, USB-C' }
        ],
        reviews: { rating: 4.8, count: 324 },
        relatedProducts: [
          {
            id: '2',
            name: 'Wireless Earbuds Pro',
            price: 129.99,
            originalPrice: 149.99,
            image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop',
            images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop'],
            category: 'Electronics',
            inStock: true,
            description: 'Premium wireless earbuds with active noise cancellation',
            slug: 'wireless-earbuds-pro'
          },
          {
            id: '3',
            name: 'Bluetooth Speaker',
            price: 79.99,
            image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
            images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop'],
            category: 'Electronics',
            inStock: true,
            description: 'Portable Bluetooth speaker with rich sound',
            slug: 'bluetooth-speaker'
          },
          {
            id: '4',
            name: 'USB-C Charging Cable',
            price: 19.99,
            originalPrice: 24.99,
            image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=400&fit=crop',
            images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&h=400&fit=crop'],
            category: 'Electronics',
            inStock: true,
            description: 'Fast charging USB-C cable',
            slug: 'usb-c-charging-cable'
          },
          {
            id: '5',
            name: 'Phone Stand',
            price: 29.99,
            image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop',
            images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop'],
            category: 'Electronics',
            inStock: false,
            description: 'Adjustable phone stand for desk',
            slug: 'phone-stand'
          }
        ],
      } as MockProductDetail,
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        { label: 'Electronics', href: '/products?category=electronics' },
        { label: 'Wireless Bluetooth Headphones Pro Max' } // Current product, no href
      ]
    }
  },
  component: RouteComponent,
})

// Image Gallery Component with mobile swipe and desktop zoom
function ImageGallery({ images }: { images: string[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const galleryRef = useRef<HTMLImageElement>(null)

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextImage()
    }
    if (isRightSwipe) {
      prevImage()
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          ref={galleryRef}
          src={images[currentImageIndex]}
          alt={`Product image ${currentImageIndex + 1}`}
          className={`w-full h-full object-cover transition-transform duration-300 cursor-pointer lg:cursor-zoom-in ${
            isZoomed ? 'scale-150 lg:scale-200' : 'scale-100'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={toggleZoom}
        />
        
        {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg hidden lg:flex"
          onClick={prevImage}
          disabled={images.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg hidden lg:flex"
          onClick={nextImage}
          disabled={images.length <= 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Zoom Icon - Desktop only */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white shadow-lg hidden lg:flex"
          onClick={toggleZoom}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
              index === currentImageIndex
                ? 'border-primary shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Mobile Swipe Indicator */}
      <div className="flex justify-center gap-1 lg:hidden">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentImageIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

// Variant Selector Component
function VariantSelector({ 
  variants, 
  selectedVariants, 
  onVariantChange 
}: { 
  variants: MockProductVariant[]
  selectedVariants: Record<string, string>
  onVariantChange: (type: string, value: string) => void
}) {
  // Group variants by type
  const variantGroups = variants.reduce((groups, variant) => {
    if (!groups[variant.type]) {
      groups[variant.type] = []
    }
    groups[variant.type].push(variant)
    return groups
  }, {} as Record<string, MockProductVariant[]>)

  return (
    <div className="space-y-4">
      {Object.entries(variantGroups).map(([type, typeVariants]) => (
        <div key={type} className="space-y-2">
          <h4 className="font-medium capitalize text-sm">
            {type}: <span className="font-normal text-gray-600">{selectedVariants[type] || 'Select'}</span>
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {typeVariants.map((variant) => {
              const isSelected = selectedVariants[type] === variant.value
              const isAvailable = variant.inStock
              
              return (
                <Button
                  key={variant.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  disabled={!isAvailable}
                  onClick={() => onVariantChange(type, variant.value)}
                  className={`h-10 px-4 transition-all duration-200 ${
                    !isAvailable 
                      ? 'opacity-50 cursor-not-allowed' 
                      : isSelected 
                        ? 'ring-2 ring-primary/20' 
                        : 'hover:border-primary/50'
                  } ${
                    type === 'color' ? 'min-w-[80px]' : 'min-w-[60px]'
                  }`}
                >
                  <span className="text-xs font-medium">
                    {variant.value}
                    {variant.price && (
                      <span className="block text-xs text-gray-500 font-normal">
                        +${(variant.price - 79.99).toFixed(2)}
                      </span>
                    )}
                  </span>
                  {!isAvailable && (
                    <span className="ml-1 text-xs opacity-60">✕</span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Quantity Selector Component
function QuantitySelector({
  quantity,
  maxQuantity,
  onQuantityChange,
  disabled = false
}: {
  quantity: number
  maxQuantity: number
  onQuantityChange: (quantity: number) => void
  disabled?: boolean
}) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      onQuantityChange(value)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Quantity</h4>
        <span className="text-xs text-gray-500">
          {maxQuantity > 0 ? `${maxQuantity} available` : 'Out of stock'}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
            onClick={handleDecrease}
            disabled={disabled || quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            disabled={disabled}
            min="1"
            max={maxQuantity}
            className="w-16 h-10 text-center text-sm font-medium border-0 border-l border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500"
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
            onClick={handleIncrease}
            disabled={disabled || quantity >= maxQuantity}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Stock warning */}
        {maxQuantity > 0 && maxQuantity <= 5 && (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs">
            Low Stock
          </Badge>
        )}
      </div>
      
      {/* Quantity validation message */}
      {quantity >= maxQuantity && maxQuantity > 0 && (
        <p className="text-xs text-orange-600">
          Maximum quantity available: {maxQuantity}
        </p>
      )}
    </div>
  )
}

// Add to Cart Button Component
function AddToCartButton({
  product,
  selectedVariants,
  quantity,
  stockStatus,
  totalPrice,
  disabled = false
}: {
  product: MockProductDetail
  selectedVariants: Record<string, string>
  quantity: number
  stockStatus: { inStock: boolean; quantity: number }
  totalPrice: number
  disabled?: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async () => {
    if (!stockStatus.inStock || quantity > stockStatus.quantity) return

    setIsLoading(true)
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would typically:
      // 1. Add item to cart context/state
      // 2. Show success feedback
      // 3. Update cart count in header
      
      console.log('Added to cart:', {
        productId: product.id,
        productName: product.name,
        selectedVariants,
        quantity,
        price: totalPrice,
        timestamp: new Date().toISOString()
      })
      
      // TODO: Integrate with cart context when implemented
      
    } catch (error) {
      console.error('Failed to add to cart:', error)
      // TODO: Show error feedback
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = disabled || !stockStatus.inStock || quantity > stockStatus.quantity || isLoading

  return (
    <Button 
      size="lg" 
      className="flex-1 h-12 text-base font-semibold"
      disabled={isDisabled}
      onClick={handleAddToCart}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Adding...
        </>
      ) : !stockStatus.inStock ? (
        'Out of Stock'
      ) : (
        <>
          Add {quantity > 1 ? `${quantity} ` : ''}to Cart
          {quantity > 1 && (
            <span className="ml-2 text-sm opacity-90">
              (${totalPrice.toFixed(2)})
            </span>
          )}
        </>
      )}
    </Button>
  )
}

// Specifications Accordion Component
function SpecificationsAccordion({ 
  specifications 
}: { 
  specifications: { label: string; value: string }[] 
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full justify-between p-0 h-auto font-semibold text-left hover:bg-transparent"
        >
          <span>Specifications</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <div className="grid gap-3">
          {specifications.map((spec, index) => (
            <div
              key={index}
              className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
            >
              <span className="text-sm text-gray-600 font-medium">{spec.label}</span>
              <span className="text-sm text-gray-900">{spec.value}</span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Reviews Summary Component
function ReviewsSummary({ 
  reviews 
}: { 
  reviews: { rating: number; count: number } 
}) {
  // Mock review highlights data
  const reviewHighlights = [
    { rating: 5, count: 156, percentage: 48 },
    { rating: 4, count: 98, percentage: 30 },
    { rating: 3, count: 45, percentage: 14 },
    { rating: 2, count: 16, percentage: 5 },
    { rating: 1, count: 9, percentage: 3 }
  ]

  const mockRecentReviews = [
    {
      id: 1,
      author: "Sarah M.",
      rating: 5,
      comment: "Amazing sound quality and comfortable fit. Battery life is excellent!",
      date: "2 days ago",
      verified: true
    },
    {
      id: 2,
      author: "Mike R.",
      rating: 4,
      comment: "Great headphones, only wish they were a bit lighter.",
      date: "1 week ago",
      verified: true
    },
    {
      id: 3,
      author: "Emma L.",
      rating: 5,
      comment: "Perfect for working from home. Noise cancellation works great.",
      date: "2 weeks ago",
      verified: false
    }
  ]

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Customer Reviews</h3>
      
      {/* Overall Rating Summary */}
      <div className="flex items-start gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{reviews.rating}</div>
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(reviews.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500">{reviews.count} reviews</div>
        </div>
        
        {/* Rating Breakdown */}
        <div className="flex-1 space-y-1">
          {reviewHighlights.map((highlight) => (
            <div key={highlight.rating} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-gray-600">{highlight.rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${highlight.percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-500">{highlight.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm">Recent Reviews</h4>
        <div className="space-y-4">
          {mockRecentReviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{review.author}</span>
                  {review.verified && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      Verified
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">{review.date}</span>
              </div>
              
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
        
        <Button variant="outline" size="sm" className="w-full">
          View All Reviews
        </Button>
      </div>
    </div>
  )
}

// Product Info Component
function ProductInfo({ 
  product, 
  selectedVariants, 
  quantity, 
  onVariantChange, 
  onQuantityChange 
}: { 
  product: MockProductDetail
  selectedVariants?: Record<string, string>
  quantity?: number
  onVariantChange?: (type: string, value: string) => void
  onQuantityChange?: (newQuantity: number) => void
}) {
  const [internalSelectedVariants, setInternalSelectedVariants] = useState<Record<string, string>>(selectedVariants || {})
  const [internalQuantity, setInternalQuantity] = useState(quantity || 1)
  
  // Use props if provided, otherwise use internal state
  const currentSelectedVariants = selectedVariants !== undefined ? selectedVariants : internalSelectedVariants
  const currentQuantity = quantity !== undefined ? quantity : internalQuantity
  
  // Calculate current price based on selected variants
  const getCurrentPrice = () => {
    let currentPrice = product.price
    
    // Check if any selected variant affects the price
    product.variants.forEach((variant: MockProductVariant) => {
      if (currentSelectedVariants[variant.type] === variant.value && variant.price) {
        currentPrice = variant.price
      }
    })
    
    return currentPrice
  }
  
  // Calculate total price based on quantity
  const getTotalPrice = () => {
    return getCurrentPrice() * currentQuantity
  }
  
  // Check if current variant combination is in stock
  const getStockStatus = () => {
    // If no variants selected, return product stock
    if (Object.keys(currentSelectedVariants).length === 0) {
      return { inStock: product.inStock, quantity: product.stockQuantity }
    }
    
    // Check if all selected variants are in stock
    const selectedVariantObjects = product.variants.filter((variant: MockProductVariant) => 
      currentSelectedVariants[variant.type] === variant.value
    )
    
    const allInStock = selectedVariantObjects.every((variant: MockProductVariant) => variant.inStock)
    
    return { 
      inStock: allInStock && product.inStock, 
      quantity: allInStock ? product.stockQuantity : 0 
    }
  }
  
  const handleVariantChange = (type: string, value: string) => {
    if (onVariantChange) {
      onVariantChange(type, value)
    } else {
      setInternalSelectedVariants(prev => ({
        ...prev,
        [type]: value
      }))
      setInternalQuantity(1)
    }
  }
  
  const handleQuantityChange = (newQuantity: number) => {
    if (onQuantityChange) {
      onQuantityChange(newQuantity)
    } else {
      setInternalQuantity(newQuantity)
    }
  }
  
  const currentPrice = getCurrentPrice()
  const totalPrice = getTotalPrice()
  const stockStatus = getStockStatus()
  const hasDiscount = product.originalPrice && product.originalPrice > currentPrice
  const discountPercentage = hasDiscount && product.originalPrice
    ? Math.round(((product.originalPrice - currentPrice) / product.originalPrice) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="space-y-2">
        <Badge variant="secondary" className="text-xs">
          {product.category}
        </Badge>
        <h1 className="text-2xl lg:text-4xl font-bold leading-tight">
          {product.name}
        </h1>
        <p className="text-sm text-gray-600">
          by {product.brand} • SKU: {product.sku}
        </p>
      </div>

      {/* Reviews */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.floor(product.reviews.rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{product.reviews.rating}</span>
        <span className="text-sm text-gray-600">({product.reviews.count} reviews)</span>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-primary">
            ${currentPrice.toFixed(2)}
          </span>
          {hasDiscount && product.originalPrice && (
            <>
              <span className="text-xl text-gray-500 line-through">
                ${product.originalPrice}
              </span>
              <Badge className="bg-red-500 hover:bg-red-600">
                -{discountPercentage}% OFF
              </Badge>
            </>
          )}
        </div>
        
        {/* Total Price Display */}
        {currentQuantity > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total:</span>
            <span className="text-lg font-semibold text-primary">
              ${totalPrice.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">
              ({currentQuantity} × ${currentPrice.toFixed(2)})
            </span>
          </div>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          stockStatus.quantity > 10 ? 'bg-green-500' : 
          stockStatus.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
        }`} />
        <span className="text-sm font-medium">
          {stockStatus.quantity > 10 ? 'In Stock' : 
           stockStatus.quantity > 0 ? `Only ${stockStatus.quantity} left!` : 'Out of Stock'}
        </span>
      </div>

      {/* Variant Selector */}
      {product.variants.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Options</h3>
          <VariantSelector 
            variants={product.variants}
            selectedVariants={currentSelectedVariants}
            onVariantChange={handleVariantChange}
          />
        </div>
      )}

      {/* Quantity Selector */}
      {stockStatus.inStock && (
        <QuantitySelector
          quantity={currentQuantity}
          maxQuantity={stockStatus.quantity}
          onQuantityChange={handleQuantityChange}
          disabled={!stockStatus.inStock}
        />
      )}

      {/* Description */}
      <div className="space-y-2">
        <h3 className="font-semibold">Description</h3>
        <p className="text-gray-600 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Specifications Accordion */}
      <SpecificationsAccordion specifications={product.specifications} />

      {/* Reviews Summary */}
      <ReviewsSummary reviews={product.reviews} />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <AddToCartButton
          product={product}
          selectedVariants={currentSelectedVariants}
          quantity={currentQuantity}
          stockStatus={stockStatus}
          totalPrice={totalPrice}
        />
        <Button variant="outline" size="lg" className="h-12 px-4">
          <Heart className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="lg" className="h-12 px-4">
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}

// Related Products Component
function RelatedProducts({ products }: { products: MockProduct[] }) {
  if (!products || products.length === 0) return null

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold lg:text-xl">You might also like</h3>
      
      {/* Horizontal scrolling container */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-48 snap-start cursor-pointer group"
              onClick={() => {
                // Navigate to product page
                window.location.href = `/products/${product.slug}`
              }}
            >
              <Card className="h-full overflow-hidden group-hover:shadow-lg transition-shadow duration-200">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
                    </div>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-xs">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-3 space-y-2">
                  {/* Category */}
                  <Badge variant="secondary" className="text-xs text-gray-600 bg-gray-100">
                    {product.category}
                  </Badge>
                  
                  {/* Product Name */}
                  <h4 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                  
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">
                      ${product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  {/* Add to Cart Button */}
                  <Button
                    size="sm"
                    className="w-full text-xs h-8 mt-2"
                    disabled={!product.inStock}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Handle add to cart for related product
                      console.log('Add to cart:', product.id)
                    }}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Scroll indicators for mobile */}
        <div className="flex justify-center gap-1 mt-2 lg:hidden">
          {products.map((_, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full bg-gray-300"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Sticky Add to Cart Bar Component
function StickyAddToCartBar({
  product,
  selectedVariants,
  quantity,
  stockStatus,
  totalPrice,
  onQuantityChange,
  isVisible
}: {
  product: MockProductDetail
  selectedVariants: Record<string, string>
  quantity: number
  stockStatus: { inStock: boolean; quantity: number }
  totalPrice: number
  onQuantityChange: (quantity: number) => void
  isVisible: boolean
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToCart = async () => {
    if (!stockStatus.inStock || quantity > stockStatus.quantity) return

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Added to cart from sticky bar:', {
        productId: product.id,
        productName: product.name,
        selectedVariants,
        quantity,
        price: totalPrice,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleQuantityIncrease = () => {
    if (quantity < stockStatus.quantity) {
      onQuantityChange(quantity + 1)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg lg:hidden">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Product Image and Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-10 h-10 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium truncate">{product.name}</h4>
              <p className="text-sm font-bold text-primary">
                ${totalPrice.toFixed(2)}
                {quantity > 1 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({quantity} × ${(totalPrice / quantity).toFixed(2)})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-none border-0"
              onClick={handleQuantityDecrease}
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            
            <span className="px-3 py-1 text-sm font-medium min-w-[40px] text-center border-l border-r border-gray-300">
              {quantity}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-none border-0"
              onClick={handleQuantityIncrease}
              disabled={quantity >= stockStatus.quantity}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Add to Cart Button */}
          <Button
            size="sm"
            className="h-10 px-4 font-semibold"
            disabled={!stockStatus.inStock || quantity > stockStatus.quantity || isLoading}
            onClick={handleAddToCart}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Breadcrumbs Component
function Breadcrumbs({ 
  items 
}: { 
  items: { label: string; href?: string }[] 
}) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6 overflow-x-auto scrollbar-hide">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1 flex-shrink-0">
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-gray-700 transition-colors duration-200"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRightBreadcrumb className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      ))}
    </nav>
  )
}

function RouteComponent() {
  const { product, breadcrumbs } = Route.useLoaderData()
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [showStickyBar, setShowStickyBar] = useState(false)

  // Calculate states (same logic as in ProductInfo)
  const getCurrentPrice = () => {
    let currentPrice = product.price
    product.variants.forEach((variant: MockProductVariant) => {
      if (selectedVariants[variant.type] === variant.value && variant.price) {
        currentPrice = variant.price
      }
    })
    return currentPrice
  }

  const getStockStatus = () => {
    if (Object.keys(selectedVariants).length === 0) {
      return { inStock: product.inStock, quantity: product.stockQuantity }
    }
    
    const selectedVariantObjects = product.variants.filter((variant: MockProductVariant) => 
      selectedVariants[variant.type] === variant.value
    )
    
    const allInStock = selectedVariantObjects.every((variant: MockProductVariant) => variant.inStock)
    
    return { 
      inStock: allInStock && product.inStock, 
      quantity: allInStock ? product.stockQuantity : 0 
    }
  }

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }))
    setQuantity(1)
  }

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }

  const currentPrice = getCurrentPrice()
  const totalPrice = currentPrice * quantity
  const stockStatus = getStockStatus()

  // Scroll detection for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when user scrolls down past the main add to cart button
      // Approximate position: after the product info section
      const scrollPosition = window.scrollY
      const shouldShow = scrollPosition > 400 // Adjust this value as needed
      setShowStickyBar(shouldShow)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-12">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="order-1">
            <ImageGallery images={product.images} />
          </div>
          
          {/* Product Information */}
          <div className="order-2">
            <ProductInfo 
              product={product}
              selectedVariants={selectedVariants}
              quantity={quantity}
              onVariantChange={handleVariantChange}
              onQuantityChange={handleQuantityChange}
            />
          </div>
        </div>
        
        {/* Related Products Section */}
        <div className="mt-12 lg:mt-20">
          <RelatedProducts products={product.relatedProducts} />
        </div>
      </div>

      {/* Sticky Add to Cart Bar */}
      <StickyAddToCartBar
        product={product}
        selectedVariants={selectedVariants}
        quantity={quantity}
        stockStatus={stockStatus}
        totalPrice={totalPrice}
        onQuantityChange={handleQuantityChange}
        isVisible={showStickyBar}
      />
    </div>
  )
}
