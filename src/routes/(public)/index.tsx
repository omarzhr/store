import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { 
  Smartphone, 
  Shirt, 
  Coffee, 
  Home, 
  Dumbbell, 
  Sparkles, 
  BookOpen,
  ShoppingBag,
  Mail,
  ArrowRight,
  Gift,
  Truck
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// Mock data types matching the implementation plan
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

export const Route = createFileRoute('/(public)/')({
  loader: () => {
    return {
      hero: {
        title: "Premium Quality Products",
        subtitle: "Discover amazing deals with cash on delivery",
        ctaText: "Shop Now",
        backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
      },
      categories: [
        { id: '1', name: 'Electronics', count: 45, icon: 'Smartphone' },
        { id: '2', name: 'Clothing', count: 32, icon: 'Shirt' },
        { id: '3', name: 'Food & Beverage', count: 28, icon: 'Coffee' },
        { id: '4', name: 'Home & Garden', count: 19, icon: 'Home' },
        { id: '5', name: 'Sports & Fitness', count: 24, icon: 'Dumbbell' },
        { id: '6', name: 'Beauty & Health', count: 15, icon: 'Sparkles' },
        { id: '7', name: 'Books & Media', count: 12, icon: 'BookOpen' }
      ],
      featuredProducts: [
        {
          id: '1',
          name: 'Wireless Bluetooth Headphones',
          price: 79.99,
          originalPrice: 99.99,
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          category: 'Electronics',
          inStock: true,
          stockQuantity: 15,
          description: 'High-quality wireless headphones with noise cancellation',
          slug: 'wireless-bluetooth-headphones'
        },
        {
          id: '2',
          name: 'Premium Coffee Beans',
          price: 24.99,
          image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
          category: 'Food & Beverage',
          inStock: true,
          stockQuantity: 43,
          description: 'Freshly roasted premium coffee beans',
          slug: 'premium-coffee-beans'
        },
        {
          id: '3',
          name: 'Organic Cotton T-Shirt',
          price: 29.99,
          originalPrice: 39.99,
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
          category: 'Clothing',
          inStock: true,
          stockQuantity: 8,
          description: 'Comfortable organic cotton t-shirt',
          slug: 'organic-cotton-t-shirt'
        },
        {
          id: '4',
          name: 'Smart Fitness Watch',
          price: 199.99,
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
          category: 'Electronics',
          inStock: false,
          stockQuantity: 0,
          description: 'Advanced fitness tracking with heart rate monitor',
          slug: 'smart-fitness-watch'
        }
      ] as MockProduct[],
      promoBanners: [
        {
          id: '1',
          title: 'Free Shipping',
          subtitle: 'On orders over $50',
          icon: 'Truck',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        },
        {
          id: '2',
          title: 'Special Offers',
          subtitle: 'Up to 30% off selected items',
          icon: 'Gift',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        }
      ],
    }
  },
  component: RouteComponent,
})

// Hero Section Component (mobile-optimized)
function HeroSection({ hero }: { hero: any }) {
  return (
    <section 
      className="relative h-[60vh] min-h-[400px] lg:h-[80vh] lg:min-h-[600px] flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${hero.backgroundImage})` }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Hero Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-sm lg:max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-5xl font-bold mb-3 lg:mb-6 leading-tight">
          {hero.title}
        </h1>
        <p className="text-sm lg:text-xl mb-6 lg:mb-8 opacity-90 leading-relaxed">
          {hero.subtitle}
        </p>
        <Button 
          size="lg" 
          className="w-full lg:w-auto lg:px-12 lg:py-6 lg:text-lg bg-white text-black hover:bg-gray-100 font-semibold"
        >
          {hero.ctaText}
        </Button>
      </div>
    </section>
  )
}

// Product Card Component using shadcn Card component
function ProductCard({ product }: { product: MockProduct }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const isLowStock = product.inStock && product.stockQuantity && product.stockQuantity <= 10;
  const discountPercentage = hasDiscount && product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  
  return (
    <Card className="flex flex-col h-full overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-gray-200 hover:border-gray-300 pt-0">
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

// Icon mapping for categories
const getCategoryIcon = (iconName: string) => {
  const icons = {
    Smartphone,
    Shirt,
    Coffee,
    Home,
    Dumbbell,
    Sparkles,
    BookOpen
  }
  return icons[iconName as keyof typeof icons] || ShoppingBag
}

// Category Chips Component with enhanced hover effects
function CategoryChips({ categories }: { categories: { id: string; name: string; count: number; icon: string }[] }) {
  return (
    <section className="py-6 px-4 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 lg:text-xl lg:mb-6">Shop by Category</h2>
        
        {/* Horizontal scrolling container */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:pb-0">
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon)
            return (
              <Button
                key={category.id}
                variant="outline"
                className="flex-shrink-0 whitespace-nowrap px-4 py-3 h-auto text-sm border-gray-200 hover:bg-primary/5 hover:border-primary/30 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 lg:flex-col lg:h-24 lg:justify-center lg:py-4 group"
              >
                <IconComponent className="w-4 h-4 mr-2 text-gray-600 group-hover:text-primary lg:w-5 lg:h-5 lg:mr-0 lg:mb-2 transition-colors" />
                <div className="flex flex-col lg:items-center">
                  <span className="font-medium group-hover:text-primary transition-colors">{category.name}</span>
                  <span className="text-xs text-gray-500 ml-1 lg:ml-0 lg:mt-1">
                    ({category.count})
                  </span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Featured Products Grid (mobile-optimized)
function FeaturedProducts({ products }: { products: MockProduct[] }) {
  return (
    <section className="py-8 lg:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl lg:text-3xl font-bold mb-6 lg:mb-12 text-center">Featured Products</h2>
        
        {/* Grid: 2 columns on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Icon mapping for promo banners
const getPromoIcon = (iconName: string) => {
  const icons = {
    Truck,
    Gift,
    Mail
  }
  return icons[iconName as keyof typeof icons] || Gift
}

// Promotional Banner Component with enhanced hover
function PromoBanner({ banner }: { banner: { id: string; title: string; subtitle: string; icon: string; bgColor: string; textColor: string } }) {
  const IconComponent = getPromoIcon(banner.icon)
  
  return (
    <div className={`${banner.bgColor} ${banner.textColor} rounded-lg p-4 flex items-center gap-3 lg:p-8 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group`}>
      <IconComponent className="w-6 h-6 flex-shrink-0 lg:w-10 lg:h-10 group-hover:scale-110 transition-transform duration-300" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm lg:text-xl lg:mb-1">{banner.title}</h3>
        <p className="text-xs opacity-90 lg:text-base lg:opacity-80">{banner.subtitle}</p>
      </div>
      <ArrowRight className="w-4 h-4 opacity-70 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-300" />
    </div>
  )
}

// Promotional Banners Section
function PromoBanners({ banners }: { banners: Array<{ id: string; title: string; subtitle: string; icon: string; bgColor: string; textColor: string }> }) {
  return (
    <section className="py-6 px-4 bg-gray-50 lg:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
          {banners.map((banner) => (
            <PromoBanner key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Newsletter Signup Component with enhanced interactions
function NewsletterSignup() {
  return (
    <section className="py-12 px-4 bg-white lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-6 lg:mb-12">
          <div className="relative inline-block mb-4 lg:mb-8">
            <Mail className="w-12 h-12 mx-auto text-gray-600 lg:w-20 lg:h-20 hover:text-primary transition-colors duration-300" />
            <div className="absolute -inset-2 bg-primary/10 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </div>
          <h2 className="text-xl font-bold mb-2 lg:text-4xl lg:mb-6">Stay Updated</h2>
          <p className="text-sm text-gray-600 lg:text-lg lg:leading-relaxed lg:max-w-2xl lg:mx-auto">
            Subscribe to our newsletter and be the first to know about new products, exclusive offers, and special deals.
          </p>
        </div>
        
        <div className="flex flex-col gap-3 max-w-md mx-auto lg:flex-row lg:max-w-xl lg:gap-4">
          <Input
            type="email"
            placeholder="Enter your email address"
            className="flex-1 h-12 text-sm lg:h-16 lg:text-lg lg:px-6 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
          />
          <Button 
            size="lg"
            className="h-12 px-6 font-semibold lg:h-16 lg:px-12 lg:text-lg lg:whitespace-nowrap lg:min-w-[160px] hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Subscribe
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 lg:text-base lg:mt-8">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}

function RouteComponent() {
  const { hero, categories, featuredProducts, promoBanners } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection hero={hero} />
      <CategoryChips categories={categories} />
      <PromoBanners banners={promoBanners} />
      <FeaturedProducts products={featuredProducts} />
      <NewsletterSignup />
    </div>
  )
}
