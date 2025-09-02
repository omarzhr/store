import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Plus,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'
import { type ProductsResponse, type UsersResponse } from '@/lib/types'

// Mock data interfaces based on existing types
interface MockDashboardStats {
  todayOrders: number
  todayRevenue: number
  pendingCODOrders: number
  totalProducts: number
  lowStockProducts: number
  totalCustomers: number
  conversionRate: number
  avgOrderValue: number
}

interface MockRecentOrder {
  id: string
  customerName: string
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered'
  placedAt: string
}

interface MockTopProduct {
  id: string
  title: string
  sold: number
  revenue: number
  image?: string
}

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/')({
  loader: async () => {
    // Mock dashboard data
    const stats: MockDashboardStats = {
      todayOrders: 24,
      todayRevenue: 1847.50,
      pendingCODOrders: 8,
      totalProducts: 156,
      lowStockProducts: 12,
      totalCustomers: 1284,
      conversionRate: 3.2,
      avgOrderValue: 76.98
    }

    const recentOrders: MockRecentOrder[] = [
      {
        id: '1',
        customerName: 'Sarah Johnson',
        total: 89.99,
        status: 'pending',
        placedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        customerName: 'Mike Chen',
        total: 156.50,
        status: 'confirmed',
        placedAt: '2024-01-15T09:15:00Z'
      },
      {
        id: '3',
        customerName: 'Emma Davis',
        total: 203.25,
        status: 'shipped',
        placedAt: '2024-01-15T08:45:00Z'
      },
      {
        id: '4',
        customerName: 'James Wilson',
        total: 67.80,
        status: 'delivered',
        placedAt: '2024-01-14T16:20:00Z'
      }
    ]

    const topProducts: MockTopProduct[] = [
      {
        id: '1',
        title: 'Wireless Bluetooth Headphones',
        sold: 45,
        revenue: 2250.00
      },
      {
        id: '2',
        title: 'Smart Watch Series X',
        sold: 32,
        revenue: 6400.00
      },
      {
        id: '3',
        title: 'Premium Coffee Beans',
        sold: 78,
        revenue: 1560.00
      },
      {
        id: '4',
        title: 'Organic Cotton T-Shirt',
        sold: 123,
        revenue: 2460.00
      }
    ]

    const lowStockProducts = [
      { id: '1', title: 'iPhone Case', stock: 3, reorderLevel: 10 },
      { id: '2', title: 'USB Cable', stock: 1, reorderLevel: 5 },
      { id: '3', title: 'Screen Protector', stock: 2, reorderLevel: 8 }
    ]

    return {
      stats,
      recentOrders,
      topProducts,
      lowStockProducts
    }
  },
  component: DashboardOverview,
})

// Enhanced Stats Card Component with better mobile/laptop UX
function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend,
  onClick 
}: {
  title: string
  value: string | number
  change: string
  icon: any
  trend: 'up' | 'down' | 'neutral'
  onClick?: () => void
}) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pb-3">
        <div className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{value}</div>
        <div className={`flex items-center text-xs ${trendColor} mt-1`}>
          {TrendIcon && <TrendIcon className="h-3 w-3 mr-1" />}
          <span className="truncate">{change}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Recent Orders Table with better mobile UX
function RecentOrdersTable({ orders }: { orders: MockRecentOrder[] }) {
  const navigate = useNavigate()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base sm:text-lg">Recent Orders</CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate({ to: '/dashboard/orders' })}
          className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
              onClick={() => navigate({ to: `/dashboard/orders/${order.id}` })}
            >
              {/* Mobile Layout */}
              <div className="flex-1 min-w-0 sm:hidden">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm truncate">{order.customerName}</p>
                  <p className="font-semibold text-sm text-right ml-2">
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.placedAt)}
                  </p>
                  <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                    {order.status}
                  </Badge>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex sm:items-center sm:gap-4 sm:flex-1">
                <div className="flex-1">
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.placedAt)}
                  </p>
                </div>
                <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                  {order.status}
                </Badge>
                <p className="font-semibold text-sm text-right min-w-[80px]">
                  ${order.total.toFixed(2)}
                </p>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Quick Actions with better touch targets and layout
