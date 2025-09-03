import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle, Package } from 'lucide-react'
import { useState } from 'react'
import { type CartesResponse, type ProductsResponse, type StoresResponse, Collections, CustomersStatusOptions, OrdersStatusOptions, OrdersPaymentStatusOptions, OrdersFulfillmentStatusOptions } from '@/lib/types'
import pb from '@/lib/db'
import { calculateCartSummary } from '@/lib/cart-utils'
import type { OrdersRecord, OrderItemsRecord, CustomersRecord } from '@/lib/types'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShippingAddressForm } from '@/components/checkoutComponents/ShippingAddressForm'
import { ShippingOptionsForm } from '@/components/checkoutComponents/ShippingOptionsForm'
import { OrderReview } from '@/components/checkoutComponents/OrderReview'
import { CODTerms } from '@/components/checkoutComponents/CODTerms'
import { OrderSummary } from '@/components/checkoutComponents/OrderSummary'
import { CheckoutStepper } from '@/components/checkoutComponents/CheckoutStepper'

// Shipping address interface
interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Checkout settings interface
interface CheckoutField {
  id: string;
  label: string;
  required: boolean;
  enabled: boolean;
  order: number;
}

interface CheckoutSettings {
  fields?: {
    phoneRequired?: boolean;
    companyNameEnabled?: boolean;
    customFields?: any[];
    configurableFields?: CheckoutField[];
  };
  appearance?: {
    primaryColor?: string;
    buttonText?: string;
    submitButtonText?: string;
  };
  features?: {
    guestCheckoutEnabled?: boolean;
    showOrderSummary?: boolean;
    enableCouponCodes?: boolean;
    enableShippingStep?: boolean;
  };
  messages?: {
    thankYouMessage?: string;
    processingMessage?: string;
  };
}

