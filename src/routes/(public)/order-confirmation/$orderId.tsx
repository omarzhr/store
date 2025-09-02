import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Copy, Package, Calendar, MapPin, Phone, Mail, ArrowRight, Download, HeadphonesIcon } from 'lucide-react'
import { useState } from 'react'

// Mock data types for order confirmation
interface MockCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface MockShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface MockCartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedVariants: { type: string; value: string }[];
  quantity: number;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  slug: string;
}

interface MockCartSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

interface MockOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';
  items: MockCartItem[];
  customer: MockCustomerInfo;
  shipping: MockShippingAddress;
  summary: MockCartSummary;
  estimatedDelivery: string;
  trackingNumber?: string;
  placedAt: string;
}

export const Route = createFileRoute('/(public)/order-confirmation/$orderId')({
  loader: ({ params }) => {
    // Mock order data - in real app, this would fetch from API
    const mockOrder: MockOrder = {
      id: params.orderId,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      status: 'pending',
      items: [
        {
          id: 'cart-1',
          productId: '1',
          productName: 'Wireless Bluetooth Headphones Pro Max',
          productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          selectedVariants: [
            { type: 'color', value: 'Black' },
            { type: 'size', value: 'Large' }
          ],
          quantity: 2,
          price: 89.99,
          originalPrice: 99.99,
          inStock: true,
          slug: 'wireless-bluetooth-headphones-pro-max'
        }
      ],
      customer: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567'
      },
      shipping: {
        addressLine1: '123 Main Street',
        addressLine2: 'Apt 4B',
        city: 'New York',
        state: 'New York',
        zipCode: '10001',
        country: 'US'
      },
      summary: {
        subtotal: 179.98,
        shipping: 9.99,
        tax: 18.00,
        total: 207.97,
        itemCount: 2
      },
      estimatedDelivery: '2024-01-15',
      placedAt: new Date().toISOString()
    }

    return { order: mockOrder }
  },
  component: RouteComponent,
})

// Order Header Component
function OrderHeader({ order }: { order: MockOrder }) {
  const [orderNumberCopied, setOrderNumberCopied] = useState(false)

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber)
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
            {order.orderNumber}
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
        Placed on {new Date(order.placedAt).toLocaleDateString('en-US', {
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
function CODInstructions({ order }: { order: MockOrder }) {
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
              ${order.summary.total.toFixed(2)}
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
function OrderItemsList({ order }: { order: MockOrder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="w-5 h-5" />
          Order Items ({order.summary.itemCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-16 h-16 object-cover rounded border"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                {item.productName}
              </h4>
              {item.selectedVariants.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.selectedVariants.map((variant, index) => (
                    <span key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {variant.value}
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
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-xs text-gray-500 line-through">
                  ${(item.originalPrice * item.quantity).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}

        <Separator />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${order.summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${order.summary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${order.summary.tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">${order.summary.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Delivery Info Component
function DeliveryInfo({ order }: { order: MockOrder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5" />
          Delivery Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estimated Delivery */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-sm text-blue-900">
                Estimated Delivery
              </div>
              <div className="text-sm text-blue-700">
                {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="text-xs text-blue-600 mt-1">
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
            <div>{order.customer.firstName} {order.customer.lastName}</div>
            <div>{order.shipping.addressLine1}</div>
            {order.shipping.addressLine2 && (
              <div>{order.shipping.addressLine2}</div>
            )}
            <div>
              {order.shipping.city}, {order.shipping.state} {order.shipping.zipCode}
            </div>
            <div>{order.shipping.country}</div>
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
              <span>{order.customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{order.customer.phone}</span>
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
    // Mock PDF download - in real app, this would generate and download actual PDF
    const receiptContent = `
Order Receipt
Order Number: ${order.orderNumber}
Date: ${new Date(order.placedAt).toLocaleDateString()}
Customer: ${order.customer.firstName} ${order.customer.lastName}
Total: $${order.summary.total.toFixed(2)}

Items:
${order.items.map(item => `- ${item.productName} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: $${order.summary.subtotal.toFixed(2)}
Shipping: $${order.summary.shipping.toFixed(2)}
Tax: $${order.summary.tax.toFixed(2)}
Total: $${order.summary.total.toFixed(2)}

Payment Method: Cash on Delivery
    `
    
    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt-${order.orderNumber}.txt`
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
