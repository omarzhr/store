import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MapPin, Building } from 'lucide-react'
import { useState } from 'react'

// Shipping address interface
interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
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

// Address suggestion interface
interface AddressSuggestion {
  id: string;
  fullAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface ShippingAddressFormProps {
  shippingAddress: ShippingAddress
  errors: FormErrors
  onChange: (field: keyof ShippingAddress, value: string) => void
  onValidate: () => FormErrors
}

export function ShippingAddressForm({
  shippingAddress,
  errors,
  onChange,
  onValidate
}: ShippingAddressFormProps) {
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [_isAddressInputFocused, setIsAddressInputFocused] = useState(false)

  // Address suggestions would come from a geocoding API like Google Places, Mapbox, etc.
  const fetchAddressSuggestions = async (searchTerm: string): Promise<AddressSuggestion[]> => {
    try {
      // In a real app, this would call a geocoding API
      // For now, return empty array - can be implemented with external APIs
      console.log('Address search term:', searchTerm)
      return []
    } catch (error) {
      console.error('Address suggestion error:', error)
      return []
    }
  }

  const handleBlur = (_field: keyof ShippingAddress) => {
    onValidate()
  }

  const handleAddressSearch = async (searchTerm: string) => {
    if (searchTerm.length >= 3) {
      // Fetch suggestions from geocoding API
      const suggestions = await fetchAddressSuggestions(searchTerm)
      setAddressSuggestions(suggestions)
      setShowSuggestions(suggestions.length > 0)
    } else {
      setAddressSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
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
      </CardContent>
    </Card>
  )
}
