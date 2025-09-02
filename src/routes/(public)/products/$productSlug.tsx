import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import type { ProductsResponse, CategoriesResponse, StoresResponse,OrdersRecord, OrderItemsRecord, CustomersRecord } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CreditCard,CheckCircle } from 'lucide-react'
import { ImageGallery } from '@/components/prodcutsComponents/ImageGallery'
import { ProductInfo } from '@/components/prodcutsComponents/ProductInfo'
import { RelatedProducts } from '@/components/prodcutsComponents/RelatedProducts'
import { StickyAddToCartBar } from '@/components/prodcutsComponents/StickyAddToCartBar'

// Route configuration
export const Route = createFileRoute('/(public)/products/$productSlug')({
  loader: async ({ params }) => {
    try {
      // Fetch store settings to check cart configuration
      const [storeSettings, product] = await Promise.all([
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `store-settings-${Date.now()}`
        }).catch(() => null),
        // Try to fetch product by SKU first, then by ID as fallback
        pb.collection(Collections.Products).getFirstListItem<ProductsResponse<{
          categories: CategoriesResponse[]
        }>>(
          `sku = "${params.productSlug}" || id = "${params.productSlug}"`,
          {
            expand: 'categories',
            requestKey: `product-${params.productSlug}-${Date.now()}`
          }
        )
      ])

      // Parse checkout settings
      const checkoutSettings = storeSettings?.checkoutSettings ? 
        (typeof storeSettings.checkoutSettings === 'string' ? 
          JSON.parse(storeSettings.checkoutSettings) : 
          storeSettings.checkoutSettings) : {}

      // Fetch related products from the same categories
      const relatedProducts = await pb.collection(Collections.Products).getList<ProductsResponse<{
        categories: CategoriesResponse[]
      }>>(1, 4, {
        filter: `id != "${product.id}" && isActive = true && (${product.categories.map(catId => `categories ~ "${catId}"`).join(' || ')})`,
        expand: 'categories',
        sort: '-created',
        requestKey: `related-products-${product.id}-${Date.now()}`
      }).catch(() => ({ items: [] }))

      // Build breadcrumbs
      const categoryNames = product.expand?.categories?.map(cat => cat.name) || []
      const primaryCategory = categoryNames[0] || 'Products'
      
      const breadcrumbs = [
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
        ...(categoryNames.length > 0 ? [{ 
          label: primaryCategory, 
          href: `/products?categories=${product.categories[0]}` 
        }] : []),
        { label: product.title }
      ]

      return {
        product,
        relatedProducts: relatedProducts.items || [],
        breadcrumbs,
        cartSettings: {
          cartEnabled: storeSettings?.is_cart_enabled ?? false,
          checkoutEnabled: checkoutSettings.checkoutEnabled ?? true
        },
        checkoutSettings
      }
    } catch (error) {
      console.error('Failed to load product:', error)
      throw new Response('Product not found', { status: 404 })
    }
  },
  component: RouteComponent,
})


// Breadcrumbs Component
function Breadcrumbs({ 
  items 
}: { 
  items: { label: string; href?: string }[] 
}) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6 overflow-x-auto scrollbar-hide">
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1 flex-shrink-0">
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-gray-700 transition-colors duration-200"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
        </div>
      ))}
    </nav>
  )
}