export const Route = createFileRoute('/(public)/checkout/')({
  loader: async () => {
    // Fetch real cart items and store settings with customization data
    const [cartItems, storeSettings] = await Promise.all([
      pb.collection(Collections.Cartes).getFullList<CartesResponse<{ 
        productId: ProductsResponse[] 
      }>>(50, {
        expand: 'productId',
        sort: '-created'
      }),
      pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-checkout-${Date.now()}`
      }).catch(() => null)
    ])

    const cartSummary = calculateCartSummary(cartItems, storeSettings)

    // Parse settings for checkout availability
    const settings = storeSettings?.checkoutSettings ? 
      (typeof storeSettings.checkoutSettings === 'string' ? 
        JSON.parse(storeSettings.checkoutSettings) : 
        storeSettings.checkoutSettings) : {}

    return {
      cartItems,
      cartSummary,
      storeSettings,
      cartEnabled: settings.cartEnabled ?? true,
      checkoutEnabled: settings.checkoutEnabled ?? true
    }
  },
  component: RouteComponent,
})

// Main RouteComponent - Using extracted components
function RouteComponent() {
  const { cartItems, cartSummary, storeSettings, cartEnabled, checkoutEnabled } = Route.useLoaderData()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [customerInfo, setCustomerInfo] = useState<any>({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    companyName: '',
    email: '',
  })
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [errors, setErrors] = useState<any>({})
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Get checkout customization settings - properly typed
  const checkoutSettings: CheckoutSettings = storeSettings?.checkoutSettings ? 
    (typeof storeSettings.checkoutSettings === 'string' ? 
      JSON.parse(storeSettings.checkoutSettings) : 
      storeSettings.checkoutSettings) : {
    fields: { 
      phoneRequired: true, 
      companyNameEnabled: false, 
      customFields: [],
      configurableFields: [
        { id: 'fullName', label: 'Full Name', required: true, enabled: true, order: 1 },
        { id: 'phoneNumber', label: 'Phone Number', required: true, enabled: true, order: 2 },
        { id: 'email', label: 'Email Address', required: true, enabled: true, order: 3 },
        { id: 'address', label: 'Address', required: true, enabled: true, order: 4 },
        { id: 'city', label: 'City', required: true, enabled: true, order: 5 }
      ]
    },
    appearance: { primaryColor: '#3b82f6', buttonText: 'Continue', submitButtonText: 'Place Order' },
    features: { 
      guestCheckoutEnabled: true, 
      showOrderSummary: true, 
      enableCouponCodes: false,
      enableShippingStep: true
    },
    messages: { thankYouMessage: '', processingMessage: '' }
  }

  // Check if shipping step is enabled
  const enableShippingStep = checkoutSettings.features?.enableShippingStep ?? true
  
  // Get shipping zones to determine if step 3 should be shown
  const shippingZones = storeSettings?.shippingZones || []
  
  // Fix: Properly check if shipping zones exist and are active
  const hasShippingZones = Array.isArray(shippingZones) && 
    shippingZones.length > 0 && 
    shippingZones.some((zone: any) => zone.isActive === true)
    
  const activeShippingZones = hasShippingZones ? 
    shippingZones.filter((zone: any) => zone.isActive === true) : []

  // Shipping steps logic: both address and options controlled by single toggle
  const shouldShowShippingStep = enableShippingStep && hasShippingZones

  // Auto-select first shipping option if available
  const [selectedShippingOption, setSelectedShippingOption] = useState(
    activeShippingZones.length > 0 ? activeShippingZones[0].id : 'none'
  )

  // Redirect if cart or checkout is disabled
  if (!cartEnabled || !checkoutEnabled) {
    navigate({ to: '/cart' })
    return null
  }

  // Redirect to cart if no items
  if (cartItems.length === 0) {
    navigate({ to: '/cart' })
    return null
  }

  // Validation function
  const validateForm = (): any => {
    const newErrors: any = {}

    if (currentStep === 1) {
      // Validate configurable fields
      const enabledFields = checkoutSettings.fields?.configurableFields || []
      enabledFields
        .filter((field: any) => field.enabled && field.required)
        .forEach((field: any) => {
          const fieldValue = customerInfo[field.id]
          if (!fieldValue?.trim()) {
            newErrors[field.id] = `${field.label} is required`
          }
          
          // Special validation for email
          if (field.id === 'email' && fieldValue?.trim()) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
              newErrors[field.id] = 'Please enter a valid email address'
            }
          }
          
          // Special validation for phone numbers
          if (field.id === 'phoneNumber' && fieldValue?.trim()) {
            if (!/^[\d\s\-\+\(\)]{10,}$/.test(fieldValue.replace(/\s/g, ''))) {
              newErrors[field.id] = 'Please enter a valid phone number'
            }
          }
        })
    }

    if (currentStep === 2 && enableShippingStep) {
      if (!shippingAddress.addressLine1.trim()) {
        newErrors.addressLine1 = 'Street address is required'
      }
      if (!shippingAddress.city.trim()) {
        newErrors.city = 'City is required'
      }
      if (!shippingAddress.state.trim()) {
        newErrors.state = 'State is required'
      }
      if (!shippingAddress.zipCode.trim()) {
        newErrors.zipCode = 'ZIP code is required'
      }
      if (!shippingAddress.country.trim()) {
        newErrors.country = 'Country is required'
      }
    }

    setErrors(newErrors)
    return newErrors
  }

  const handleCustomerFieldChange = (field: string, value: string) => {
    setCustomerInfo((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleShippingFieldChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleContinue = () => {
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length === 0) {
      if (currentStep === 1) {
        // Skip shipping steps entirely if disabled or no zones
        if (!shouldShowShippingStep) {
          setCurrentStep(4) // Go directly to review
        } else {
          setCurrentStep(2) // Go to shipping address
        }
      } else if (currentStep === 2 && shouldShowShippingStep) {
        setCurrentStep(3) // Go to shipping options
      } else if (currentStep === 3) {
        setCurrentStep(4)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 4 && !shouldShowShippingStep) {
        // Go back to step 1 if shipping is disabled
        setCurrentStep(1)
      } else {
        setCurrentStep(currentStep - 1)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate({ to: '/cart' })
    }
  }

  const handleEditStep = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePlaceOrder = async () => {
    if (!termsAccepted || isPlacingOrder) return
    
    setIsPlacingOrder(true)
    
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      // Always create a new customer record for each order (guest checkout)
      const customerData: Partial<CustomersRecord> = {
        full_name: customerInfo.fullName,
        email: customerInfo.email,
        phone: customerInfo.phoneNumber ? parseInt(customerInfo.phoneNumber.replace(/\D/g, '')) : undefined,
        status: CustomersStatusOptions.active,
        totalOrders: 1,
        totalSpent: cartSummary.total,
        lastOrderDate: new Date().toISOString()
      }
      
      // Create new customer record for this order
      const newCustomer = await pb.collection(Collections.Customers).create(customerData, {
        requestKey: `create-customer-${Date.now()}`
      })
      const customerId = newCustomer.id

      // Prepare shipping address
      const finalShippingAddress = enableShippingStep ? shippingAddress : {
        addressLine1: customerInfo.address || '',
        addressLine2: '',
        city: customerInfo.city || '',
        state: '',
        zipCode: '',
        country: 'MA'
      }

      // Get selected shipping cost
      let shippingCost = 0
      if (hasShippingZones && selectedShippingOption !== 'none') {
        const selectedZone = activeShippingZones.find((zone: any) => zone.id === selectedShippingOption)
        shippingCost = selectedZone?.shippingCost || 0
      }

      // Calculate final total with tax if enabled
      const finalTotal = cartSummary.subtotal + shippingCost + (cartSummary.tax || 0)

      // Create order
      const orderData: Partial<OrdersRecord> = {
        orderNumber,
        customerId: [customerId],
        customerInfo: {
          fullName: customerInfo.fullName,
          email: customerInfo.email,
          phoneNumber: customerInfo.phoneNumber
        },
        shippingAddress: finalShippingAddress,
        status: OrdersStatusOptions.pending,
        paymentStatus: OrdersPaymentStatusOptions.pending,
        fulfillmentStatus: OrdersFulfillmentStatusOptions.pending,
        subtotal: cartSummary.subtotal,
        shipping: shippingCost,
        total: finalTotal,
        notes: customerInfo.notes || ''
      }

      const order = await pb.collection(Collections.Orders).create(orderData, {
        requestKey: `create-order-${Date.now()}`
      })

      // Create order items with proper product relationship - using 'products' field per types
      for (const cartItem of cartItems) {
        const productId = Array.isArray(cartItem.productId) ? cartItem.productId[0] : cartItem.productId
        
        // Debug: Log cart item to order item conversion
        console.log('🔄 Converting cart item to order item:', {
          cartItemId: cartItem.id,
          productId: productId,
          quantity: cartItem.quantity,
          price: cartItem.price,
          cartVariants: cartItem.selected_variants,
          variantType: typeof cartItem.selected_variants,
          hasVariants: !!cartItem.selected_variants
        })
        
        const orderItemData: Partial<OrderItemsRecord> = {
          orderId: [order.id],
          products: productId ? [productId] : undefined,
          quantity: cartItem.quantity || 1,
          price: cartItem.price || 0,
          selectedVariants: cartItem.selected_variants || null
        }

        // Debug: Log order item data before creation
        console.log('📦 Order item data to be created:', orderItemData)

        await pb.collection(Collections.OrderItems).create(orderItemData, {
          requestKey: `create-order-item-${order.id}-${Date.now()}`
        })
      }

      // Clear cart after successful order creation
      for (const cartItem of cartItems) {
        await pb.collection(Collections.Cartes).delete(cartItem.id, {
          requestKey: `clear-cart-${cartItem.id}-${Date.now()}`
        })
      }

      // Refresh cart count in header
      if ((window as any).refreshCartCount) {
        (window as any).refreshCartCount()
      }

      // Navigate to order confirmation with order ID and order number
      navigate({ 
        to: '/order-confirmation',
        search: { orderId: order.id, orderNumber: orderNumber }
      })

    } catch (error) {
      console.error('Failed to place order:', error)
      setIsPlacingOrder(false)
      alert('Failed to place order. Please try again.')
    }
  }

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      const enabledFields = checkoutSettings.fields?.configurableFields || []
      const requiredFields = enabledFields.filter((field: any) => field.enabled && field.required)
      
      for (const field of requiredFields) {
        if (!customerInfo[field.id]?.trim() || errors[field.id]) {
          return false
        }
      }
      return true
    } else if (currentStep === 2 && shouldShowShippingStep) {
      return shippingAddress.addressLine1.trim() &&
             shippingAddress.city.trim() &&
             shippingAddress.state.trim() &&
             shippingAddress.zipCode.trim() &&
             shippingAddress.country.trim() &&
             !errors.addressLine1 && !errors.city && !errors.state && !errors.zipCode && !errors.country
    } else if (currentStep === 3) {
      return selectedShippingOption.trim() !== ''
    } else if (currentStep === 4) {
      return termsAccepted
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header with store branding */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-9 px-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Cart' : 'Back'}
          </Button>
          <h1 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: checkoutSettings.appearance?.primaryColor }}
          >
            Checkout
          </h1>
          {storeSettings?.storeName && (
            <span className="text-sm text-gray-500">- {storeSettings.storeName}</span>
          )}
        </div>

        {/* Progress Stepper */}
        <CheckoutStepper
          currentStep={currentStep} 
          primaryColor={checkoutSettings.appearance?.primaryColor}
          hasShippingZones={hasShippingZones}
          enableShippingStep={shouldShowShippingStep}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {currentStep === 1 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <p className="text-sm text-gray-600">We'll use this to contact you about your order</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Render fields based on configuration */}
                  {checkoutSettings.fields?.configurableFields
                    ?.filter((field: any) => field.enabled)
                    ?.sort((a: any, b: any) => a.order - b.order)
                    ?.map((field: any) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-sm font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.id}
                        type={field.id === 'email' ? 'email' : field.id === 'phoneNumber' ? 'tel' : 'text'}
                        value={customerInfo[field.id] || ''}
                        onChange={(e) => handleCustomerFieldChange(field.id, e.target.value)}
                        placeholder={
                          field.id === 'email' ? 'your@email.com' :
                          field.id === 'phoneNumber' ? '+212 600 000 000' :
                          field.id === 'fullName' ? 'John Doe' :
                          field.id === 'address' ? 'Street address, apartment, suite, etc.' :
                          field.id === 'city' ? 'Casablanca' :
                          field.id === 'companyName' ? 'Company name (optional)' :
                          `Enter ${field.label.toLowerCase()}`
                        }
                        className={errors[field.id] ? 'border-red-500' : ''}
                        required={field.required}
                      />
                      {errors[field.id] && (
                        <p className="text-sm text-red-600">{errors[field.id]}</p>
                      )}
                      {field.id === 'email' && (
                        <p className="text-xs text-gray-500">We'll send order updates to this email</p>
                      )}
                      {field.id === 'phoneNumber' && (
                        <p className="text-xs text-gray-500">Required for delivery coordination</p>
                      )}
                    </div>
                  ))}

                  {/* Fallback if no fields configured */}
                  {(!checkoutSettings.fields?.configurableFields || checkoutSettings.fields.configurableFields.length === 0) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="fullName"
                          type="text"
                          value={customerInfo.fullName || ''}
                          onChange={(e) => handleCustomerFieldChange('fullName', e.target.value)}
                          placeholder="John Doe"
                          className={errors.fullName ? 'border-red-500' : ''}
                          required
                        />
                        {errors.fullName && (
                          <p className="text-sm text-red-600">{errors.fullName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email || ''}
                          onChange={(e) => handleCustomerFieldChange('email', e.target.value)}
                          placeholder="your@email.com"
                          className={errors.email ? 'border-red-500' : ''}
                          required
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600">{errors.email}</p>
                        )}
                        <p className="text-xs text-gray-500">We'll send order updates to this email</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-sm font-medium">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phoneNumber"
                          type="tel"
                          value={customerInfo.phoneNumber || ''}
                          onChange={(e) => handleCustomerFieldChange('phoneNumber', e.target.value)}
                          placeholder="+212 600 000 000"
                          className={errors.phoneNumber ? 'border-red-500' : ''}
                          required
                        />
                        {errors.phoneNumber && (
                          <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                        )}
                        <p className="text-xs text-gray-500">Required for delivery coordination</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">
                          Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="address"
                          type="text"
                          value={customerInfo.address || ''}
                          onChange={(e) => handleCustomerFieldChange('address', e.target.value)}
                          placeholder="Street address, apartment, suite, etc."
                          className={errors.address ? 'border-red-500' : ''}
                          required
                        />
                        {errors.address && (
                          <p className="text-sm text-red-600">{errors.address}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          value={customerInfo.city || ''}
                          onChange={(e) => handleCustomerFieldChange('city', e.target.value)}
                          placeholder="Casablanca"
                          className={errors.city ? 'border-red-500' : ''}
                          required
                        />
                        {errors.city && (
                          <p className="text-sm text-red-600">{errors.city}</p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show shipping address step if shipping is enabled and has zones */}
            {currentStep === 2 && shouldShowShippingStep && (
              <ShippingAddressForm
                shippingAddress={shippingAddress}
                errors={errors}
                onChange={handleShippingFieldChange}
                onValidate={validateForm}
              />
            )}

            {/* Show shipping options if zones are configured and shipping enabled */}
            {currentStep === 3 && shouldShowShippingStep && (
              <ShippingOptionsForm
                selectedOption={selectedShippingOption}
                onChange={setSelectedShippingOption}
                storeSettings={storeSettings}
              />
            )}

            {currentStep === 4 && (
              <div className="space-y-4 lg:space-y-6">
                <OrderReview
                  customerInfo={customerInfo}
                  shippingAddress={shouldShowShippingStep ? shippingAddress : {
                    addressLine1: customerInfo.address || '',
                    city: customerInfo.city || '',
                    state: '',
                    zipCode: '',
                    country: ''
                  }}
                  selectedShippingOption={selectedShippingOption}
                  cartItems={cartItems}
                  cartSummary={cartSummary}
                  onEdit={handleEditStep}
                  storeSettings={storeSettings}
                  hasShippingZones={hasShippingZones}
                  enableShippingStep={shouldShowShippingStep}
                />
                <CODTerms
                  accepted={termsAccepted}
                  onAcceptChange={setTermsAccepted}
                  storeSettings={storeSettings}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="w-full sm:w-auto h-12 sm:h-10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Back to Cart' : 'Back'}
              </Button>
              
              <Button 
                onClick={currentStep === 4 ? handlePlaceOrder : handleContinue}
                disabled={!isCurrentStepValid() || isPlacingOrder}
                className="w-full sm:w-auto h-12 sm:h-10 min-w-[120px]"
                style={{ 
                  backgroundColor: checkoutSettings.appearance?.primaryColor,
                  borderColor: checkoutSettings.appearance?.primaryColor
                }}
              >
                {currentStep === 4 ? (
                  <>
                    {isPlacingOrder ? (
                      <>
                        <Package className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {checkoutSettings.appearance?.submitButtonText || 'Place Order'}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {currentStep === 1 && !shouldShowShippingStep
                      ? 'Review Order'
                      : currentStep === 3
                      ? 'Review Order' 
                      : checkoutSettings.appearance?.buttonText || 'Continue'
                    }
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 order-first lg:order-last">
            <OrderSummary
              cartItems={cartItems} 
              cartSummary={cartSummary}
              selectedShippingOption={selectedShippingOption}
              storeSettings={storeSettings}
            />
          </div>
        </div>
      </div>
    </div>
  )
}