import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Edit } from 'lucide-react'
import { type CartesResponse, type ProductsResponse, type StoresResponse } from '@/lib/types'
import { formatPrice } from '@/lib/cart-utils'

interface OrderReviewProps {
  customerInfo: any
  shippingAddress: any
  selectedShippingOption: string
  cartItems: CartesResponse<{ productId: ProductsResponse[] }>[]
  cartSummary: any
  onEdit: (step: number) => void
  storeSettings: StoresResponse | null
  hasShippingZones?: boolean
  enableShippingStep?: boolean
  enableShippingOptions?: boolean
}

export function OrderReview({
  customerInfo,
  shippingAddress,
  selectedShippingOption,
  cartItems,
  cartSummary,
  onEdit,
  storeSettings,
  hasShippingZones = false,
  enableShippingStep = true,
  enableShippingOptions = true
}: OrderReviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review Your Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="text-sm font-medium">Customer Information</h3>
          <div className="mt-2 text-sm text-gray-600">
            <p>{customerInfo.fullName}</p>
            <p>{customerInfo.email}</p>
            <p>{customerInfo.phoneNumber}</p>
          </div>
        </div>

        <Separator />

        {/* Shipping Address */}
        <div>
          <h3 className="text-sm font-medium">Shipping Address</h3>
          <div className="mt-2 text-sm text-gray-600">
            <p>{shippingAddress.addressLine1}</p>
            {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
            <p>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </p>
            <p>{shippingAddress.country}</p>
          </div>
        </div>

        <Separator />

        {/* Shipping Method */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Shipping Method</h3>
            {hasShippingZones && enableShippingOptions && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {hasShippingZones ? (
              enableShippingOptions ? (
                <>
                  <p>Selected shipping method - {formatPrice(cartSummary.shipping, storeSettings?.currency)}</p>
                  <p>Estimated delivery: Will be confirmed after order</p>
                </>
              ) : (
                <>
                  <p>Automatic shipping method - {formatPrice(cartSummary.shipping, storeSettings?.currency)}</p>
                  <p>Estimated delivery: Will be confirmed after order</p>
                </>
              )
            ) : (
              <>
                <p>Cash on Delivery - Delivery arrangements will be made after order confirmation</p>
                <p>Shipping cost: To be determined based on delivery location</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
