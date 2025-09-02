import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Eye,
  Clock,
  Target
} from 'lucide-react'
import type { 
  ProductsResponse, 
  OrdersResponse, 
  CustomersResponse, 
  CategoriesResponse,
  StoresResponse,
  OrderItemsResponse 
} from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/analytics/')({
  loader: async () => {
    try {
      const [orders, products, customers, categories, orderItems, storeSettings] = await Promise.all([
        pb.collection(Collections.Orders).getFullList<OrdersResponse>({
          sort: '-created',
          expand: 'customerId',
          requestKey: `analytics-orders-${Date.now()}`
        }),
        pb.collection(Collections.Products).getFullList<ProductsResponse<{ categories: CategoriesResponse[] }>>({
          expand: 'categories',
          requestKey: `analytics-products-${Date.now()}`
        }),
        pb.collection(Collections.Customers).getFullList<CustomersResponse>({
          sort: '-created',
          requestKey: `analytics-customers-${Date.now()}`
        }),
        pb.collection(Collections.Categories).getFullList<CategoriesResponse>({
          requestKey: `analytics-categories-${Date.now()}`
        }),
        pb.collection(Collections.OrderItems).getFullList<OrderItemsResponse>({
          expand: 'products,orderId',
          requestKey: `analytics-order-items-${Date.now()}`
        }),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `analytics-store-${Date.now()}`
        }).catch(() => null)
      ])
      
      return { orders, products, customers, categories, orderItems, storeSettings }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      return { 
        orders: [], 
        products: [], 
        customers: [], 
        categories: [], 
        orderItems: [],
        storeSettings: null 
      }
    }
  },
  component: AnalyticsComponent,
})

