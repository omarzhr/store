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
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock cart count - in real app would come from cart context
  const cartItemCount = 3

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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 font-bold text-xl text-gray-900 hover:text-primary transition-colors"
          >
            <Package className="w-6 h-6" />
            <span className="hidden sm:block">Store</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
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
            {/* Mobile Search Button */}
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

            {/* Wishlist */}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Heart className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Link to="/cart">
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>

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
                    <Link
                      to="/wishlist"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 text-gray-700 hover:text-primary font-medium transition-colors p-2 rounded-lg hover:bg-gray-50"
                    >
                      <Heart className="w-5 h-5" />
                      <span>Wishlist</span>
                    </Link>
                    
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

        {/* Mobile Search Bar */}
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
      </div>
    </header>
  )
}
