import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  AlertCircle, Users, Phone, Mail, Eye, MoreVertical, Download, MessageSquare, Search, 
  Filter, RefreshCw, AlertTriangle, Calendar, User, CreditCard, Edit3, Plus, Trash2, 
  ShoppingBag, ChevronDown, FileDown, FileSpreadsheet, Send, UserPlus, UserCheck,
  UserX, BarChart3, TrendingUp, Settings, MapPin, Clock, Star
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { CustomersResponse, OrdersResponse, StoresResponse } from '@/lib/types'
import { CustomersStatusOptions } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/customers/')({
  loader: async () => {
    try {
      const [customersResult, storeSettings] = await Promise.all([
        pb.collection(Collections.Customers).getFullList<CustomersResponse>(200, {
          sort: '-created',
          requestKey: `customers-list-${Date.now()}`
        }).then(customers => ({ customers, hasPermission: true }))
        .catch((error) => {
          console.warn('Customers access restricted:', error)
          if (error.status === 403 || error.message?.includes('superuser')) {
            return { customers: [], hasPermission: false }
          }
          return { customers: [], hasPermission: true }
        }),
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-customers-${Date.now()}`
        }).catch(() => null)
      ])

      return { 
        customers: customersResult.customers, 
        storeSettings, 
        hasPermission: customersResult.hasPermission
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
      return { 
        customers: [], 
        storeSettings: null, 
        hasPermission: false,
        error: error instanceof Error ? error.message : 'Failed to load customers'
      }
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const loaderData = Route.useLoaderData()
  const { customers, storeSettings, hasPermission } = loaderData
  const navigate = useNavigate()
  const [selectedCustomer, setSelectedCustomer] = useState<CustomersResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<CustomersResponse | null>(null)
  const [selectedCustomerForDelete, setSelectedCustomerForDelete] = useState<CustomersResponse | null>(null)
  const [selectedCustomerForMessage, setSelectedCustomerForMessage] = useState<CustomersResponse | null>(null)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [dateRange, setDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [loading, setLoading] = useState(false)

  // Form state for adding/editing customers
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    status: CustomersStatusOptions.active
  })

  // Message form state
  const [messageData, setMessageData] = useState({
    subject: '',
    message: ''
  })

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
                    You don't have permission to view customers. Please contact your administrator.
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


  // Stats calculations
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    blocked: customers.filter(c => c.status === 'blocked').length,
    totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    avgOrderValue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / 
                   Math.max(customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0), 1),
    newThisMonth: customers.filter(c => {
      const customerDate = new Date(c.created)
      const now = new Date()
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1)
      return customerDate >= monthAgo
    }).length
  }

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedCustomers.length === 0) return
    
    setLoading(true)
    try {
      for (const customerId of selectedCustomers) {
        let updateData: Partial<CustomersResponse> = {}
        
        switch (action) {
          case 'activate':
            updateData = { status: CustomersStatusOptions.active }
            break
          case 'deactivate':
            updateData = { status: CustomersStatusOptions.inactive }
            break
          case 'block':
            updateData = { status: CustomersStatusOptions.blocked }
            break
        }
        
        if (Object.keys(updateData).length > 0) {
          await pb.collection(Collections.Customers).update(customerId, updateData)
        }
      }
      
      setSelectedCustomers([])
      window.location.reload()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Export functionality
  const handleExport = (format: 'csv' | 'excel') => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Orders', 'Total Spent', 'Join Date']
    const data = filteredCustomers.map(customer => [
      customer.full_name || '',
      customer.email || '',
      customer.phone ? `+${customer.phone}` : '',
      customer.status || 'active',
      customer.totalOrders || 0,
      formatPrice(customer.totalSpent || 0),
      new Date(customer.created).toLocaleDateString()
    ])
    
    console.log(`Exporting ${data.length} customers as ${format}`, { headers, data })
  }

  // Send message functionality
  const handleSendMessage = async () => {
    if (!selectedCustomerForMessage || !messageData.subject || !messageData.message) return
    
    setLoading(true)
    try {
      // Mock sending message - implement with your messaging service
      console.log('Sending message to:', selectedCustomerForMessage.email, messageData)
      
      setMessageDialogOpen(false)
      setSelectedCustomerForMessage(null)
      setMessageData({ subject: '', message: '' })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mobile card component
  const CustomerCard = ({ customer }: { customer: CustomersResponse }) => (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedCustomers.includes(customer.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedCustomers([...selectedCustomers, customer.id])
                } else {
                  setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                }
              }}
            />
            <div className="font-semibold text-sm">{customer.full_name || 'N/A'}</div>
          </div>
          <div className="text-xs text-muted-foreground">{customer.email}</div>
          {customer.phone && (
            <div className="text-xs text-muted-foreground">+{customer.phone}</div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSelectedCustomerForEdit(customer)
              setFormData({
                full_name: customer.full_name || '',
                email: customer.email || '',
                phone: customer.phone?.toString() || '',
                status: customer.status || 'active'
              })
              setEditDialogOpen(true)
            }}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {getStatusBadge(customer.status || 'active')}
        </div>
        <div className="text-right space-y-1">
          <div className="font-semibold text-sm">{formatPrice(customer.totalSpent || 0)}</div>
          <div className="text-xs text-muted-foreground">{customer.totalOrders || 0} orders</div>
        </div>
      </div>
    </Card>
  )

  // Enhanced permission check UI
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-3 sm:p-4 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Customers</h1>
              <p className="text-sm text-muted-foreground">Manage customer accounts and information</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Access Restricted</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                You don't have permission to view customers. This feature requires proper database permissions.
              </p>
              
              <Alert className="max-w-lg mx-auto mb-4 sm:mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Database Setup Required:</strong> Configure the customers collection permissions in PocketBase admin panel to allow authenticated users access.
                </AlertDescription>
              </Alert>

              <Button 
                variant="outline" 
                onClick={() => navigate({ to: '/dashboard' })}
                className="mx-auto"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Enhanced filtering
  const filteredCustomers = customers.filter(customer => {
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    const matchesSearch = searchQuery === '' || 
      customer.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toString().includes(searchQuery)
    
    // Date range filtering
    let matchesDateRange = true
    if (dateRange !== 'all') {
      const customerDate = new Date(customer.created)
      const now = new Date()
      switch (dateRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDateRange = customerDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          matchesDateRange = customerDate >= monthAgo
          break
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          matchesDateRange = customerDate >= quarterAgo
          break
      }
    }
    
    return matchesStatus && matchesSearch && matchesDateRange
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      case 'oldest':
        return new Date(a.created).getTime() - new Date(b.created).getTime()
      case 'name':
        return (a.full_name || '').localeCompare(b.full_name || '')
      case 'spending':
        return (b.totalSpent || 0) - (a.totalSpent || 0)
      case 'orders':
        return (b.totalOrders || 0) - (a.totalOrders || 0)
      default:
        return 0
    }
  })

  const getStatusBadge = (status: CustomersStatusOptions) => {
    const configs = {
      active: { variant: 'default' as const, label: 'Active' },
      inactive: { variant: 'secondary' as const, label: 'Inactive' },
      blocked: { variant: 'destructive' as const, label: 'Blocked' }
    }

    const config = configs[status] || configs.active

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      status: CustomersStatusOptions.active
    })
  }

  const handleAdd = async () => {
    if (!formData.full_name || !formData.email) return
    
    setLoading(true)
    try {
      await pb.collection(Collections.Customers).create({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone ? parseInt(formData.phone) : undefined,
        status: formData.status,
        totalOrders: 0,
        totalSpent: 0
      }, {
        requestKey: `create-customer-${Date.now()}`
      })
      
      window.location.reload()
    } catch (error) {
      console.error('Failed to create customer:', error)
    } finally {
      setLoading(false)
      setAddDialogOpen(false)
      resetForm()
    }
  }

  const handleEdit = async () => {
    if (!selectedCustomerForEdit || !formData.full_name || !formData.email) return
    
    setLoading(true)
    try {
      await pb.collection(Collections.Customers).update(selectedCustomerForEdit.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone ? parseInt(formData.phone) : undefined,
        status: formData.status
      }, {
        requestKey: `update-customer-${selectedCustomerForEdit.id}-${Date.now()}`
      })
      
      window.location.reload()
    } catch (error) {
      console.error('Failed to update customer:', error)
    } finally {
      setLoading(false)
      setEditDialogOpen(false)
      setSelectedCustomerForEdit(null)
      resetForm()
    }
  }

  const handleDelete = async () => {
    if (!selectedCustomerForDelete) return
    
    setLoading(true)
    try {
      await pb.collection(Collections.Customers).delete(selectedCustomerForDelete.id, {
        requestKey: `delete-customer-${selectedCustomerForDelete.id}-${Date.now()}`
      })
      
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete customer:', error)
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setSelectedCustomerForDelete(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
          {/* Enhanced Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground">
                Manage customer accounts and relationships
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh customers</TooltipContent>
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

              <Button onClick={() => {
                resetForm()
                setAddDialogOpen(true)
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Order Value</p>
                  <p className="text-xl font-bold">{formatPrice(stats.avgOrderValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">New This Month</p>
                  <p className="text-xl font-bold text-blue-600">{stats.newThisMonth}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
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
                    placeholder="Search by name, email, or phone..."
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="spending">Highest Spending</SelectItem>
                      <SelectItem value="orders">Most Orders</SelectItem>
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
          {selectedCustomers.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={selectedCustomers.length === filteredCustomers.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCustomers(filteredCustomers.map(c => c.id))
                      } else {
                        setSelectedCustomers([])
                      }
                    }}
                  />
                  <span className="text-sm font-medium">
                    {selectedCustomers.length} customer{selectedCustomers.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    disabled={loading}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    disabled={loading}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedCustomers([])}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Customers List */}
          <Card>
            <CardContent className="p-0">
              {/* Mobile Card View */}
              <div className={`lg:hidden space-y-3 p-4 ${viewMode === 'table' ? 'hidden' : 'block'}`}>
                {filteredCustomers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
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
                            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCustomers(filteredCustomers.map(c => c.id))
                              } else {
                                setSelectedCustomers([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden lg:table-cell">Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Orders</TableHead>
                        <TableHead className="text-right">Total Spent</TableHead>
                        <TableHead className="hidden md:table-cell">Join Date</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => (
                        <TableRow key={customer.id} className="group">
                          <TableCell>
                            <Checkbox 
                              checked={selectedCustomers.includes(customer.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCustomers([...selectedCustomers, customer.id])
                                } else {
                                  setSelectedCustomers(selectedCustomers.filter(id => id !== customer.id))
                                }
                              }}
                            />
                          </TableCell>
                          
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              <div className="font-semibold">
                                {customer.full_name || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground lg:hidden">
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="text-xs text-muted-foreground lg:hidden">
                                  +{customer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-1">
                              <div className="text-sm flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="text-sm flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  +{customer.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {getStatusBadge(customer.status || 'active')}
                          </TableCell>

                          <TableCell className="hidden sm:table-cell">
                            <div className="text-sm font-medium">{customer.totalOrders || 0}</div>
                          </TableCell>
                          
                          <TableCell className="text-right font-semibold">
                            {formatPrice(customer.totalSpent || 0)}
                          </TableCell>
                          
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {new Date(customer.created).toLocaleDateString()}
                          </TableCell>
                          
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCustomerForEdit(customer)
                                  setFormData({
                                    full_name: customer.full_name || '',
                                    email: customer.email || '',
                                    phone: customer.phone?.toString() || '',
                                    status: customer.status || 'active'
                                  })
                                  setEditDialogOpen(true)
                                }}>
                                  <Edit3 className="h-4 w-4 mr-2" />
                                  Edit Customer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCustomerForMessage(customer)
                                  setMessageDialogOpen(true)
                                }}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ShoppingBag className="h-4 w-4 mr-2" />
                                  View Orders
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedCustomerForDelete(customer)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Customer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {filteredCustomers.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No customers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Start by adding your first customer'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button onClick={() => {
                      resetForm()
                      setAddDialogOpen(true)
                    }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Customer Details Dialog */}
          <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
            <DialogContent className="max-w-4xl max-h-[95vh] p-0">
              <DialogHeader className="p-4 sm:p-6 pb-0">
                <DialogTitle className="text-lg sm:text-xl">
                  Customer Profile - {selectedCustomer?.full_name}
                </DialogTitle>
              </DialogHeader>
              
              {selectedCustomer && (
                <ScrollArea className="max-h-[80vh] px-4 sm:px-6">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="orders">Orders</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                      {/* Customer Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Contact Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Full Name</Label>
                              <div className="font-medium text-sm">{selectedCustomer.full_name || 'N/A'}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Email</Label>
                              <div className="text-sm">{selectedCustomer.email || 'N/A'}</div>
                            </div>
                            {selectedCustomer.phone && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Phone</Label>
                                <div className="text-sm">+{selectedCustomer.phone}</div>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs text-muted-foreground">Status</Label>
                              <div className="mt-1">
                                {getStatusBadge(selectedCustomer.status || 'active')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Purchase Statistics
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">Total Orders</Label>
                              <div className="font-medium text-sm">{selectedCustomer.totalOrders || 0}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Total Spent</Label>
                              <div className="font-medium text-sm">{formatPrice(selectedCustomer.totalSpent || 0)}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Average Order Value</Label>
                              <div className="font-medium text-sm">
                                {formatPrice((selectedCustomer.totalSpent || 0) / Math.max((selectedCustomer.totalOrders || 0), 1))}
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Last Order Date</Label>
                              <div className="text-sm">
                                {selectedCustomer.lastOrderDate 
                                  ? new Date(selectedCustomer.lastOrderDate).toLocaleDateString()
                                  : 'Never ordered'
                                }
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Account Timeline */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Account Timeline
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Customer Since</Label>
                              <div className="text-sm">{new Date(selectedCustomer.created).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Last Updated</Label>
                              <div className="text-sm">{new Date(selectedCustomer.updated).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="orders" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Order History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-6 text-muted-foreground">
                            <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Order history will be displayed here</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Customer Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-6 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notes available for this customer</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>

          {/* Send Message Dialog */}
          <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
            <DialogContent className="max-w-md sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">
                  Send Message to {selectedCustomerForMessage?.full_name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Subject *</Label>
                  <Input
                    placeholder="Enter message subject..."
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Message *</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={messageData.message}
                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                    rows={4}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Message will be sent to: {selectedCustomerForMessage?.email}
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={loading || !messageData.subject || !messageData.message}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Customer Dialog */}
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="max-w-md sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">Add New Customer</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Full Name *</Label>
                  <Input
                    placeholder="Enter customer name..."
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Email *</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as CustomersStatusOptions })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={loading || !formData.full_name || !formData.email}>
                  {loading ? 'Adding...' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Customer Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-md sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg">Edit Customer</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Full Name *</Label>
                  <Input
                    placeholder="Enter customer name..."
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Email *</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="Enter phone number..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as CustomersStatusOptions })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit} disabled={loading || !formData.full_name || !formData.email}>
                  {loading ? 'Updating...' : 'Update Customer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Customer Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Delete Customer</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete "{selectedCustomerForDelete?.full_name}"? 
                  This action cannot be undone and will remove all associated data.
                </p>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This will permanently delete the customer and all their order history.
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete Customer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  )
}
