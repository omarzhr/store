import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  Package,
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  User,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react'
import { useState, useEffect } from 'react'

// Mock user data
interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin';
  avatar?: string;
}

export const Route = createFileRoute('/(protected)/dashboard')({
  loader: () => {
    // Simple user data without auth checks
    const user: MockUser = {
      id: '1',
      email: 'store@example.com',
      firstName: 'Store',
      lastName: 'Owner',
      role: 'owner'
    }

    return { user }
  },
  component: DashboardLayout,
})

// Navigation items
const navigationItems = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Dashboard overview'
  },
  {
    name: 'Products',
    href: '/dashboard/products',
    icon: Package,
    description: 'Manage products'
  },
  {
    name: 'Orders',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    description: 'Manage orders'
  },
  {
    name: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    description: 'Manage customers'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'View analytics'
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Store settings'
  }
]

// Desktop Sidebar Component
function DashboardSidebar({ 
  isCollapsed, 
  onToggleCollapse 
}: { 
  isCollapsed: boolean
  onToggleCollapse: () => void 
}) {
  const navigate = useNavigate()

  return (
    <div
      className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
        ${isCollapsed ? 'lg:-translate-x-0' : 'lg:translate-x-0'}
      `}
      style={{ willChange: 'width, transform' }}
    >
      <Card className="flex-1 rounded-none border-r border-l-0 border-t-0 border-b-0">
        <CardContent className="flex flex-col h-full p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!isCollapsed && (
              <h2 className="text-lg font-semibold">Store Dashboard</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={`w-full justify-start h-12 ${
                    isCollapsed ? 'px-2' : 'px-4'
                  }`}
                  onClick={() => navigate({ to: item.href })}
                >
                  <Icon className={`h-5 w-5 ${isCollapsed ? `` : `mr-3`}`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className={`flex items-center ${isCollapsed ? `justify-center` : `gap-3`}`}>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  SO
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Store Owner</p>
                  <p className="text-xs text-gray-500 truncate">store@example.com</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mobile Navigation Component
function MobileNav({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const navigate = useNavigate()

  const handleNavigation = (href: string) => {
    navigate({ to: href })
    onClose()
  }

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-80 lg:hidden
        bg-white dark:bg-gray-900
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ willChange: 'transform' }}
    >
      <Card className="h-full rounded-none border-l-0 border-t-0 border-b-0">
        <CardContent className="flex flex-col h-full p-0">
          <div className="flex items-center justify-between p-4 border-b min-h-[64px]">
            <h2 className="text-lg font-semibold">Store Dashboard</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0 touch-manipulation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start h-14 px-4 text-left touch-manipulation"
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-5 w-5 mr-4 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                </Button>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary-foreground">
                  SO
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Store Owner</p>
                <p className="text-xs text-gray-500 truncate">store@example.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Theme Toggle Component
function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initialTheme = savedTheme || systemTheme
    
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-8 w-8 p-0"
      title={`Switch to ${theme === `light` ? `dark` : `light`} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}

// Notification Bell Component
function NotificationBell() {
  const [notifications] = useState([
    { id: '1', title: 'New order received', type: 'order', isRead: false },
    { id: '2', title: 'Low stock alert', type: 'inventory', isRead: false },
    { id: '3', title: 'Customer message', type: 'customer', isRead: true },
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
              <div className="flex items-center justify-between w-full">
                <span className={`text-sm ${notification.isRead ? `text-gray-600` : `font-medium`}`}>
                  {notification.title}
                </span>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {notification.type === 'order' && 'Order Management'}
                {notification.type === 'inventory' && 'Inventory'}
                {notification.type === 'customer' && 'Customer Service'}
              </span>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            <span className="text-sm text-gray-500">No notifications</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// User Menu Component
function UserMenu({ user }: { user: MockUser }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    navigate({ to: '/' })
  }

  const handleProfile = () => {
    navigate({ to: '/dashboard/settings' })
  }

  const handleStoreSettings = () => {
    navigate({ to: '/dashboard/settings' })
  }

  const handleHelpSupport = () => {
    navigate({ to: '/dashboard/settings' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-3 h-auto p-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfile}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleStoreSettings}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Store Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleHelpSupport}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DashboardLayout() {
  const { user } = Route.useLoaderData()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const openMobileNav = () => {
    setIsMobileNavOpen(true)
  }

  const closeMobileNav = () => {
    setIsMobileNavOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <MobileNav 
        isOpen={isMobileNavOpen}
        onClose={closeMobileNav}
      />

      <div 
        className={`transition-all duration-300 ${
          isSidebarCollapsed 
            ? 'lg:pl-16' 
            : 'lg:pl-64'
        }`}
      >
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-3 sm:px-6 h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={openMobileNav}
                className="lg:hidden h-10 w-10 p-0 shrink-0 touch-manipulation"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <NotificationBell />
              <UserMenu user={user} />
            </div>
          </div>
        </div>

        <main className="p-3 sm:p-6 min-h-screen bg-white dark:bg-gray-900 relative">
          <Outlet />
        </main>
      </div>
    </div>
  )

}
