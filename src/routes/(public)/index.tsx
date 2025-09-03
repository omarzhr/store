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
import pb from '@/lib/db'
import { type ProductsResponse, type CategoriesResponse, Collections, type StoresResponse } from '@/lib/types'
import { useNavigate } from '@tanstack/react-router'



export const Route = createFileRoute('/(public)/')({
  loader: async () => {
    try {
      // Fetch store settings first to get home page configuration
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `home-store-settings-${Date.now()}`
      }).catch(() => null)
      
      // Parse settings
      const settings = storeSettings?.checkoutSettings ? 
        (typeof storeSettings.checkoutSettings === 'string' ? 
          JSON.parse(storeSettings.checkoutSettings) : 
          storeSettings.checkoutSettings) : {}

      // Fetch categories based on visibility settings
      const visibleCategoryIds = settings.categories?.visibleCategories || []
      const categoriesResult = await pb.collection(Collections.Categories).getFullList<CategoriesResponse>(100, {
        sort: 'name',
        filter: visibleCategoryIds.length > 0 ? 
          `id ~ "${visibleCategoryIds.join('" || id ~ "')}"` : ''
      })

      // Fetch featured products based on settings
      const featuredLimit = settings.featured?.limit || 4
      const featuredSort = settings.featured?.sortBy === 'price-low' ? 'price' :
                          settings.featured?.sortBy === 'price-high' ? '-price' :
                          settings.featured?.sortBy === 'name' ? 'title' : '-created'
      
      const productsResult = await pb.collection(Collections.Products).getList<ProductsResponse<{ categories: CategoriesResponse[] }>>(
        1, featuredLimit, {
          sort: featuredSort,
          expand: 'categories',
          filter: 'isActive = true'
        }
      )

      // Map categories to UI format with images from Categories collection
      const categories = categoriesResult.map(cat => {
        let imageUrl = null
        
        // Handle category image (now a file field)
        if (cat.image) {
          imageUrl = pb.files.getUrl(cat, cat.image, { thumb: '200x200' })
        }
        
        return {
          id: cat.id,
          name: cat.name,
          count: undefined,
          icon: 'ShoppingBag',
          image: imageUrl
        }
      })

      // Get hero background image from store settings
      const getHeroBackgroundImage = () => {
        if (storeSettings?.heroBackground) {
          return pb.files.getUrl(storeSettings, storeSettings.heroBackground, { thumb: '1200x800' })
        }
        return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
      }

      // Use settings for hero section
      const hero = {
        title: settings.hero?.title || "Premium Quality Products",
        subtitle: settings.hero?.subtitle || "Discover amazing deals with cash on delivery",
        ctaText: settings.hero?.ctaText || "Shop Now",
        ctaLink: settings.hero?.ctaLink || "/products",
        backgroundImage: getHeroBackgroundImage(),
        backgroundLink: settings.hero?.backgroundLink || '',
        enabled: settings.hero?.enabled ?? true
      }

      // Use settings for promo banners - filter enabled ones and add links
      const promoBanners = settings.promoBanners?.enabled ? 
        (settings.promoBanners?.banners || [])
          .filter((banner: any) => banner.enabled)
          .map((banner: any) => ({
            ...banner,
            link: banner.link || ''
          })) : []

      return {
        hero,
        categories: settings.categories?.enabled ? categories : [],
        featuredProducts: settings.featured?.enabled ? productsResult.items : [],
        promoBanners,
        settings: {
          categoriesTitle: settings.categories?.title || 'Shop by Category',
          featuredTitle: settings.featured?.title || 'Featured Products',
          newsletterEnabled: settings.newsletter?.enabled ?? true,
          newsletterTitle: settings.newsletter?.title || 'Stay Updated',
          newsletterSubtitle: settings.newsletter?.subtitle || 'Subscribe to our newsletter and be the first to know about new products, exclusive offers, and special deals.',
          cartEnabled: storeSettings?.is_cart_enabled ?? false,
          checkoutEnabled: settings.checkoutEnabled ?? true,
          categories: settings.categories
        }
      }
    } catch (error) {
      console.error('Failed to load home page data:', error)
      // Return defaults on error
      return {
        hero: {
          title: "Premium Quality Products",
          subtitle: "Discover amazing deals with cash on delivery",
          ctaText: "Shop Now",
          backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
          enabled: true
        },
        categories: [],
        featuredProducts: [],
        promoBanners: [],
        settings: {
          categoriesTitle: 'Shop by Category',
          featuredTitle: 'Featured Products',
          newsletterEnabled: true,
          newsletterTitle: 'Stay Updated',
          newsletterSubtitle: 'Subscribe to our newsletter and be the first to know about new products, exclusive offers, and special deals.',
          cartEnabled: false,
          checkoutEnabled: true
        }
      }
    }
  },
  component: RouteComponent,
})