// Checkout Form Component
function CheckoutForm({ 
  product, 
  quantity, 
  totalPrice,
  checkoutSettings 
}: {
  product: ProductsResponse
  quantity: number
  totalPrice: number
  checkoutSettings: any
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [orderCreated, setOrderCreated] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  
  const shippingCost = 25 // Fixed shipping cost
  const finalTotal = totalPrice + shippingCost

  // Get all fields from checkout settings
  const allFields = checkoutSettings?.fields?.configurableFields || [
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'your@email.com' },
    { name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: false, placeholder: '+212 600 000 000' },
    { name: 'address', label: 'Address', type: 'textarea', required: true, placeholder: 'Street address, apartment, suite, etc.' },
    { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'Casablanca' },
    { name: 'country', label: 'Country', type: 'text', required: false, placeholder: 'Morocco' }
  ]

  // Add custom fields to the list
  const fieldsToRender = [
    ...allFields.filter((field: any) => field.enabled !== false),
  ]

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSubmitOrder = async () => {
    setIsLoading(true)
    
    try {
      // Create customer record first
      const customerData: Partial<CustomersRecord> = {
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone ? parseInt(formData.phone) : undefined,
        status: 'active' as any,
        totalOrders: 1,
        totalSpent: finalTotal
      }

      let customer
      try {
        // Try to find existing customer by email
        customer = await pb.collection(Collections.Customers).getFirstListItem(
          `email = "${formData.email}"`
        )
        // Update existing customer
        await pb.collection(Collections.Customers).update(customer.id, {
          totalOrders: (customer.totalOrders || 0) + 1,
          totalSpent: (customer.totalSpent || 0) + finalTotal
        })
      } catch {
        // Create new customer if not found
        customer = await pb.collection(Collections.Customers).create(customerData)
      }

      // Create order record
      const orderData: Partial<OrdersRecord> = {
        orderNumber: `ORD-${Date.now()}`,
        customerInfo: {
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state || '',
          postalCode: formData.postalCode || '',
          country: formData.country || 'Morocco'
        },
        subtotal: totalPrice,
        shipping: shippingCost,
        total: finalTotal,
        status: 'pending' as any,
        paymentStatus: 'pending' as any,
        fulfillmentStatus: 'pending' as any,
        notes: formData.notes || undefined,
        estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const order = await pb.collection(Collections.Orders).create(orderData)

      // Create order item record
      const orderItemData: Partial<OrderItemsRecord> = {
        products: [product.id],
        quantity: quantity,
        price: totalPrice,
        selectedVariants: null
      }

      await pb.collection(Collections.OrderItems).create(orderItemData)

      // Update product stock if applicable
      if (product.stockQuantity !== undefined && product.stockQuantity > 0) {
        await pb.collection(Collections.Products).update(product.id, {
          stockQuantity: Math.max(0, product.stockQuantity - quantity)
        })
      }

      setOrderCreated(order.orderNumber || order.id)
      
      console.log('Order created successfully:', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: finalTotal
      })
      
    } catch (error) {
      console.error('Failed to create order:', error)
      // Show error message to user
      alert('Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Check if required fields are filled
  const isFormValid = () => {
    const requiredFields = fieldsToRender
      .filter(field => field.required)
      .map(field => field.name || field.id || `field_${fieldsToRender.indexOf(field)}`)
    
    console.log('Required fields:', requiredFields)
    console.log('Form data:', formData)
    
    const isValid = requiredFields.every(fieldName => {
      const value = formData[fieldName]?.trim()
      console.log(`Field ${fieldName}: "${value}" - ${value ? 'filled' : 'empty'}`)
      return value
    })
    
    console.log('Form is valid:', isValid)
    return isValid
  }

  // Render field based on type
  const renderField = (field: any, index: number) => {
    const fieldName = field.name || field.id || `field_${index}`
    const fieldValue = formData[fieldName] || field.defaultValue || ''
    const fieldId = `field_${fieldName}_${index}`
    
    // Update the field name in the fieldsToRender array to ensure consistency
    field.name = fieldName
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            name={fieldName}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={field.rows || 3}
          />
        )
      case 'select':
        return (
          <select
            id={fieldId}
            name={fieldName}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            required={field.required}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{field.placeholder || `Select ${field.label}`}</option>
            {field.options?.map((option: any, optIndex: number) => (
              <option key={optIndex} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        )
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={fieldId}
              name={fieldName}
              checked={formData[fieldName] === 'true'}
              onChange={(e) => handleInputChange(fieldName, e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
            />
            <Label htmlFor={fieldId} className="text-sm">
              {field.checkboxLabel || field.label}
            </Label>
          </div>
        )
      default:
        return (
          <Input
            id={fieldId}
            name={fieldName}
            type={field.type || 'text'}
            value={fieldValue}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )
    }
  }

  if (orderCreated) {
    return (
      <Card className="mt-8">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            {checkoutSettings?.messages?.thankYouMessage || 'Order Placed Successfully!'}
          </h3>
          <p className="text-gray-600 mb-4">
            {checkoutSettings?.messages?.processingMessage || "Thank you for your order. We'll send you a confirmation email shortly."}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-lg font-semibold">Order #{orderCreated}</div>
            <div className="text-2xl font-bold text-primary">${finalTotal.toFixed(2)}</div>
            <div className="text-sm text-gray-600">
              Estimated delivery: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </div>
          </div>

          <Button onClick={() => window.location.href = '/'} className="w-full">
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          {checkoutSettings?.appearance?.title || 'Quick Order'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Order Information</h3>
          
          <div className="grid gap-4">
            {/* Dynamically render all fields */}
            {fieldsToRender.map((field, index) => {
              const fieldName = field.name || field.id || `field_${index}`
              const uniqueKey = `${fieldName}_${index}`
              const fieldId = `field_${fieldName}_${index}`
              return (
                <div key={uniqueKey} className={field.width === 'half' ? 'md:col-span-1' : 'md:col-span-2'}>
                  {field.type !== 'checkbox' && (
                    <Label htmlFor={fieldId}>
                      {field.label} {field.required && '*'}
                    </Label>
                  )}
                  {renderField(field, index)}
                  {field.helpText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Order Summary</h4>
            
            <div className="flex gap-4 mb-4">
              <img
                src={product.featured_image ? 
                  pb.files.getUrl(product, product.featured_image, { thumb: '150x150' }) : 
                  (product.images && product.images.length > 0 ? 
                    pb.files.getUrl(product, product.images[0], { thumb: '150x150' }) : 
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop'
                  )
                }
                alt={product.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium">{product.title}</h4>
                <div className="text-sm text-gray-600 mt-1">
                  <div>Quantity: {quantity}</div>
                </div>
                <div className="font-semibold mt-2">${totalPrice.toFixed(2)}</div>
              </div>
            </div>

            <Separator className="my-3" />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
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
          </div>

          <Button 
            onClick={handleSubmitOrder} 
            className="w-full"
            disabled={isLoading || !isFormValid()}
            style={{
              backgroundColor: checkoutSettings?.appearance?.primaryColor || undefined
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              checkoutSettings?.appearance?.submitButtonText || `Place Order - $${finalTotal.toFixed(2)}`
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RouteComponent() {
  const { product, relatedProducts, breadcrumbs, cartSettings, checkoutSettings } = Route.useLoaderData()
  const [quantity, setQuantity] = useState(1)
  const [showStickyBar, setShowStickyBar] = useState(false)

  const getCurrentPrice = () => {
    return product.price
  }

  const getStockStatus = () => {
    return { 
      inStock: product.isActive && (product.stockQuantity || 0) > 0, 
      quantity: product.stockQuantity || 0 
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity)
  }

  const currentPrice = getCurrentPrice()
  const totalPrice = currentPrice * quantity
  const stockStatus = getStockStatus()

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const shouldShow = scrollPosition > 400
      setShowStickyBar(shouldShow)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-12">
        <Breadcrumbs items={breadcrumbs} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="order-1">
            <ImageGallery product={product} />
          </div>
          
          <div className="order-2">
            <ProductInfo
              product={product}
              quantity={quantity}
              cartSettings={cartSettings}
              onQuantityChange={handleQuantityChange}
            />
          </div>
        </div>

        {/* Show checkout form if cart is disabled */}
        {!cartSettings.cartEnabled && (
          <CheckoutForm 
            product={product}
            quantity={quantity}
            totalPrice={totalPrice}
            checkoutSettings={checkoutSettings}
          />
        )}
        
        <div className="mt-12 lg:mt-20">
          <RelatedProducts products={relatedProducts} />
        </div>
      </div>

      <StickyAddToCartBar
        product={product}
        quantity={quantity}
        stockStatus={stockStatus}
        totalPrice={totalPrice}
        cartSettings={cartSettings}
        onQuantityChange={handleQuantityChange}
        isVisible={showStickyBar}
      />
    </div>
  )
}