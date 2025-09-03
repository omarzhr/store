import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Copy, Package, Calendar, MapPin, Phone, Mail, ArrowRight, Download, HeadphonesIcon, Truck } from 'lucide-react'
import { useState } from 'react'
import type { OrdersResponse, OrderItemsResponse, CustomersResponse, ProductsResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(public)/order-confirmation/$orderId')({
  loader: async ({ params }) => {
    try {
      // Fetch the order with expanded data
      const order = await pb.collection(Collections.Orders).getOne<OrdersResponse<{
        customerId: CustomersResponse,
        'order_items(orderId)': OrderItemsResponse<{
          products: ProductsResponse[]
        }>[]
      }>>(params.orderId, {
        expand: 'customerId,order_items(orderId).products'
      })

      return { order }
    } catch (error) {
      console.error('Failed to fetch order:', error)
      throw new Error('Order not found')
    }
  },
  component: RouteComponent,
})

// Order Header Component  
function OrderHeader({ order }: { order: OrdersResponse<any> }) {
  const [orderNumberCopied, setOrderNumberCopied] = useState(false)

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber || order.id)
    setOrderNumberCopied(true)
    setTimeout(() => setOrderNumberCopied(false), 2000)
  }

  return (
    <div className="text-center space-y-4 mb-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Order Confirmed!
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Thank you for your order. We'll send you updates via email.
        </p>
      </div>

      {/* Order Number */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-gray-500">Order Number:</span>
          <span className="text-lg font-mono font-semibold text-gray-900">
            {order.orderNumber || order.id}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyOrderNumber}
            className="h-8 w-8 p-0"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        {orderNumberCopied && (
          <p className="text-xs text-green-600 mt-1">Order number copied!</p>
        )}
      </div>

      {/* Order Date */}
      <p className="text-sm text-gray-500">
        Placed on {new Date(order.created).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </p>
    </div>
  )
}