// Hero Section Component (mobile-optimized)
function HeroSection({ hero }: { hero: any }) {
  const navigate = useNavigate()
  
  const handleCtaClick = () => {
    // Only navigate if there's a link
    if (hero.ctaLink && hero.ctaLink.trim()) {
      if (hero.ctaLink.startsWith('http')) {
        window.open(hero.ctaLink, '_blank', 'noopener,noreferrer')
      } else {
        navigate({ to: hero.ctaLink })
      }
    } else {
      // Default fallback
      navigate({ to: '/products' })
    }
  }

  const handleBackgroundClick = () => {
    if (hero.backgroundLink && hero.backgroundLink.trim()) {
      if (hero.backgroundLink.startsWith('http')) {
        window.open(hero.backgroundLink, '_blank', 'noopener,noreferrer')
      } else {
        navigate({ to: hero.backgroundLink })
      }
    }
  }

  const hasBackgroundLink = hero.backgroundLink && hero.backgroundLink.trim()

  return (
    <section 
      className={`relative h-[60vh] min-h-[400px] lg:h-[80vh] lg:min-h-[600px] flex items-center justify-center bg-cover bg-center bg-no-repeat ${
        hasBackgroundLink ? 'cursor-pointer hover:brightness-110 transition-all duration-300' : ''
      }`}
      style={{ backgroundImage: `url(${hero.backgroundImage})` }}
      onClick={hasBackgroundLink ? handleBackgroundClick : undefined}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Hero Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-sm lg:max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-5xl font-bold mb-3 lg:mb-6 leading-tight">
          {hero.title || 'Premium Quality Products'}
        </h1>
        <p className="text-sm lg:text-xl mb-6 lg:mb-8 opacity-90 leading-relaxed">
          {hero.subtitle || 'Discover amazing deals with cash on delivery'}
        </p>
        {/* Only show button if there's text */}
        {(hero.ctaText || hero.ctaLink) && (
          <Button 
            size="lg" 
            onClick={(e) => {
              e.stopPropagation() // Prevent background click when clicking button
              handleCtaClick()
            }}
            className="w-full lg:w-auto lg:px-12 lg:py-6 lg:text-lg bg-white text-black hover:bg-gray-100 font-semibold"
          >
            {hero.ctaText || 'Shop Now'}
          </Button>
        )}
      </div>
    </section>
  )
}

