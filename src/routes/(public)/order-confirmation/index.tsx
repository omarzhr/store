import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Package, ArrowLeft, Download, Mail, MapPin, Phone, Calendar, Truck, CreditCard } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { OrdersResponse, OrderItemsResponse, ProductsResponse, CustomersResponse, StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { formatPrice } from '@/lib/cart-utils'

export const Route = createFileRoute('/(public)/order-confirmation/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orderId: search.orderId as string | undefined,
      orderNumber: search.orderNumber as string | undefined
    }
  },
  loaderDeps: ({ search: { orderId, orderNumber } }) => ({ orderId, orderNumber }),
  loader: async ({ deps: { orderId, orderNumber } }) => {
    try {
      // Redirect to home if no order parameters
      if (!orderId && !orderNumber) {
        throw new Error('No order specified')
      }

      // Get order by ID or order number
      let order: OrdersResponse<any, any, {
        customerId: CustomersResponse[],
        'order_items(orderId)': OrderItemsResponse<any, {
          productId: ProductsResponse[]
        }>[]
      }>

      if (orderId) {
        order = await pb.collection(Collections.Orders).getOne(orderId, {
          expand: 'customerId,order_items(orderId).productId',
          requestKey: `order-confirmation-${orderId}-${Date.now()}`
        })
      } else if (orderNumber) {
        const orders = await pb.collection(Collections.Orders).getList<OrdersResponse<any, any, {
          customerId: CustomersResponse[],
          'order_items(orderId)': OrderItemsResponse<any, {
            productId: ProductsResponse[]
          }>[]
        }>>(1, 1, {
          filter: `orderNumber = "${orderNumber}"`,
          expand: 'customerId,order_items(orderId).productId',
          requestKey: `order-confirmation-number-${orderNumber}-${Date.now()}`
        })
        
        if (orders.items.length === 0) {
          throw new Error('Order not found')
        }
        order = orders.items[0]
      } else {
        throw new Error('Order ID or order number required')
      }

      // Get store settings
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-confirmation-${Date.now()}`
      }).catch(() => null)

      return { order, storeSettings }
    } catch (error) {
      console.error('Failed to load order:', error)
      throw new Error('Order not found')
    }
  },
  errorComponent: ({ error }) => {
    const navigate = useNavigate()
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find the order you're looking for. It may have been removed or the link may be incorrect.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate({ to: '/' })}
                className="w-full"
              >
                Back to Home
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate({ to: '/products' })}
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { order, storeSettings } = Route.useLoaderData()
  const navigate = useNavigate()
  const [emailSent, setEmailSent] = useState(false)

  // Get customer info
  const customer = Array.isArray(order.expand?.customerId) ? order.expand.customerId[0] : order.expand?.customerId
  const customerInfo = order.customerInfo as any

  // Get order items
  const orderItems = order.expand?.['order_items(orderId)'] || []

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

  const handleSendConfirmationEmail = async () => {
    try {
      // Mock email sending - implement actual email service
      setEmailSent(true)
      setTimeout(() => setEmailSent(false), 3000)
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-12">
        {/* Success Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="mx-auto w-16 h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 lg:w-10 lg:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-base lg:text-lg text-gray-600">
            Thank you for your order. We'll send you shipping confirmation when your item(s) are on the way.
          </p>
        </div>

        {/* Email Success Alert */}
        {emailSent && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Mail className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Confirmation email sent successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information Card */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Order {order.orderNumber || `#${order.id.slice(-8)}`}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.created).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(order.status || 'pending')}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment</span>
                    </div>
                    <p className="font-medium">Cash on Delivery</p>
                  </div>
                  
                  {order.estimatedDelivery && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Estimated Delivery</span>
                      </div>
                      <p className="font-medium">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {order.trackingNumber && (
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Truck className="h-4 w-4" />
                        <span>Tracking Number</span>
                      </div>
                      <p className="font-medium font-mono text-xs">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => {
                    const product = Array.isArray(item.expand?.productId) ? item.expand.productId[0] : item.expand?.productId
                    return (
                      <div key={item.id} className="flex items-start gap-4 p-3 border rounded-lg">
                        {product?.featured_image ? (
                          <img
                            src={pb.files.getUrl(product, product.featured_image, { thumb: '80x80' })}
                            alt={item.productName || product.title}
                            className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm lg:text-base line-clamp-2">
                            {item.productName || product?.title}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Qty: {item.quantity}</span>
                            <span>×</span>
                            <span>{formatPrice(item.price || 0, storeSettings?.currency)}</span>
                          </div>
                          {item.selectedVariants && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {typeof item.selectedVariants === 'object' 
                                ? Object.entries(item.selectedVariants as Record<string, any>)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')
                                : JSON.stringify(item.selectedVariants)
                              }
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatPrice((item.price || 0) * (item.quantity || 1), storeSettings?.currency)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-medium">{customer?.full_name || customerInfo?.fullName || 'Unknown Customer'}</div>
                  <div className="text-sm text-muted-foreground">{customer?.email || customerInfo?.email}</div>
                  {customerInfo?.phoneNumber && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customerInfo.phoneNumber}
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Shipping Address</span>
                    </div>
                    <div className="text-sm pl-6">
                      {(() => {
                        const address = order.shippingAddress as any
                        return (
                          <div className="space-y-1">
                            <div>{address.addressLine1}</div>
                            {address.addressLine2 && <div>{address.addressLine2}</div>}
                            <div>{address.city}, {address.state} {address.zipCode}</div>
                            <div>{address.country}</div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal || 0, storeSettings?.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{formatPrice(order.shipping || 0, storeSettings?.currency)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.total || 0, storeSettings?.currency)}</span>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleSendConfirmationEmail}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Confirmation Email
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>

                <Separator />

                {/* Navigation */}
                <div className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => navigate({ to: '/products' })}
                  >
                    Continue Shopping
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate({ to: '/' })}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about your order, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {storeSettings?.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${storeSettings.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Support
                  </a>
                </Button>
              )}
              {storeSettings?.phone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${storeSettings.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

