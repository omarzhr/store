import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Truck } from 'lucide-react'
import type { CartesRecord, OrdersRecord, OrderItemsRecord, CustomersRecord, ProductsResponse, OrdersFulfillmentStatusOptions, OrdersPaymentStatusOptions, OrdersStatusOptions } from '@/lib/types'

import pb from '@/lib/db'
import { usePriceCalculation } from '@/contexts/PriceCalculationContext'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductsResponse
}

export function CheckoutModal({
  isOpen,
  onClose,
  product
}: CheckoutModalProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  
  const {
    quantity,
    selectedVariants,
    getCurrentPrice,
    totalPrice
  } = usePriceCalculation()
  
  // Form data
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    fullName: '',
    phone: ''
  })
  
  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Morocco'
  })
  
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [notes, setNotes] = useState('')
  
  const shippingCost = 25 // Fixed shipping cost
  
  // Use shared price calculation from global context
  const itemPrice = getCurrentPrice()
  const subtotal = totalPrice
  const finalTotal = subtotal + shippingCost

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmitOrder = async () => {
    setIsLoading(true)
    
    try {
      // Simulate API calls - replace with actual PocketBase calls
      
      // 1. Create temporary cart
      const cartData: Partial<CartesRecord> = {
        productId: [product.id],
        productName: product.title,
        quantity: quantity,
        price: itemPrice,
        inStock: true
      }
      
      // 2. Create customer if needed
      const customerData: Partial<CustomersRecord> = {
        email: customerInfo.email,
        full_name: customerInfo.fullName,
        phone: parseInt(customerInfo.phone),
        status: 'active' as any, // TODO: Import CustomersStatusOptions enum
        totalOrders: 1,
        totalSpent: finalTotal
      }
      
      // 3. Create order
      const orderData: Partial<OrdersRecord> = {
        orderNumber: `ORD-${Date.now()}`,
        customerInfo: {
          email: customerInfo.email,
          fullName: customerInfo.fullName,
          phone: customerInfo.phone
        },
        shippingAddress: shippingAddress,
        subtotal: subtotal,
        shipping: shippingCost,
        total: finalTotal,
        status: 'pending' as OrdersStatusOptions,
        paymentStatus: 'pending' as OrdersPaymentStatusOptions,
        fulfillmentStatus: 'unfulfilled' as OrdersFulfillmentStatusOptions,
        notes: notes || undefined,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      // 4. Create order items
      const orderItemData: Partial<OrderItemsRecord> = {
        orderId: [`ord_${Date.now()}`], // Will be replaced with actual order.id when real API is implemented
        products: [product.id],
        quantity: quantity,
        price: itemPrice,
        selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : null
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock order ID
      const orderId = `ord_${Date.now()}`
      
      // Redirect to order confirmation page
      onClose()
      navigate({ to: `/order-confirmation/${orderId}` })
      
      console.log('Order created:', {
        orderId,
        cartData,
        customerData,
        orderData,
        orderItemData
      })
      
    } catch (error) {
      console.error('Failed to create order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setCustomerInfo({ email: '', fullName: '', phone: '' })
    setShippingAddress({ address: '', city: '', state: '', postalCode: '', country: 'Morocco' })
    setPaymentMethod('cod')
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div>
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum === step ? 'bg-primary text-white' :
                    stepNum < step ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNum < step ? '✓' : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      stepNum < step ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Order Summary */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Order Summary</h3>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={product.featured_image ? 
                          pb.files.getUrl(product, product.featured_image, { thumb: '150x150' }) : 
                          (product.images && product.images.length > 0 ? 
                            pb.files.getUrl(product, product.images[0], { thumb: '150x150' }) : 
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop'
                          )
                        }
                        alt={product.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{product.title}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>Quantity: {quantity}</div>
                        </div>
                        <div className="font-semibold mt-2">${subtotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={handleNextStep} className="w-full">
                  Continue to Customer Info
                </Button>
              </div>
            )}

            {/* Step 2: Customer Information */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+212 600 000 000"
                      required
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6">Shipping Address</h3>
                
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Street address, apartment, suite, etc."
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Casablanca"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Casablanca-Settat"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                        placeholder="20000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Morocco"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handlePrevStep} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleNextStep} 
                    className="flex-1"
                    disabled={!customerInfo.email || !customerInfo.fullName || !customerInfo.phone || !shippingAddress.address || !shippingAddress.city}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment & Review */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Payment Method</h3>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-sm text-gray-600">Pay when you receive your order</div>
                        </div>
                        <Truck className="w-5 h-5 text-gray-400" />
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-50">
                    <RadioGroupItem value="card" id="card" disabled />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-gray-600">Coming soon</div>
                        </div>
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for your order..."
                    className="mt-1"
                  />
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Order Review</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Customer:</strong> {customerInfo.fullName}</div>
                      <div><strong>Email:</strong> {customerInfo.email}</div>
                      <div><strong>Phone:</strong> {customerInfo.phone}</div>
                      <div><strong>Shipping:</strong> {shippingAddress.address}, {shippingAddress.city}</div>
                      <div><strong>Payment:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'}</div>
                    </div>
                    <Separator className="my-3" />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>${shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>${finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handlePrevStep} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmitOrder} 
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Place Order - $${finalTotal.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