// Product Card Component using shadcn Card component
function ProductCard({ 
  product, 
  cartEnabled 
}: { 
  product: ProductsResponse<{ categories: CategoriesResponse[] }>,
  cartEnabled: boolean
}) {
  const navigate = useNavigate()
  
  const handleProductClick = () => {
    // Use SKU as slug if available, otherwise fall back to ID
    const productSlug = product.sku || product.id
    navigate({ to: `/products/${productSlug}` })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click when clicking button
    
    // If cart is not enabled, redirect to product page
    if (!cartEnabled) {
      const productSlug = product.sku || product.id
      navigate({ to: `/products/${productSlug}` })
      return
    }
    
    // Add to cart logic here
    console.log('Add to cart:', product.id)
  }

  // Use only fields from ProductsResponse and CategoriesResponse
  const isLowStock = (product.stockQuantity ?? 0) > 0 && (product.stockQuantity ?? 0) <= 10
  
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

  return (
    <Card 
      className="flex flex-col h-full overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-gray-200 hover:border-gray-300 pt-0"
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={getProductImage()} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {(product.stockQuantity ?? 0) === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Out of Stock</Badge>
          </div>
        )}
        {isLowStock && (
          <Badge variant="outline" className="absolute top-2 right-2 bg-orange-50 text-orange-600 border-orange-200 text-xs">
            Low Stock
          </Badge>
        )}
      </div>
      
      <CardContent className="p-3 flex flex-col flex-1">
        {/* Categories */}
        <div className="mb-1 flex flex-wrap gap-1">
          {Array.isArray((product.expand as any)?.categories) &&
            (product.expand as any).categories.map((cat: any) => (
              <Badge key={cat.id} variant="secondary" className="text-xs text-gray-600 bg-gray-100">
                {cat.name}
              </Badge>
            ))}
        </div>
        <h3 className="font-medium text-sm mb-2 line-clamp-2 leading-tight flex-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">
            ${product.price}
          </span>
        </div>
        {/* Stock Information */}
        {product.stockQuantity !== undefined && (
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
          disabled={(product.stockQuantity ?? 0) === 0}
          onClick={handleAddToCart}
        >
          {(product.stockQuantity ?? 0) === 0 ? 'Out of Stock' :
           cartEnabled ? 'Add to Cart' : 'View Details'}
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

// Category Chips Component with redesigned UX
function CategoryChips({ 
  categories, 
  title, 
  showImages 
}: { 
  categories: { id: string; name: string; count?: number; icon: string; image?: string | null }[], 
  title: string,
  showImages?: boolean 
}) {
  const navigate = useNavigate()

  const handleCategoryClick = (categoryId: string) => {
    navigate({ 
      to: '/products',
      search: { categories: [categoryId] }
    })
  }

  if (categories.length === 0) return null

  return (
    <section className="py-8 lg:py-16 px-4 bg-gradient-to-br from-white via-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-2xl lg:text-4xl font-bold mb-3 lg:mb-4 text-gray-900 tracking-tight">{title}</h2>
          <p className="text-gray-600 lg:text-lg max-w-2xl mx-auto">
            Explore our carefully curated product categories
          </p>
        </div>
        
        {/* Mobile: Enhanced cards with better spacing */}
        <div className="lg:hidden">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.icon)
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="flex-shrink-0 flex flex-col items-center p-4 min-w-[100px] bg-white border-2 border-gray-100 rounded-2xl hover:border-primary/30 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 active:scale-95 group"
                >
                  {showImages && category.image ? (
                    <div className="w-16 h-16 mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner group-hover:shadow-lg transition-all duration-300">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl hidden items-center justify-center">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-300 shadow-inner group-hover:shadow-lg">
                      <IconComponent className="w-8 h-8 text-gray-500 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900 text-center leading-tight group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop: Enhanced grid with better proportions */}
        <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.icon)
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group cursor-pointer bg-white border-2 border-gray-100 rounded-3xl p-6 hover:border-primary/30 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 ease-out transform-gpu"
              >
                <div className="flex flex-col items-center text-center">
                  {showImages && category.image ? (
                    <div className="w-20 h-20 lg:w-24 lg:h-24 mb-4 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg group-hover:shadow-xl transition-all duration-500">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl hidden items-center justify-center">
                        <IconComponent className="w-10 h-10 lg:w-12 lg:h-12 text-primary" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 lg:w-24 lg:h-24 mb-4 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 rounded-2xl flex items-center justify-center group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/20 transition-all duration-500 shadow-lg group-hover:shadow-xl">
                      <IconComponent className="w-10 h-10 lg:w-12 lg:h-12 text-gray-500 group-hover:text-primary group-hover:scale-125 transition-all duration-500 ease-out" />
                    </div>
                  )}
                  
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 text-lg lg:text-xl mb-1">
                    {category.name}
                  </h3>
                  
                  {category.count !== undefined && (
                    <p className="text-sm text-gray-500 group-hover:text-primary/70 transition-colors duration-300">
                      {category.count} products
                    </p>
                  )}
                  
                  {/* Hover indicator */}
                  <div className="mt-3 w-0 h-0.5 bg-primary rounded-full group-hover:w-12 transition-all duration-500 ease-out"></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* View All Categories Button */}
        <div className="text-center mt-8 lg:mt-12">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate({ to: '/products' })}
            className="px-8 py-3 text-base font-semibold border-2 hover:border-primary hover:bg-primary hover:text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            Browse All Products
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </section>
  )
}

// Featured Products Grid
function FeaturedProducts({ 
  products, 
  title, 
  cartEnabled 
}: { 
  products: ProductsResponse<{ categories: CategoriesResponse[] }>[], 
  title: string,
  cartEnabled: boolean
}) {
  const navigate = useNavigate()

  return (
    <section className="py-8 lg:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 lg:mb-12">
          <h2 className="text-xl lg:text-3xl font-bold">{title}</h2>
          <Button 
            variant="outline" 
            onClick={() => navigate({ to: '/products' })}
            className="text-sm hover:bg-primary/5"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} cartEnabled={cartEnabled} />
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
function PromoBanner({ banner }: { banner: { id: string; title: string; subtitle: string; icon: string; bgColor: string; textColor: string; link?: string } }) {
  const navigate = useNavigate()
  const IconComponent = getPromoIcon(banner.icon)
  
  const handleBannerClick = () => {
    if (banner.link && banner.link.trim()) {
      if (banner.link.startsWith('http')) {
        window.open(banner.link, '_blank', 'noopener,noreferrer')
      } else {
        navigate({ to: banner.link })
      }
    }
  }

  const hasLink = banner.link && banner.link.trim()
  
  return (
    <div 
      className={`${banner.bgColor} ${banner.textColor} rounded-lg p-4 flex items-center gap-3 lg:p-8 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group ${
        hasLink ? 'cursor-pointer hover:shadow-xl' : ''
      }`}
      onClick={hasLink ? handleBannerClick : undefined}
    >
      <IconComponent className="w-6 h-6 flex-shrink-0 lg:w-10 lg:h-10 group-hover:scale-110 transition-transform duration-300" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm lg:text-xl lg:mb-1">{banner.title}</h3>
        <p className="text-xs opacity-90 lg:text-base lg:opacity-80">{banner.subtitle}</p>
      </div>
      {hasLink && (
        <ArrowRight className="w-4 h-4 opacity-70 lg:w-6 lg:h-6 group-hover:translate-x-1 transition-transform duration-300" />
      )}
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
function NewsletterSignup({ enabled, title, subtitle }: { enabled: boolean, title: string, subtitle: string }) {
  if (!enabled) return null
  
  return (
    <section className="py-12 px-4 bg-white lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-6 lg:mb-12">
          <div className="relative inline-block mb-4 lg:mb-8">
            <Mail className="w-12 h-12 mx-auto text-gray-600 lg:w-20 lg:h-20 hover:text-primary transition-colors duration-300" />
            <div className="absolute -inset-2 bg-primary/10 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </div>
          <h2 className="text-xl font-bold mb-2 lg:text-4xl lg:mb-6">{title}</h2>
          <p className="text-sm text-gray-600 lg:text-lg lg:leading-relaxed lg:max-w-2xl lg:mx-auto">
            {subtitle}
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
  const { hero, categories, featuredProducts, promoBanners, settings } = Route.useLoaderData()
  return (
    <div className="min-h-screen bg-gray-50">
      {hero.enabled && <HeroSection hero={hero} />}
      {categories.length > 0 && (
        <CategoryChips 
          categories={categories} 
          title={settings.categoriesTitle} 
          showImages={settings.categories?.showImages}
        />
      )}
      {promoBanners.length > 0 && <PromoBanners banners={promoBanners} />}
      {featuredProducts.length > 0 && (
        <FeaturedProducts 
          products={featuredProducts} 
          title={settings.featuredTitle}
          cartEnabled={settings.cartEnabled}
        />
      )}
      <NewsletterSignup enabled={settings.newsletterEnabled} title={settings.newsletterTitle} subtitle={settings.newsletterSubtitle} />
    </div>
  )
}
