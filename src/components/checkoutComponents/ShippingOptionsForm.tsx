import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Truck, Clock, Zap } from 'lucide-react'
import { type StoresResponse, type CheckoutSettings } from '@/lib/types/index'

// Shipping option interface
interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  icon: 'truck' | 'clock' | 'zap';
}

interface ShippingOptionsFormProps {
  selectedOption: string
  onChange: (optionId: string) => void
  storeSettings: StoresResponse | null
}

export function ShippingOptionsForm({
  selectedOption,
  onChange,
  storeSettings
}: ShippingOptionsFormProps) {
  // Get currency and shipping zones from store settings
  const currency = storeSettings?.currency || 'MAD'
  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      'MAD': 'DH',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹'
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

  // Use shipping zones from store settings - no fallback to default options
  const shippingZones = storeSettings?.shippingZones || []
  const checkoutSettings: CheckoutSettings | undefined = storeSettings?.checkoutSettings as CheckoutSettings | undefined

  let shippingOptions: ShippingOption[] = []

  // Only use shipping zones if they exist and are configured
  if (shippingZones && Array.isArray(shippingZones) && shippingZones.length > 0) {
    // Convert shipping zones to shipping options
    shippingOptions = shippingZones
      .filter((zone: any) => zone.isActive)
      .map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        description: zone.description || `Delivery to ${zone.areas?.[0] || 'selected areas'}`,
        price: zone.shippingCost,
        estimatedDays: `${zone.estimatedDays} business days`,
        icon: 'truck' as const
      }))
  }

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

  // If no shipping zones are configured, show setup message
  if (shippingOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 text-lg"
            style={{ color: checkoutSettings?.appearance?.primaryColor }}
          >
            <Truck className="w-5 h-5" />
            Shipping Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No shipping zones configured
            </h3>
            <p className="text-gray-600 mb-4">
              Please contact the store to arrange delivery options.
            </p>
            <div 
              className="border rounded-lg p-3"
              style={{ 
                backgroundColor: `${checkoutSettings?.appearance?.primaryColor}10`,
                borderColor: `${checkoutSettings?.appearance?.primaryColor}30`
              }}
            >
              <p 
                className="text-sm font-medium"
                style={{ color: checkoutSettings?.appearance?.primaryColor }}
              >
                💰 Cash on Delivery: Payment due upon delivery in {currency}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Delivery arrangements will be made after order confirmation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle 
          className="flex items-center gap-2 text-lg"
          style={{ color: checkoutSettings?.appearance?.primaryColor }}
        >
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
                <RadioGroupItem 
                  value={option.id} 
                  id={option.id}
                  style={{ '--tw-ring-color': checkoutSettings?.appearance?.primaryColor } as any}
                />
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
                        {formatPrice(option.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* COD Notice with custom styling */}
          <div 
            className="border rounded-lg p-3"
            style={{ 
              backgroundColor: `${checkoutSettings?.appearance?.primaryColor}10`,
              borderColor: `${checkoutSettings?.appearance?.primaryColor}30`
            }}
          >
            <p 
              className="text-xs font-medium"
              style={{ color: checkoutSettings?.appearance?.primaryColor }}
            >
              💰 Cash on Delivery: Payment due upon delivery in {currency}
            </p>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