function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Add Product',
      description: 'Create a new product',
      icon: Plus,
      onClick: () => navigate({ to: '/dashboard/products/new' }),
      color: 'hover:bg-blue-50 hover:border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'View Orders',
      description: 'Manage customer orders',
      icon: ShoppingCart,
      onClick: () => navigate({ to: '/dashboard/orders' }),
      color: 'hover:bg-green-50 hover:border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'Analytics',
      description: 'View sales reports',
      icon: TrendingUp,
      onClick: () => navigate({ to: '/dashboard/analytics' }),
      color: 'hover:bg-purple-50 hover:border-purple-200',
      iconColor: 'text-purple-600'
    }
  ]

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className={`h-auto p-4 sm:p-6 flex flex-col items-center gap-3 transition-all duration-200 ${action.color} min-h-[100px] sm:min-h-[120px] active:scale-95`}
              onClick={action.onClick}
            >
              <action.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${action.iconColor}`} />
              <div className="text-center">
                <p className="font-medium text-sm sm:text-base">{action.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Low Stock Alert with better mobile display
function LowStockAlert({ products }: { products: any[] }) {
  const navigate = useNavigate()

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          <span>Low Stock Alert</span>
          <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-300">
            {products.length}
          </Badge>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate({ to: '/dashboard/products', search: { stockStatus: 'low-stock' } })}
          className="h-8 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm border-orange-300 hover:bg-orange-100"
        >
          <span className="hidden sm:inline">View All</span>
          <span className="sm:hidden">All</span>
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-3">
          {products.slice(0, 3).map((product) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-white hover:bg-orange-50 transition-colors cursor-pointer"
              onClick={() => navigate({ to: `/dashboard/products/${product.id}` })}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.title}</p>
                <p className="text-xs text-muted-foreground">
                  Reorder at {product.reorderLevel} units
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-100 whitespace-nowrap">
                  {product.stock} left
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Top Products with better mobile layout
function TopProducts({ products }: { products: MockTopProduct[] }) {
  const navigate = useNavigate()

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base sm:text-lg">Top Selling Products</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate({ to: '/dashboard/analytics' })}
          className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
              onClick={() => navigate({ to: `/dashboard/products/${product.id}` })}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sold} sold
                  </p>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="font-semibold text-sm">
                  ${product.revenue.toFixed(2)}
                </p>
                <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardOverview() {
  const { stats, recentOrders, topProducts, lowStockProducts } = Route.useLoaderData()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Mobile-optimized container with proper spacing */}
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Enhanced Header with better mobile typography */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Enhanced KPI Cards with click functionality */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title="Today's Orders"
            value={stats.todayOrders}
            change="+12% from yesterday"
            icon={ShoppingCart}
            trend="up"
            onClick={() => navigate({ to: '/dashboard/orders' })}
          />
          <StatsCard
            title="Today's Revenue"
            value={`$${stats.todayRevenue.toFixed(2)}`}
            change="+8% from yesterday"
            icon={DollarSign}
            trend="up"
            onClick={() => navigate({ to: '/dashboard/analytics' })}
          />
          <StatsCard
            title="Pending COD"
            value={stats.pendingCODOrders}
            change="2 new today"
            icon={Package}
            trend="neutral"
            onClick={() => navigate({ to: '/dashboard/orders' })}
          />
          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers}
            change="+5% this week"
            icon={Users}
            trend="up"
            onClick={() => navigate({ to: '/dashboard/customers' })}
          />
        </div>

        {/* Secondary Stats - Hidden on mobile for better focus */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            change="3 added this week"
            icon={Package}
            trend="up"
            onClick={() => navigate({ to: '/dashboard/products' })}
          />
          <StatsCard
            title="Low Stock Items"
            value={stats.lowStockProducts}
            change="2 need reorder"
            icon={AlertTriangle}
            trend="neutral"
            onClick={() => navigate({ to: '/dashboard/products', search: { stockStatus: 'low-stock' } })}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            change="+0.3% this week"
            icon={TrendingUp}
            trend="up"
            onClick={() => navigate({ to: '/dashboard/analytics' })}
          />
          <StatsCard
            title="Avg Order Value"
            value={`$${stats.avgOrderValue.toFixed(2)}`}
            change="+$5.20 vs last week"
            icon={DollarSign}
            trend="up"
            onClick={() => navigate({ to: '/dashboard/analytics' })}
          />
        </div>

        {/* Enhanced Quick Actions */}
        <QuickActions />

        {/* Enhanced Content Grid with mobile-first approach */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Recent Orders */}
          <RecentOrdersTable orders={recentOrders} />

          {/* Top Products */}
          <TopProducts products={topProducts} />
        </div>

        {/* Enhanced Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <LowStockAlert products={lowStockProducts} />
        )}
      </div>
    </div>
  )
}
