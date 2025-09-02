import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  User, 
  Heart,
  Package,
  Home as HomeIcon
} from 'lucide-react'
import { getCartItemCount } from '@/lib/cart'
import { useState, useEffect } from 'react'
import pb from '@/lib/db'
import { Collections, type StoresResponse } from '@/lib/types'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [storeSettings, setStoreSettings] = useState<StoresResponse | null>(null)

  // Load store settings and cart count on component mount
  useEffect(() => {
    loadStoreSettings()
    loadCartCount()
    
    // Set up interval to refresh cart count every 30 seconds
    const interval = setInterval(loadCartCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadStoreSettings = async () => {
    try {
      const settings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `header-store-settings-${Date.now()}`
      })
      setStoreSettings(settings)
    } catch (error) {
      console.error('Failed to load store settings:', error)
    }
  }

  const loadCartCount = async () => {
    const count = await getCartItemCount()
    setCartCount(count)
  }

  // Function to refresh cart count (can be called from other components)
  const refreshCartCount = () => {
    loadCartCount()
  }

  // Expose refresh function globally for other components to use
  useEffect(() => {
    (window as any).refreshCartCount = refreshCartCount
  }, [])

  // Parse checkout settings from store settings
  const checkoutSettings = storeSettings?.checkoutSettings ? 
    (typeof storeSettings.checkoutSettings === 'string' ? 
      JSON.parse(storeSettings.checkoutSettings) : 
      storeSettings.checkoutSettings) : {}

  // Cart settings - use the correct field from store settings
  const cartEnabled = storeSettings?.is_cart_enabled ?? false
  
  // Header settings
  const headerSettings = checkoutSettings.header || {}
  const showSearch = headerSettings.showSearch ?? true
  const showWishlist = headerSettings.showWishlist ?? true
  const headerStyle = headerSettings.style || 'default'
  const logoLink = headerSettings.logoLink || '/'
  const logoUrl = headerSettings.logoUrl || ''
  const storeName = (storeSettings?.storeName && storeSettings.storeName.trim()) ? 
    storeSettings.storeName.trim() : 'Store'

  // Get logo URL - prioritize URL over uploaded file
  const getLogoUrl = () => {
    if (logoUrl && logoUrl.trim()) {
      return logoUrl
    }
    if (storeSettings?.logo) {
      return pb.files.getUrl(storeSettings, storeSettings.logo, { thumb: '100x100' })
    }
    return null
  }

  const finalLogoUrl = getLogoUrl()

  const navigationLinks = [
    { to: '/', label: 'Home', icon: HomeIcon },
    { to: '/products', label: 'Products', icon: Package },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results - will implement search route later
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Header */}
        <div className={`flex items-center justify-between h-16 ${
          headerStyle === 'centered' ? 'flex-col sm:flex-row sm:h-20' : ''
        }`}>
          {/* Logo */}
          {logoLink && logoLink.trim() ? (
            logoLink.startsWith('http') ? (
              <a 
                href={logoLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-2 font-bold text-xl text-gray-900 hover:text-primary transition-colors ${
                  headerStyle === 'centered' ? 'mb-2 sm:mb-0' : ''
                } ${headerStyle === 'minimal' ? 'text-lg' : ''}`}
              >
                {finalLogoUrl ? (
                  <img 
                    src={finalLogoUrl} 
                    alt={storeName} 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      // Fallback to package icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                    }}
                  />
                ) : (
                  <Package className="w-6 h-6" />
                )}
                <Package className="w-6 h-6 hidden" />
                <span className={headerStyle === 'minimal' ? 'hidden md:block' : 'hidden sm:block'}>
                  {storeName}
                </span>
              </a>
            ) : (
              <Link 
                to={logoLink}
                className={`flex items-center space-x-2 font-bold text-xl text-gray-900 hover:text-primary transition-colors ${
                  headerStyle === 'centered' ? 'mb-2 sm:mb-0' : ''
                } ${headerStyle === 'minimal' ? 'text-lg' : ''}`}
              >
                {finalLogoUrl ? (
                  <img 
                    src={finalLogoUrl} 
                    alt={storeName} 
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      // Fallback to package icon if image fails to load
                      e.currentTarget.style.display = 'none'
                      ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                    }}
                  />
                ) : (
                  <Package className="w-6 h-6" />
                )}
                <Package className="w-6 h-6 hidden" />
                <span className={headerStyle === 'minimal' ? 'hidden md:block' : 'hidden sm:block'}>
                  {storeName}
                </span>
              </Link>
            )
          ) : (
            <Link 
              to="/" 
              className={`flex items-center space-x-2 font-bold text-xl text-gray-900 hover:text-primary transition-colors ${
                headerStyle === 'centered' ? 'mb-2 sm:mb-0' : ''
              } ${headerStyle === 'minimal' ? 'text-lg' : ''}`}
            >
              {finalLogoUrl ? (
                <img 
                  src={finalLogoUrl} 
                  alt={storeName} 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to package icon if image fails to load
                    e.currentTarget.style.display = 'none'
                    ;(e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'
                  }}
                />
              ) : (
                <Package className="w-6 h-6" />
              )}
              <Package className="w-6 h-6 hidden" />
              <span className={headerStyle === 'minimal' ? 'hidden md:block' : 'hidden sm:block'}>
                {storeName}
              </span>
            </Link>
          )}

          {/* Desktop Search - only show if enabled */}
          {showSearch && (
            <div className={`hidden md:block flex-1 max-w-md ${
              headerStyle === 'centered' ? 'mx-4' : 'mx-8'
            }`}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4"
                />
              </form>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-gray-700 hover:text-primary font-medium transition-colors"
                activeProps={{
                  className: "text-primary"
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search Button - only show if search is enabled */}
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => {
                  const searchInput = document.getElementById('mobile-search')
                  searchInput?.focus()
                }}
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* Wishlist - only show if enabled */}
            {showWishlist && (
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Heart className="w-5 h-5" />
              </Button>
            )}

            {/* Cart - only show if cart is enabled */}
            {cartEnabled && (
              <Link to="/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}

            {/* User Account */}
            <Button variant="ghost" size="sm">
              <User className="w-5 h-5" />
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-4">
                    {navigationLinks.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 text-gray-700 hover:text-primary font-medium transition-colors p-2 rounded-lg hover:bg-gray-50"
                        activeProps={{
                          className: "text-primary bg-primary/5"
                        }}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Actions */}
                  <div className="border-t pt-6 space-y-4">
                    {/* Cart Link - only show if cart is enabled */}
                    {cartEnabled && (
                      <Link
                        to="/cart"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between text-gray-700 hover:text-primary font-medium transition-colors p-2 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <ShoppingCart className="w-5 h-5" />
                          <span>Shopping Cart</span>
                        </div>
                        {cartCount > 0 && (
                          <Badge className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                            {cartCount > 99 ? '99+' : cartCount}
                          </Badge>
                        )}
                      </Link>
                    )}

                    {showWishlist && (
                      <Link
                        to="/wishlist"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 text-gray-700 hover:text-primary font-medium transition-colors p-2 rounded-lg hover:bg-gray-50"
                      >
                        <Heart className="w-5 h-5" />
                        <span>Wishlist</span>
                      </Link>
                    )}
                    
                    <Link
                      to="/account"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 text-gray-700 hover:text-primary font-medium transition-colors p-2 rounded-lg hover:bg-gray-50"
                    >
                      <User className="w-5 h-5" />
                      <span>My Account</span>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar - only show if search is enabled */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="mobile-search"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
