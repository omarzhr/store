import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, User, Mail, Phone, MapPin, Building, Truck, Clock, Zap, CheckCircle, Edit, Shield } from 'lucide-react'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Mock data types for checkout
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

interface MockShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  icon: 'truck' | 'clock' | 'zap';
}

// Validation errors interface
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Mock address suggestions data
interface MockAddressSuggestion {
  id: string;
  fullAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const Route = createFileRoute('/(public)/checkout/')({
  loader: () => {
    // Mock cart data - in real app, this would come from cart context/localStorage
    const mockCartItems: MockCartItem[] = [
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
    ]

    const cartSummary: MockCartSummary = {
      subtotal: 179.98,
      shipping: 9.99,
      tax: 18.00,
      total: 207.97,
      itemCount: 2
    }

    return {
      cartItems: mockCartItems,
      cartSummary
    }
  },
  component: RouteComponent,
})

// Checkout Progress Stepper Component
function CheckoutStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, title: 'Information', description: 'Contact details' },
    { number: 2, title: 'Shipping', description: 'Delivery address' },
    { number: 3, title: 'Options', description: 'Shipping method' },
    { number: 4, title: 'Review', description: 'Confirm order' }
  ]

  return (
    <div className="mb-6 lg:mb-8">
      {/* Mobile Stepper */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200
                  ${currentStep >= step.number 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-gray-300 text-gray-500'
                  }
                `}>
                  <span className="text-sm font-semibold">{step.number}</span>
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-primary' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 transition-colors duration-200
                  ${currentStep > step.number ? 'bg-primary' : 'bg-gray-300'}
                `} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Customer Information Form Component
function CustomerInfoForm({
  customerInfo,
  errors,
  onChange,
  onValidate
}: {
  customerInfo: MockCustomerInfo
  errors: FormErrors
  onChange: (field: keyof MockCustomerInfo, value: string) => void
  onValidate: () => FormErrors
}) {
  const handleBlur = (field: keyof MockCustomerInfo) => {
    onValidate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
          <User className="w-5 h-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 lg:space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name *
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter first name"
              value={customerInfo.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              className={`h-11 ${errors.firstName ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name *
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter last name"
              value={customerInfo.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              className={`h-11 ${errors.lastName ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={customerInfo.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`h-11 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
          <p className="text-xs text-gray-500">
            We'll send order updates to this email
          </p>
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number *
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter phone number"
            value={customerInfo.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            className={`h-11 ${errors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.phone && (
            <p className="text-xs text-red-600">{errors.phone}</p>
          )}
          <p className="text-xs text-gray-500">
            Required for delivery coordination
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Shipping Address Form Component
function ShippingAddressForm({
  shippingAddress,
  errors,
  onChange,
  onValidate
}: {
  shippingAddress: MockShippingAddress
  errors: FormErrors
  onChange: (field: keyof MockShippingAddress, value: string) => void
  onValidate: () => FormErrors
}) {
  const [addressSuggestions, setAddressSuggestions] = useState<MockAddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAddressInputFocused, setIsAddressInputFocused] = useState(false)

  // Mock address suggestions - in real app, this would be an API call
  const mockAddressSuggestions: MockAddressSuggestion[] = [
    {
      id: '1',
      fullAddress: '123 Main Street, New York, NY 10001',
      streetAddress: '123 Main Street',
      city: 'New York',
      state: 'New York',
      zipCode: '10001',
      country: 'US'
    },
    {
      id: '2',
      fullAddress: '456 Oak Avenue, Los Angeles, CA 90210',
      streetAddress: '456 Oak Avenue',
      city: 'Los Angeles',
      state: 'California',
      zipCode: '90210',
      country: 'US'
    },
    {
      id: '3',
      fullAddress: '789 Pine Road, Chicago, IL 60601',
      streetAddress: '789 Pine Road',
      city: 'Chicago',
      state: 'Illinois',
      zipCode: '60601',
      country: 'US'
    },
    {
      id: '4',
      fullAddress: '321 Elm Street, Houston, TX 77001',
      streetAddress: '321 Elm Street',
      city: 'Houston',
      state: 'Texas',
      zipCode: '77001',
      country: 'US'
    },
    {
      id: '5',
      fullAddress: '654 Maple Drive, Phoenix, AZ 85001',
      streetAddress: '654 Maple Drive',
      city: 'Phoenix',
      state: 'Arizona',
      zipCode: '85001',
      country: 'US'
    }
  ]

  const handleBlur = (field: keyof MockShippingAddress) => {
    onValidate()
  }

  const handleAddressSearch = (searchTerm: string) => {
    onChange('addressLine1', searchTerm)
    
    if (searchTerm.length >= 3) {
      // Filter suggestions based on search term
      const filtered = mockAddressSuggestions.filter(suggestion =>
        suggestion.fullAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.streetAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setAddressSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (suggestion: MockAddressSuggestion) => {
    onChange('addressLine1', suggestion.streetAddress)
    onChange('city', suggestion.city)
    onChange('state', suggestion.state)
    onChange('zipCode', suggestion.zipCode)
    onChange('country', suggestion.country)
    
    setShowSuggestions(false)
    setAddressSuggestions([])
    setIsAddressInputFocused(false)
  }

  // Mock states/provinces data
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5" />
          Shipping Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Street Address with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="addressLine1" className="text-sm font-medium">
            Street Address *
          </Label>
          <Popover open={showSuggestions && addressSuggestions.length > 0} onOpenChange={setShowSuggestions}>
            <PopoverTrigger asChild>
              <Input
                id="addressLine1"
                type="text"
                placeholder="Start typing your address..."
                value={shippingAddress.addressLine1}
                onChange={(e) => handleAddressSearch(e.target.value)}
                onBlur={() => {
                  // Delay hiding suggestions to allow for selection
                  setTimeout(() => {
                    setShowSuggestions(false)
                    handleBlur('addressLine1')
                  }, 200)
                }}
                onFocus={() => {
                  setIsAddressInputFocused(true)
                  if (shippingAddress.addressLine1.length >= 3) {
                    handleAddressSearch(shippingAddress.addressLine1)
                  }
                }}
                className={`h-12 ${errors.addressLine1 ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No addresses found.</CommandEmpty>
                  <CommandGroup heading="Suggested Addresses">
                    {addressSuggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        onSelect={() => handleSelectSuggestion(suggestion)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{suggestion.streetAddress}</span>
                          <span className="text-xs text-gray-500">
                            {suggestion.city}, {suggestion.state} {suggestion.zipCode}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.addressLine1 && (
            <p className="text-xs text-red-600">{errors.addressLine1}</p>
          )}
          <p className="text-xs text-gray-500">
            💡 Start typing for address suggestions
          </p>
        </div>

        {/* Apartment/Suite (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="addressLine2" className="text-sm font-medium flex items-center gap-2">
            <Building className="w-4 h-4" />
            Apartment, suite, etc. (Optional)
          </Label>
          <Input
            id="addressLine2"
            type="text"
            placeholder="Apartment, suite, unit, building, floor, etc."
            value={shippingAddress.addressLine2 || ''}
            onChange={(e) => onChange('addressLine2', e.target.value)}
            className="h-12"
          />
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">
            City *
          </Label>
          <Input
            id="city"
            type="text"
            placeholder="Enter city"
            value={shippingAddress.city}
            onChange={(e) => onChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            className={`h-12 ${errors.city ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors.city && (
            <p className="text-xs text-red-600">{errors.city}</p>
          )}
        </div>

        {/* State and Zip Code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">
              State *
            </Label>
            <Select
              value={shippingAddress.state}
              onValueChange={(value) => onChange('state', value)}
            >
              <SelectTrigger className={`h-12 ${errors.state ? 'border-red-500 focus:border-red-500' : ''}`}>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-xs text-red-600">{errors.state}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode" className="text-sm font-medium">
              ZIP Code *
            </Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="12345"
              value={shippingAddress.zipCode}
              onChange={(e) => onChange('zipCode', e.target.value)}
              onBlur={() => handleBlur('zipCode')}
              className={`h-12 ${errors.zipCode ? 'border-red-500 focus:border-red-500' : ''}`}
              maxLength={10}
            />
            {errors.zipCode && (
              <p className="text-xs text-red-600">{errors.zipCode}</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country" className="text-sm font-medium">
            Country *
          </Label>
          <Select
            value={shippingAddress.country}
            onValueChange={(value) => onChange('country', value)}
          >
            <SelectTrigger className={`h-12 ${errors.country ? 'border-red-500 focus:border-red-500' : ''}`}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="MX">Mexico</SelectItem>
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="text-xs text-red-600">{errors.country}</p>
          )}
        </div>

        {/* Delivery Instructions */}
        <div className="space-y-2">
          <Label htmlFor="deliveryInstructions" className="text-sm font-medium">
            Delivery Instructions (Optional)
          </Label>
          <Textarea
            id="deliveryInstructions"
            placeholder="Any special delivery instructions..."
            className="min-h-[80px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-gray-500">
            Help us deliver your order (gate code, building entrance, etc.)
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Shipping Options Form Component
function ShippingOptionsForm({
  selectedOption,
  onChange
}: {
  selectedOption: string
  onChange: (optionId: string) => void
}) {
  const shippingOptions: MockShippingOption[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: 'Regular delivery service',
      price: 9.99,
      estimatedDays: '5-7 business days',
      icon: 'truck'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: 'Faster delivery with tracking',
      price: 19.99,
      estimatedDays: '2-3 business days',
      icon: 'clock'
    },
    {
      id: 'overnight',
      name: 'Overnight Delivery',
      description: 'Next business day delivery',
      price: 29.99,
      estimatedDays: '1 business day',
      icon: 'zap'
    }
  ]

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'truck':
        return <Truck className="w-5 h-5" />
      case 'clock':
        return <Clock className="w-5 h-5" />
      case 'zap':
        return <Zap className="w-5 h-5" />
      default:
        return <Truck className="w-5 h-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5" />
          Shipping Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedOption}
          onValueChange={onChange}
          className="space-y-3"
        >
          {shippingOptions.map((option) => (
            <div key={option.id}>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={option.id} id={option.id} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getIcon(option.icon)}
                        <Label 
                          htmlFor={option.id} 
                          className="font-medium text-sm cursor-pointer"
                        >
                          {option.name}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {option.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Arrives in {option.estimatedDays}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-sm">
                        ${option.price.toFixed(2)}
                      </div>
                      {option.id === 'standard' && (
                        <div className="text-xs text-green-600">Most popular</div>
                      )}
                      {option.id === 'overnight' && (
                        <div className="text-xs text-blue-600">Fastest</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>

        {/* Shipping Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            📦 All orders include free tracking and insurance
          </p>
        </div>

        {/* COD Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            💰 Cash on Delivery: Payment due upon delivery
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Summary Component
function OrderSummary({ 
  cartItems, 
  cartSummary 
}: { 
  cartItems: MockCartItem[]
  cartSummary: MockCartSummary 
}) {
  return (
    <Card className="sticky top-4 lg:top-6">
      <CardHeader>
        <CardTitle className="text-lg lg:text-xl">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3">
          {cartItems.map((item: MockCartItem) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={item.productImage}
                alt={item.productName}
                className="w-12 h-12 object-cover rounded border"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium line-clamp-2 leading-tight">
                  {item.productName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Qty: {item.quantity}</span>
                  <span>•</span>
                  <span>${item.price.toFixed(2)} each</span>
                </div>
              </div>
              <div className="text-sm font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${cartSummary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${cartSummary.shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${cartSummary.tax.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">${cartSummary.total.toFixed(2)}</span>
          </div>
        </div>

        {/* COD Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💰 Cash on Delivery - Pay when your order arrives
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Review Component
function OrderReview({
  customerInfo,
  shippingAddress,
  selectedShippingOption,
  cartItems,
  cartSummary,
  onEdit
}: {
  customerInfo: MockCustomerInfo
  shippingAddress: MockShippingAddress
  selectedShippingOption: string
  cartItems: MockCartItem[]
  cartSummary: MockCartSummary
  onEdit: (step: number) => void
}) {
  const shippingOptions: MockShippingOption[] = [
    {
      id: 'standard',
      name: 'Standard Shipping',
      description: 'Regular delivery service',
      price: 9.99,
      estimatedDays: '5-7 business days',
      icon: 'truck'
    },
    {
      id: 'express',
      name: 'Express Shipping',
      description: 'Faster delivery with tracking',
      price: 19.99,
      estimatedDays: '2-3 business days',
      icon: 'clock'
    },
    {
      id: 'overnight',
      name: 'Overnight Delivery',
      description: 'Next business day delivery',
      price: 29.99,
      estimatedDays: '1 business day',
      icon: 'zap'
    }
  ]

  const selectedShipping = shippingOptions.find(option => option.id === selectedShippingOption)

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item: MockCartItem) => (
            <div key={item.id} className="flex gap-4">
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
                      <span key={index} className="text-xs text-gray-600">
                        {variant.value}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
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
          ))}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Contact Information
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(1)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">{customerInfo.firstName} {customerInfo.lastName}</span>
          </div>
          <div className="text-sm text-gray-600">
            {customerInfo.email}
          </div>
          <div className="text-sm text-gray-600">
            {customerInfo.phone}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div>{shippingAddress.addressLine1}</div>
            {shippingAddress.addressLine2 && (
              <div>{shippingAddress.addressLine2}</div>
            )}
            <div>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </div>
            <div>{shippingAddress.country}</div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Method */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Shipping Method
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedShipping && (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{selectedShipping.name}</div>
                <div className="text-xs text-gray-600">
                  Arrives in {selectedShipping.estimatedDays}
                </div>
              </div>
              <div className="font-semibold text-sm">
                ${selectedShipping.price.toFixed(2)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// COD Terms Component
function CODTerms({
  accepted,
  onAcceptChange
}: {
  accepted: boolean
  onAcceptChange: (accepted: boolean) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5" />
          Cash on Delivery Terms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Payment on Delivery</h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Payment is due in cash when your order arrives</li>
                <li>• Please have the exact amount ready for delivery</li>
                <li>• Orders will be inspected before payment</li>
                <li>• Damaged items can be refused without payment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📦</div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Delivery Policy</h4>
              <ul className="text-xs text-gray-700 space-y-1">
                <li>• Free tracking included with all orders</li>
                <li>• Delivery attempts made during business hours</li>
                <li>• Re-delivery fees may apply for failed attempts</li>
                <li>• Orders must be collected within 5 business days</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="cod-terms"
            checked={accepted}
            onCheckedChange={onAcceptChange}
            className="mt-1"
          />
          <Label htmlFor="cod-terms" className="text-sm leading-relaxed cursor-pointer">
            I understand and agree to the Cash on Delivery terms and conditions. 
            I confirm that someone will be available to receive the order and make payment upon delivery.
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const { cartItems, cartSummary } = Route.useLoaderData()
  const [currentStep, setCurrentStep] = useState(1)
  const [customerInfo, setCustomerInfo] = useState<MockCustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })
  const [shippingAddress, setShippingAddress] = useState<MockShippingAddress>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [selectedShippingOption, setSelectedShippingOption] = useState('standard')
  const [errors, setErrors] = useState<FormErrors>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (currentStep === 1) {
      if (!customerInfo.firstName.trim()) {
        newErrors.firstName = 'First name is required'
      }

      if (!customerInfo.lastName.trim()) {
        newErrors.lastName = 'Last name is required'
      }

      if (!customerInfo.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
        newErrors.email = 'Please enter a valid email address'
      }

      if (!customerInfo.phone.trim()) {
        newErrors.phone = 'Phone number is required'
      } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    if (currentStep === 2) {
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
      } else if (!/^\d{5}(-\d{4})?$/.test(shippingAddress.zipCode)) {
        newErrors.zipCode = 'Please enter a valid ZIP code'
      }

      if (!shippingAddress.country.trim()) {
        newErrors.country = 'Country is required'
      }
    }

    setErrors(newErrors)
    return newErrors
  }

  const handleCustomerFieldChange = (field: keyof MockCustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleShippingFieldChange = (field: keyof MockShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleContinue = () => {
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length === 0) {
      if (currentStep === 1) {
        setCurrentStep(2)
      } else if (currentStep === 2) {
        setCurrentStep(3)
      } else if (currentStep === 3) {
        console.log('Moving to step 4:', { customerInfo, shippingAddress, selectedShippingOption })
        setCurrentStep(4)
      }
    }
  }

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      // Navigate back to cart
      window.location.href = '/cart'
    }
  }

  const handleEditStep = (step: number) => {
    setCurrentStep(step)
  }

  const handlePlaceOrder = () => {
    if (termsAccepted) {
      console.log('Placing order:', {
        customerInfo,
        shippingAddress,
        selectedShippingOption,
        cartItems,
        cartSummary,
        termsAccepted
      })
      // TODO: Navigate to order confirmation
      window.location.href = '/order-confirmation/mock-order-123'
    }
  }

  const isCurrentStepValid = () => {
    if (currentStep === 1) {
      return customerInfo.firstName.trim() && 
             customerInfo.lastName.trim() && 
             customerInfo.email.trim() && 
             customerInfo.phone.trim() &&
             !errors.firstName && !errors.lastName && !errors.email && !errors.phone
    } else if (currentStep === 2) {
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Stepper */}
        <CheckoutStepper currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {currentStep === 1 && (
              <CustomerInfoForm
                customerInfo={customerInfo}
                errors={errors}
                onChange={handleCustomerFieldChange}
                onValidate={validateForm}
              />
            )}

            {currentStep === 2 && (
              <ShippingAddressForm
                shippingAddress={shippingAddress}
                errors={errors}
                onChange={handleShippingFieldChange}
                onValidate={validateForm}
              />
            )}

            {currentStep === 3 && (
              <ShippingOptionsForm
                selectedOption={selectedShippingOption}
                onChange={setSelectedShippingOption}
              />
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <OrderReview
                  customerInfo={customerInfo}
                  shippingAddress={shippingAddress}
                  selectedShippingOption={selectedShippingOption}
                  cartItems={cartItems}
                  cartSummary={cartSummary}
                  onEdit={handleEditStep}
                />
                <CODTerms
                  accepted={termsAccepted}
                  onAcceptChange={setTermsAccepted}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Back to Cart' : 'Back'}
              </Button>
              
              <Button 
                onClick={currentStep === 4 ? handlePlaceOrder : handleContinue}
                disabled={!isCurrentStepValid()}
                className={`min-w-[120px] ${currentStep === 4 ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                {currentStep === 4 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Place Order
                  </>
                ) : (
                  <>
                    {currentStep === 3 ? 'Review Order' : 'Continue'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <OrderSummary cartItems={cartItems} cartSummary={cartSummary} />
          </div>
        </div>
      </div>
    </div>
  )
}
