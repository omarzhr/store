import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Phone, MapPin, Building } from 'lucide-react'
import { type StoresResponse, type CheckoutSettings } from '@/lib/types/index'

interface CustomerInfoFormProps {
  customerInfo: any
  errors: any
  onChange: (field: string, value: string) => void
  onValidate: () => any
  storeSettings: StoresResponse | null
}

export function CustomerInfoForm({
  customerInfo,
  errors,
  onChange,
  onValidate,
  storeSettings
}: CustomerInfoFormProps) {
  // Get checkout customization settings with configurable fields
  const checkoutSettings: CheckoutSettings = storeSettings?.checkoutSettings || {
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
    features: { guestCheckoutEnabled: true, showOrderSummary: true, enableCouponCodes: false },
    messages: { thankYouMessage: '', processingMessage: '' }
  }

  const handleBlur = () => {
    onValidate()
  }

  // Get enabled fields sorted by order
  const enabledFields = (checkoutSettings.fields?.configurableFields || [])
    .filter((field: any) => field.enabled)
    .sort((a: any, b: any) => a.order - b.order)

  const renderField = (field: any) => {
    const fieldId = field.id
    const fieldLabel = field.label
    const isRequired = field.required
    const fieldValue = customerInfo[fieldId] || ''

    // Handle email field
    if (fieldId === 'email') {
      return (
        <div key={fieldId} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="email"
            placeholder="Enter email address"
            value={fieldValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onBlur={handleBlur}
            className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors[fieldId] && (
            <p className="text-xs text-red-600">{errors[fieldId]}</p>
          )}
          <p className="text-xs text-gray-500">
            We'll send order updates to this email
          </p>
        </div>
      )
    }

    if (fieldId === 'fullName') {
      return (
        <div key={fieldId} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="text"
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onBlur={handleBlur}
            className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
            style={{ 
              borderColor: errors[fieldId] ? undefined : `${checkoutSettings.appearance?.primaryColor}20`,
              '--tw-ring-color': checkoutSettings.appearance?.primaryColor 
            } as any}
          />
          {errors[fieldId] && (
            <p className="text-xs text-red-600">{errors[fieldId]}</p>
          )}
        </div>
      )
    }

    if (fieldId === 'phoneNumber') {
      return (
        <div key={fieldId} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="tel"
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onBlur={handleBlur}
            className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors[fieldId] && (
            <p className="text-xs text-red-600">{errors[fieldId]}</p>
          )}
          <p className="text-xs text-gray-500">
            {isRequired ? 'Required for delivery coordination' : 'Optional - for delivery updates'}
          </p>
        </div>
      )
    }

    if (fieldId === 'address') {
      return (
        <div key={fieldId} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="text"
            placeholder="Enter your address"
            value={fieldValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onBlur={handleBlur}
            className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors[fieldId] && (
            <p className="text-xs text-red-600">{errors[fieldId]}</p>
          )}
          <p className="text-xs text-gray-500">
            Required for delivery
          </p>
        </div>
      )
    }

    if (fieldId === 'city') {
      return (
        <div key={fieldId} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="text"
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onBlur={handleBlur}
            className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors[fieldId] && (
            <p className="text-xs text-red-600">{errors[fieldId]}</p>
          )}
        </div>
      )
    }

    if (fieldId === 'companyName') {
      return (
        <div key={fieldId} className="space-y-2">
          <Label htmlFor={fieldId} className="text-sm font-medium flex items-center gap-2">
            <Building className="w-4 h-4" />
            {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id={fieldId}
            type="text"
            placeholder={`Enter ${fieldLabel.toLowerCase()}`}
            value={fieldValue}
            onChange={(e) => onChange(fieldId, e.target.value)}
            onBlur={handleBlur}
            className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {errors[fieldId] && (
            <p className="text-xs text-red-600">{errors[fieldId]}</p>
          )}
        </div>
      )
    }

    // Handle custom fields
    return (
      <div key={fieldId} className="space-y-2">
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {fieldLabel} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={fieldId}
          type="text"
          placeholder={`Enter ${fieldLabel.toLowerCase()}`}
          value={fieldValue}
          onChange={(e) => onChange(fieldId, e.target.value)}
          onBlur={handleBlur}
          className={`h-11 ${errors[fieldId] ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        {errors[fieldId] && (
          <p className="text-xs text-red-600">{errors[fieldId]}</p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle 
          className="flex items-center gap-2 text-lg lg:text-xl"
          style={{ color: checkoutSettings.appearance?.primaryColor }}
        >
          <User className="w-5 h-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 lg:space-y-6">
        {/* Render configurable fields dynamically */}
        {enabledFields.map((field: any) => renderField(field))}
      </CardContent>
    </Card>
  )
}