// COD Instructions Component
function CODInstructions({ order }: { order: OrdersResponse<any> }) {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
          💰 Cash on Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Amount to pay on delivery:</span>
            <span className="text-xl font-bold text-gray-900">
              ${(order.total || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Please have the exact amount ready in cash
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <h4 className="font-medium text-amber-800">Important Instructions:</h4>
          <ul className="space-y-2 text-amber-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 shrink-0"></span>
              <span>Payment is due in cash when your order arrives</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 shrink-0"></span>
              <span>You can inspect items before making payment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 shrink-0"></span>
              <span>Damaged items can be refused without payment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 shrink-0"></span>
              <span>Keep this order number for reference</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Items List Component
function OrderItemsList({ order }: { order: OrdersResponse<{
  'order_items(orderId)': OrderItemsResponse<{
    products: ProductsResponse[]
  }>[]
}> }) {
  // Get order items from expanded data
  const orderItems = (order.expand as any)?.['order_items(orderId)'] || []
  
  // Calculate summary from order items
  const calculateSummary = () => {
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const shipping = order.shipping || 0
    const tax = 0 // Tax is not stored separately in the current schema
    const total = order.total || (subtotal + shipping + tax)
    const itemCount = orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
    
    return { subtotal, shipping, tax, total, itemCount }
  }
  
  const summary = calculateSummary()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5" />
          Order Items ({summary.itemCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderItems.map((item: any) => {
          const product = Array.isArray(item.expand?.products) ? item.expand.products[0] : item.expand?.products
          return (
            <div key={item.id} className="flex gap-3">
              <img
                src={product?.featured_image 
                  ? `http://127.0.0.1:8090/api/files/products/${product.id}/${product.featured_image}` 
                  : product?.images?.[0] 
                    ? `http://127.0.0.1:8090/api/files/products/${product.id}/${product.images[0]}`
                    : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
                }
                alt={product?.title || 'Product'}
                className="w-16 h-16 object-cover rounded border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                  {product?.title || 'Product'}
                </h4>
                {item.selectedVariants && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(item.selectedVariants as any).map(([, value], index) => (
                      <span key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {value as string}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                  <span>Qty: {item.quantity}</span>
                  <span>•</span>
                  <span>${item.price.toFixed(2)} each</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}

        <Separator />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${summary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${summary.tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">${summary.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Delivery Info Component
function DeliveryInfo({ order }: { order: OrdersResponse<{
  customerId: CustomersResponse
}> }) {
  // Get customer info from expanded data
  const customer = Array.isArray((order.expand as any)?.customerId) ? (order.expand as any).customerId[0] : (order.expand as any)?.customerId
  const customerInfo = order.customerInfo as any
  
  // Use customer info from the order or fallback to expanded customer
  const firstName = customerInfo?.firstName || customer?.firstName || 'Customer'
  const lastName = customerInfo?.lastName || customer?.lastName || ''
  const email = customerInfo?.email || customer?.email || ''
  const phone = customerInfo?.phone || customer?.phone || ''
  
  // Parse shipping address from order
  const shippingInfo = order.shippingAddress as any || {}
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, icon: Package, label: 'Order Pending', color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, label: 'Order Confirmed', color: 'text-green-600' },
      preparing: { variant: 'default' as const, icon: Package, label: 'Preparing Order', color: 'text-blue-600' },
      shipped: { variant: 'default' as const, icon: Truck, label: 'Order Shipped', color: 'text-purple-600' },
      delivered: { variant: 'default' as const, icon: CheckCircle, label: 'Order Delivered', color: 'text-green-600' },
      cancelled: { variant: 'destructive' as const, icon: Package, label: 'Order Cancelled', color: 'text-red-600' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    )
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5" />
          Delivery Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium text-sm text-blue-900 mb-2">
                Current Status
              </div>
              {getStatusBadge(order.status)}
              <div className="text-xs text-blue-600 mt-2">
                We'll contact you before delivery
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm">Shipping Address</span>
          </div>
          <div className="text-sm text-gray-700 ml-6 space-y-1">
            <div>{firstName} {lastName}</div>
            <div>{shippingInfo.address || shippingInfo.addressLine1 || 'Address not provided'}</div>
            {shippingInfo.addressLine2 && (
              <div>{shippingInfo.addressLine2}</div>
            )}
            <div>
              {shippingInfo.city || ''}{shippingInfo.city && shippingInfo.state ? ', ' : ''}{shippingInfo.state || ''} {shippingInfo.zipCode || shippingInfo.postalCode || ''}
            </div>
            <div>{shippingInfo.country || 'Morocco'}</div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-sm">Contact Information</span>
          </div>
          <div className="text-sm text-gray-700 ml-6 space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span>{email || 'Email not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{phone || 'Phone not provided'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const { order } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleDownloadReceipt = () => {
    // Get order items and customer info
    const orderItems = (order.expand as any)?.['order_items(orderId)'] || []
    const customer = Array.isArray((order.expand as any)?.customerId) ? (order.expand as any).customerId[0] : (order.expand as any)?.customerId
    const customerInfo = order.customerInfo as any
    
    const firstName = customerInfo?.firstName || customer?.firstName || 'Customer'
    const lastName = customerInfo?.lastName || customer?.lastName || ''
    
    // Calculate totals
    const subtotal = orderItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const shipping = order.shipping || 0
    const tax = 0 // Tax is not stored separately in the current schema
    const total = order.total || (subtotal + shipping + tax)
    
    const receiptContent = `
Order Receipt
==============

Order Number: ${order.orderNumber || order.id}
Date: ${new Date(order.created).toLocaleDateString()}
Customer: ${firstName} ${lastName}
Status: ${order.status}

Items:
${orderItems.map((item: any) => {
  const product = Array.isArray(item.expand?.products) ? item.expand.products[0] : item.expand?.products
  return `- ${product?.name || 'Product'} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
}).join('\n')}

Summary:
Subtotal: $${subtotal.toFixed(2)}
Shipping: $${shipping.toFixed(2)}
Tax: $${tax.toFixed(2)}
Total: $${total.toFixed(2)}

Payment Method: Cash on Delivery

Thank you for your order!
    `
    
    // Create and download as a text file
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt-${order.orderNumber || order.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleContinueShopping = () => {
    navigate({ to: '/products' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
        {/* Order Header */}
        <OrderHeader order={order} />

        {/* COD Instructions */}
        <div className="mb-6">
          <CODInstructions order={order} />
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <OrderItemsList order={order} />
        </div>

        {/* Delivery Info */}
        <div className="mb-6">
          <DeliveryInfo order={order} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full h-12" size="lg" onClick={handleDownloadReceipt}>
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          
          <Button variant="outline" className="w-full h-12" size="lg" onClick={handleContinueShopping}>
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Support Contact */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
            <HeadphonesIcon className="w-4 h-4" />
            <span>Need help with your order?</span>
          </div>
          <Button variant="link" className="text-primary">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}
