import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  AlertCircle, Package, Phone, MapPin, Eye, MoreVertical, Download, Printer,
  Clock, Truck, CheckCircle, XCircle, Search, Filter, RefreshCw, AlertTriangle, Calendar, 
  User, CreditCard, FileText, Edit3, ChevronDown, FileDown, FileSpreadsheet, Plus,
  Send, DollarSign, BarChart3, Bug
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { OrdersResponse, StoresResponse } from '@/lib/types'
import { OrdersStatusOptions, OrdersPaymentStatusOptions, OrdersFulfillmentStatusOptions } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { OrderItemsDebug } from '@/components/debug/OrderItemsDebug'
import { OrderItemsList } from '@/components/orders/OrderItemsList'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/orders/')({
  loader: async () => {
    try {
      const [ordersResult, storeSettings] = await Promise.all([
        pb.collection(Collections.Orders).getFullList<OrdersResponse>(200, {
          expand: 'customerId',
          sort: '-created',
          requestKey: `orders-list-${Date.now()}`
        }).then(orders => ({ orders, hasPermission: true }))
        .catch((error) => {
          console.warn('Orders access restricted:', error)
          if (error.status === 403 || error.message?.includes('superuser')) {
            return { orders: [], hasPermission: false }
          }
          return { orders: [], hasPermission: true }
        }),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-orders-${Date.now()}`
        }).catch(() => null)
      ])

      return { 
        orders: ordersResult.orders, 
        storeSettings, 
        hasPermission: ordersResult.hasPermission
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
      return { 
        orders: [], 
        storeSettings: null, 
        hasPermission: false,
        error: error instanceof Error ? error.message : 'Failed to load orders'
      }
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const loaderData = Route.useLoaderData()
  const { orders, storeSettings, hasPermission } = loaderData
  const navigate = useNavigate()
  const [selectedOrder, setSelectedOrder] = useState<OrdersResponse<any, any, any> | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<OrdersResponse<any, any, any> | null>(null)
  const [newStatus, setNewStatus] = useState<OrdersStatusOptions>(OrdersStatusOptions.pending)
  const [newPaymentStatus, setNewPaymentStatus] = useState<OrdersPaymentStatusOptions>(OrdersPaymentStatusOptions.pending)
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState<OrdersFulfillmentStatusOptions>(OrdersFulfillmentStatusOptions.pending)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [updateNotes, setUpdateNotes] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [dateRange, setDateRange] = useState<string>('all')
  const [_showBulkActions, _setShowBulkActions] = useState(false)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showDebug, setShowDebug] = useState(false)

  // Get currency info from store settings
  const currency = storeSettings?.currency || 'MAD'
  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      'MAD': 'DH', 'USD': '$', 'EUR': '€', 'GBP': '£', 'CAD': 'C$', 'AUD': 'A$', 'JPY': '¥', 'CNY': '¥', 'INR': '₹'
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

  // Enhanced permission check UI
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 lg:p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Access Restricted</h3>
                  <p className="text-muted-foreground">
                    You don't have permission to view orders. Please contact your administrator.
                  </p>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Database permissions need to be configured in PocketBase admin panel.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => navigate({ to: '/dashboard' })}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced filtering logic
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.paymentStatus === paymentStatusFilter
    const customer = Array.isArray((order.expand as any)?.customerId) ? (order.expand as any).customerId[0] : (order.expand as any)?.customerId
    const matchesSearch = searchQuery === '' || 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Date range filtering
    let matchesDateRange = true
    if (dateRange !== 'all') {
      const orderDate = new Date(order.created)
      const now = new Date()
      switch (dateRange) {
        case 'today':
          matchesDateRange = orderDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = orderDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          matchesDateRange = orderDate >= monthAgo
          break
      }
    }
    
    return matchesStatus && matchesPaymentStatus && matchesSearch && matchesDateRange
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      case 'oldest':
        return new Date(a.created).getTime() - new Date(b.created).getTime()
      case 'highest':
        return (b.total || 0) - (a.total || 0)
      case 'lowest':
        return (a.total || 0) - (b.total || 0)
      default:
        return 0
    }
  })

  // Stats calculations
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === OrdersStatusOptions.pending).length,
    confirmed: orders.filter(o => o.status === OrdersStatusOptions.confirmed).length,
    shipped: orders.filter(o => o.status === OrdersStatusOptions.shipped).length,
    delivered: orders.filter(o => o.status === OrdersStatusOptions.delivered).length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return
    
    setLoading(true)
    try {
      for (const orderId of selectedOrders) {
        let updateData: Partial<OrdersResponse> = {}
        
        switch (action) {
          case 'confirm':
            updateData = { status: OrdersStatusOptions.confirmed }
            break
          case 'ship':
            updateData = { status: OrdersStatusOptions.shipped, fulfillmentStatus: OrdersFulfillmentStatusOptions.shipped }
            break
          case 'archive':
            updateData = { status: OrdersStatusOptions.delivered }
            break
        }
        
        if (Object.keys(updateData).length > 0) {
          await pb.collection(Collections.Orders).update(orderId, updateData)
        }
      }
      
      setSelectedOrders([])
      window.location.reload()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Export functionality
  const handleExport = (format: 'csv' | 'excel') => {
    const headers = ['Order Number', 'Customer', 'Status', 'Payment Status', 'Total', 'Date']
    const data = filteredOrders.map(order => {
      const customer = Array.isArray((order.expand as any)?.customerId) ? (order.expand as any).customerId[0] : (order.expand as any)?.customerId
      return [
        order.orderNumber || `#${order.id.slice(-8)}`,
        customer?.full_name || 'Unknown',
        order.status || 'pending',
        order.paymentStatus || 'pending',
        formatPrice(order.total || 0),
        new Date(order.created).toLocaleDateString()
      ]
    })
    
    console.log(`Exporting ${data.length} orders as ${format}`, { headers, data })
    // Implement actual export logic here
  }

  // Mobile card view component
  const OrderCard = ({ order }: { order: OrdersResponse<any, any, any> }) => {
    const customer = Array.isArray((order.expand as any)?.customerId) ? (order.expand as any).customerId[0] : (order.expand as any)?.customerId
    
    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="font-semibold text-sm">
              {order.orderNumber || `#${order.id.slice(-8)}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {customer?.full_name || 'Unknown Customer'}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-semibold text-sm">{formatPrice(order.total || 0)}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(order.created).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {getStatusBadge(order.status || 'pending', 'order')}
            {getStatusBadge(order.paymentStatus || 'pending', 'payment')}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSelectedOrderForUpdate(order)
                setNewStatus(order.status || OrdersStatusOptions.pending)
                setNewPaymentStatus(order.paymentStatus || OrdersPaymentStatusOptions.pending)
                setNewFulfillmentStatus(order.fulfillmentStatus || OrdersFulfillmentStatusOptions.pending)
                setUpdateDialogOpen(true)
              }}>
                <Edit3 className="h-4 w-4 mr-2" />
                Update
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {order.trackingNumber && (
          <div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Tracking: {order.trackingNumber}
          </div>
        )}
      </Card>
    )
  }

  // Enhanced status badge
  const getStatusBadge = (status: string, type: 'order' | 'payment' | 'fulfillment' = 'order') => {
    const configs = {
      order: {
        pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
        confirmed: { variant: 'default' as const, icon: CheckCircle, label: 'Confirmed' },
        preparing: { variant: 'default' as const, icon: Package, label: 'Preparing' },
        shipped: { variant: 'default' as const, icon: Truck, label: 'Shipped' },
        delivered: { variant: 'default' as const, icon: CheckCircle, label: 'Delivered' },
        cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' }
      },
      payment: {
        pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
        'cod-confirmed': { variant: 'default' as const, icon: CheckCircle, label: 'COD Confirmed' },
        paid: { variant: 'default' as const, icon: CreditCard, label: 'Paid' },
        failed: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' }
      },
      fulfillment: {
        pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
        processing: { variant: 'default' as const, icon: Package, label: 'Processing' },
        shipped: { variant: 'default' as const, icon: Truck, label: 'Shipped' },
        delivered: { variant: 'default' as const, icon: CheckCircle, label: 'Delivered' },
        cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' }
      }
    }

    const config = configs[type][status as keyof typeof configs[typeof type]] || configs[type].pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleStatusUpdate = async () => {
    if (!selectedOrderForUpdate) return
    
    setLoading(true)
    try {
      const updateData: Partial<OrdersResponse> = {
        status: newStatus,
        paymentStatus: newPaymentStatus,
        fulfillmentStatus: newFulfillmentStatus,
        trackingNumber: trackingNumber || selectedOrderForUpdate.trackingNumber,
        estimatedDelivery: estimatedDelivery || selectedOrderForUpdate.estimatedDelivery,
        internalNotes: updateNotes ? `${selectedOrderForUpdate.internalNotes || ''}\n${new Date().toLocaleString()}: ${updateNotes}` : selectedOrderForUpdate.internalNotes
      }

      await pb.collection(Collections.Orders).update(selectedOrderForUpdate.id, updateData, {
        requestKey: `update-order-${selectedOrderForUpdate.id}-${Date.now()}`
      })
      
      window.location.reload()
    } catch (error) {
      console.error('Failed to update order:', error)
    } finally {
      setLoading(false)
      setUpdateDialogOpen(false)
      setSelectedOrderForUpdate(null)
      setNewStatus(OrdersStatusOptions.pending)
      setNewPaymentStatus(OrdersPaymentStatusOptions.pending)
      setNewFulfillmentStatus(OrdersFulfillmentStatusOptions.pending)
      setTrackingNumber('')
      setUpdateNotes('')
      setEstimatedDelivery('')
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Orders</h1>
              <p className="text-muted-foreground">
                Manage customer orders and fulfillment
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh orders</TooltipContent>
              </Tooltip>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Order</p>
                  <p className="text-xl font-bold">{formatPrice(stats.avgOrderValue)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
          </div>

          {/* Enhanced Filters */}
          <Card className="p-4">
            <div className="space-y-4">
              {/* Mobile Filter Toggle */}
              <div className="lg:hidden">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters & Search
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </div>

              {/* Search and Filters */}
              <div className={`space-y-4 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders, customers, tracking numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cod-confirmed">COD Confirmed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="highest">Highest Value</SelectItem>
                      <SelectItem value="lowest">Lowest Value</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={viewMode} onValueChange={(value: 'table' | 'cards') => setViewMode(value)}>
                    <SelectTrigger className="lg:hidden">
                      <SelectValue placeholder="View" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="cards">Card View</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStatusFilter('all')
                      setPaymentStatusFilter('all')
                      setDateRange('all')
                      setSearchQuery('')
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedOrders.length === filteredOrders.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedOrders(filteredOrders.map(o => o.id))
                      } else {
                        setSelectedOrders([])
                      }
                    }}
                  />
                  <span className="text-sm font-medium">
                    {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('confirm')}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('ship')}
                    disabled={loading}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Ship
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedOrders([])}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Orders List */}
          <Card>
            <CardContent className="p-0">
              {/* Mobile Card View */}
              <div className={`lg:hidden space-y-3 p-4 ${viewMode === 'table' ? 'hidden' : 'block'}`}>
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>

              {/* Desktop Table View */}
              <div className={`${viewMode === 'cards' ? 'hidden lg:block' : 'block'}`}>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders(filteredOrders.map(o => o.id))
                              } else {
                                setSelectedOrders([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="hidden lg:table-cell">Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Payment</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const customer = Array.isArray((order.expand as any)?.customerId) ? (order.expand as any).customerId[0] : (order.expand as any)?.customerId
                        return (
                          <TableRow key={order.id} className="group">
                            <TableCell>
                              <Checkbox 
                                checked={selectedOrders.includes(order.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedOrders([...selectedOrders, order.id])
                                  } else {
                                    setSelectedOrders(selectedOrders.filter(id => id !== order.id))
                                  }
                                }}
                              />
                            </TableCell>
                            
                            <TableCell className="font-medium">
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {order.orderNumber || `#${order.id.slice(-8)}`}
                                </div>
                                <div className="text-xs text-muted-foreground lg:hidden">
                                  {customer?.full_name || 'Unknown Customer'}
                                </div>
                                {order.trackingNumber && (
                                  <div className="text-xs font-mono text-blue-600">
                                    {order.trackingNumber}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            
                            <TableCell className="hidden lg:table-cell">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {customer?.full_name || 'Unknown Customer'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {customer?.email}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell>
                              <div className="space-y-1">
                                {getStatusBadge(order.status || 'pending', 'order')}
                                <div className="sm:hidden">
                                  {getStatusBadge(order.paymentStatus || 'pending', 'payment')}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                              {getStatusBadge(order.paymentStatus || 'pending', 'payment')}
                            </TableCell>
                            
                            <TableCell className="text-right font-semibold">
                              {formatPrice(order.total || 0)}
                            </TableCell>
                            
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                              {new Date(order.created).toLocaleDateString()}
                            </TableCell>
                            
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedOrderForUpdate(order)
                                    setNewStatus(order.status || OrdersStatusOptions.pending)
                                    setNewPaymentStatus(order.paymentStatus || OrdersPaymentStatusOptions.pending)
                                    setNewFulfillmentStatus(order.fulfillmentStatus || OrdersFulfillmentStatusOptions.pending)
                                    setTrackingNumber(order.trackingNumber || '')
                                    setEstimatedDelivery(order.estimatedDelivery || '')
                                    setUpdateDialogOpen(true)
                                  }}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Update Order
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Label
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Update
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {filteredOrders.length === 0 && (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Orders will appear here when customers make purchases'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && paymentStatusFilter === 'all' && (
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Test Order
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debug Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Tools
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? 'Hide' : 'Show'} Debug Analysis
                </Button>
              </CardTitle>
            </CardHeader>
            {showDebug && (
              <CardContent>
                <OrderItemsDebug />
              </CardContent>
            )}
          </Card>

          {/* Enhanced Order Details Dialog */}
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-5xl max-h-[95vh] p-0">
              <DialogHeader className="p-4 sm:p-6 pb-0">
                <DialogTitle className="text-lg sm:text-xl">
                  Order Details - {selectedOrder?.orderNumber || `#${selectedOrder?.id.slice(-8)}`}
                </DialogTitle>
              </DialogHeader>
              
              {selectedOrder && (
                <ScrollArea className="max-h-[80vh] px-4 sm:px-6">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                      <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                      <TabsTrigger value="items" className="text-xs sm:text-sm">Items</TabsTrigger>
                      <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                      {/* Status Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Order Status</Label>
                              {getStatusBadge(selectedOrder.status || 'pending', 'order')}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Payment Status</Label>
                              {getStatusBadge(selectedOrder.paymentStatus || 'pending', 'payment')}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Fulfillment</Label>
                              {getStatusBadge(selectedOrder.fulfillmentStatus || 'pending', 'fulfillment')}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Customer & Order Info */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Customer Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {(() => {
                              const customer = Array.isArray((selectedOrder.expand as any)?.customerId) ? (selectedOrder.expand as any).customerId[0] : (selectedOrder.expand as any)?.customerId
                              const customerInfo = selectedOrder.customerInfo as any
                              
                              return (
                                <>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Name</Label>
                                    <div className="font-medium text-sm">
                                      {customer?.full_name || customerInfo?.fullName || 'Unknown Customer'}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <div className="text-sm">{customer?.email || customerInfo?.email}</div>
                                  </div>
                                  {(customerInfo?.phoneNumber) && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Phone</Label>
                                      <div className="text-sm flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {customerInfo.phoneNumber}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Order Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Order Date</Label>
                              <div className="text-sm">{new Date(selectedOrder.created).toLocaleString()}</div>
                            </div>
                            {selectedOrder.trackingNumber && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Tracking Number</Label>
                                <div className="text-sm font-mono">{selectedOrder.trackingNumber}</div>
                              </div>
                            )}
                            {selectedOrder.estimatedDelivery && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Estimated Delivery</Label>
                                <div className="text-sm">{new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Shipping Address */}
                      {selectedOrder.shippingAddress && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Shipping Address
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {(() => {
                              const address = selectedOrder.shippingAddress as any
                              return (
                                <div className="text-sm space-y-1">
                                  <div>{address.addressLine1}</div>
                                  {address.addressLine2 && <div>{address.addressLine2}</div>}
                                  <div>{address.city}, {address.state} {address.zipCode}</div>
                                  <div>{address.country}</div>
                                </div>
                              )
                            })()}
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    <TabsContent value="items" className="space-y-4">
                      {/* Order Items - Using new direct query component */}
                      <OrderItemsList 
                        order={selectedOrder} 
                        formatPrice={formatPrice} 
                      />

                      {/* COD Information */}
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Cash on Delivery:</strong> Customer will pay {formatPrice(selectedOrder.total || 0)} upon delivery.
                        </AlertDescription>
                      </Alert>
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-4">
                      {/* Notes Section */}
                      <div className="grid grid-cols-1 gap-4">
                        {selectedOrder.notes && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Customer Notes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm whitespace-pre-wrap">{selectedOrder.notes}</p>
                            </CardContent>
                          </Card>
                        )}

                        {selectedOrder.internalNotes && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Internal Notes
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm whitespace-pre-wrap font-mono">{selectedOrder.internalNotes}</p>
                            </CardContent>
                          </Card>
                        )}

                        {!selectedOrder.notes && !selectedOrder.internalNotes && (
                          <Card>
                            <CardContent className="p-6 sm:p-8 text-center">
                              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground">No notes available for this order</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>

          {/* Enhanced Status Update Dialog */}
          <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
            <DialogContent className="max-w-md sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">Update Order</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 sm:space-y-6">
                <Tabs defaultValue="status" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  </TabsList>

                  <TabsContent value="status" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Order Status</Label>
                        <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrdersStatusOptions)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Payment Status</Label>
                        <Select value={newPaymentStatus} onValueChange={(value) => setNewPaymentStatus(value as OrdersPaymentStatusOptions)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cod-confirmed">COD Confirmed</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Fulfillment Status</Label>
                        <Select value={newFulfillmentStatus} onValueChange={(value) => setNewFulfillmentStatus(value as OrdersFulfillmentStatusOptions)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tracking" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Tracking Number</Label>
                        <Input
                          placeholder="Enter tracking number..."
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Estimated Delivery Date</Label>
                        <Input
                          type="date"
                          value={estimatedDelivery}
                          onChange={(e) => setEstimatedDelivery(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label className="text-sm">Update Notes</Label>
                  <Textarea
                    placeholder="Add notes about this update..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Order'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  )
}