// Analytics calculation helpers
function calculateMetrics(
  orders: OrdersResponse[], 
  products: ProductsResponse[], 
  customers: CustomersResponse[],
  orderItems: OrderItemsResponse[],
  timeRange: string
) {
  const getDateRange = (range: string) => {
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }
    
    return { startDate, endDate: now }
  }

  const { startDate } = getDateRange(timeRange)
  
  // Filter data by time range
  const filteredOrders = orders.filter(order => new Date(order.created) >= startDate)
  const filteredCustomers = customers.filter(customer => new Date(customer.created) >= startDate)
  
  // Basic metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const totalOrders = filteredOrders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const newCustomers = filteredCustomers.length
  
  // Previous period for comparison
  const periodLength = new Date().getTime() - startDate.getTime()
  const previousStartDate = new Date(startDate.getTime() - periodLength)
  const previousOrders = orders.filter(order => {
    const orderDate = new Date(order.created)
    return orderDate >= previousStartDate && orderDate < startDate
  })
  
  const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
  
  // Product analytics
  const lowStockProducts = products.filter(product => 
    (product.stockQuantity || 0) <= (product.reorderLevel || 0) && (product.stockQuantity || 0) > 0
  )
  
  const outOfStockProducts = products.filter(product => (product.stockQuantity || 0) === 0)
  const activeProducts = products.filter(product => product.isActive)
  
  // Order status analytics
  const ordersByStatus = filteredOrders.reduce((acc, order) => {
    const status = order.status || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const ordersByPaymentStatus = filteredOrders.reduce((acc, order) => {
    const status = order.paymentStatus || 'pending'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Customer analytics
  const customersByStatus = customers.reduce((acc, customer) => {
    const status = customer.status || 'active'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Top performing products
  const productPerformance = orderItems.reduce((acc, item) => {
    if (item.products && item.products.length > 0) {
      const productId = item.products[0]
      const product = products.find(p => p.id === productId)
      if (product) {
        if (!acc[productId]) {
          acc[productId] = {
            product,
            totalQuantity: 0,
            totalRevenue: 0,
            orderCount: 0
          }
        }
        acc[productId].totalQuantity += item.quantity || 0
        acc[productId].totalRevenue += (item.quantity || 0) * (item.price || 0)
        acc[productId].orderCount += 1
      }
    }
    return acc
  }, {} as Record<string, any>)
  
  const topProducts = Object.values(productPerformance)
    .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
  
  // Revenue by day for charts
  const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    const dateStr = date.toISOString().split('T')[0]
    
    const dayOrders = orders.filter(order => order.created.startsWith(dateStr))
    const revenue = dayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    
    return {
      date: dateStr,
      revenue,
      orders: dayOrders.length
    }
  })
  
  // Conversion funnel
  const totalVisitors = customers.length * 10 // Mock: assume 10x visitors than customers
  const conversionRate = totalVisitors > 0 ? (customers.length / totalVisitors) * 100 : 0
  const orderConversionRate = customers.length > 0 ? (totalOrders / customers.length) * 100 : 0
  
  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    newCustomers,
    revenueGrowth,
    lowStockProducts,
    outOfStockProducts,
    activeProducts,
    ordersByStatus,
    ordersByPaymentStatus,
    customersByStatus,
    topProducts,
    dailyRevenue,
    conversionRate,
    orderConversionRate
  }
}

function AnalyticsComponent() {
  const { orders, products, customers, categories, orderItems, storeSettings } = Route.useLoaderData()
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Get currency info
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

  // Calculate all metrics
  const metrics = calculateMetrics(orders, products, customers, orderItems, timeRange)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      window.location.reload()
    }, 1000)
  }

  const handleExport = () => {
    const exportData = {
      timeRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue: metrics.totalRevenue,
        totalOrders: metrics.totalOrders,
        averageOrderValue: metrics.averageOrderValue,
        newCustomers: metrics.newCustomers,
        revenueGrowth: metrics.revenueGrowth
      },
      topProducts: metrics.topProducts.slice(0, 5),
      ordersByStatus: metrics.ordersByStatus,
      ordersByPaymentStatus: metrics.ordersByPaymentStatus,
      dailyRevenue: metrics.dailyRevenue,
      inventory: {
        totalProducts: products.length,
        activeProducts: metrics.activeProducts.length,
        lowStockProducts: metrics.lowStockProducts.length,
        outOfStockProducts: metrics.outOfStockProducts.length
      }
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive store performance insights
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(metrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {metrics.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1 text-red-500" />
                )}
                <span className={metrics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(metrics.revenueGrowth).toFixed(1)}%
                </span>
                <span className="ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                AOV: {formatPrice(metrics.averageOrderValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.newCustomers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {customers.length} customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeProducts.length}</div>
              <div className="flex gap-2 mt-1">
                {metrics.lowStockProducts.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {metrics.lowStockProducts.length} low
                  </Badge>
                )}
                {metrics.outOfStockProducts.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {metrics.outOfStockProducts.length} out
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Revenue Trend (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {metrics.dailyRevenue.slice(-7).map((day) => (
                      <div key={day.date} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatPrice(day.revenue)}</span>
                          <span className="text-xs text-gray-500">({day.orders} orders)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Conversion Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Visitor to Customer</span>
                      <span>{metrics.conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.conversionRate} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Customer to Order</span>
                      <span>{metrics.orderConversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.orderConversionRate} className="h-2" />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      Total customers: {customers.length} | Total orders: {orders.length}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            {/* ...existing code... */}
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {metrics.topProducts.slice(0, 5).map((item: any, index) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{item.product.title}</p>
                            <p className="text-sm text-gray-600">
                              {formatPrice(item.product.price)} each
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.totalQuantity} sold</p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.totalRevenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Inventory Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Out of Stock */}
                    {metrics.outOfStockProducts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Out of Stock ({metrics.outOfStockProducts.length})</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {metrics.outOfStockProducts.slice(0, 3).map((product) => (
                            <div key={product.id} className="text-sm p-2 bg-red-50 rounded">
                              {product.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Low Stock */}
                    {metrics.lowStockProducts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-yellow-600 mb-2">Low Stock ({metrics.lowStockProducts.length})</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {metrics.lowStockProducts.slice(0, 3).map((product) => (
                            <div key={product.id} className="text-sm p-2 bg-yellow-50 rounded flex justify-between">
                              <span>{product.title}</span>
                              <span className="font-medium">{product.stockQuantity} left</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {metrics.outOfStockProducts.length === 0 && metrics.lowStockProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>All products are well-stocked!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.customersByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant={
                          status === 'active' ? 'default' :
                          status === 'inactive' ? 'secondary' : 'destructive'
                        }>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                        <span className="font-medium">{count} customers</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Customers</span>
                      <span className="font-medium">{customers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New This Period</span>
                      <span className="font-medium">{metrics.newCustomers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Orders per Customer</span>
                      <span className="font-medium">
                        {customers.length > 0 ? (orders.length / customers.length).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Customer Value</span>
                      <span className="font-medium">
                        {formatPrice(customers.length > 0 ? 
                          orders.reduce((sum, order) => sum + (order.total || 0), 0) / customers.length : 0
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.ordersByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant={
                          status === 'delivered' ? 'default' :
                          status === 'shipped' ? 'secondary' :
                          status === 'cancelled' ? 'destructive' : 'outline'
                        }>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(metrics.ordersByPaymentStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge variant={
                          status === 'paid' ? 'default' :
                          status === 'cod-confirmed' ? 'secondary' :
                          status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {status.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

