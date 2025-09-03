import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Plus, X, GripVertical, Palette, MessageSquare, CreditCard, AlertCircle } from 'lucide-react'
import type { StoresResponse, StoresRecord, CheckoutSettings } from '@/lib/types/index'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/settings/checkout')({
  loader: async () => {
    try {
      // Fetch store settings from database using proper types
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-checkout-settings-${Date.now()}`
      })
      
      return { storeSettings }
    } catch (error) {
      // If no store settings exist, return default values
      const defaultSettings: Partial<StoresResponse> = {
        storeName: '',
        storeDescription: '',
        currency: 'MAD',
        checkoutSettings: {
          fields: {
            phoneRequired: true,
            companyNameEnabled: false,
            customFields: []
          },
          appearance: {
            primaryColor: '#3b82f6',
            buttonText: 'Continue',
            submitButtonText: 'Place Order'
          },
          features: {
            guestCheckoutEnabled: true,
            showOrderSummary: true,
            enableCouponCodes: false
          },
          messages: {
            thankYouMessage: 'Thank you for your order! We will contact you shortly to confirm your purchase.',
            processingMessage: 'Your order is being processed. Please keep your phone available for confirmation.'
          }
        }
      }
      
      return { storeSettings: defaultSettings }
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { storeSettings } = Route.useLoaderData()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get currency info from store settings - default to MAD (Moroccan Dirham)
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

  // Enhanced checkout settings structure with configurable fields including email and address
  const defaultFieldsConfig = [
    { id: 'fullName', label: 'Full Name', required: true, enabled: true, order: 1 },
    { id: 'phoneNumber', label: 'Phone Number', required: true, enabled: true, order: 2 },
    { id: 'email', label: 'Email Address', required: true, enabled: true, order: 3 },
    { id: 'address', label: 'Address', required: true, enabled: true, order: 4 },
    { id: 'city', label: 'City', required: true, enabled: true, order: 5 },
    { id: 'companyName', label: 'Company Name', required: false, enabled: false, order: 6 }
  ]

  // Use existing checkoutSettings or defaults
  const checkoutSettings: CheckoutSettings = storeSettings.checkoutSettings || {
    fields: { 
      phoneRequired: true, 
      companyNameEnabled: false, 
      customFields: [],
      configurableFields: defaultFieldsConfig
    },
    appearance: { primaryColor: '#3b82f6', buttonText: 'Continue', submitButtonText: 'Place Order' },
    features: { 
      guestCheckoutEnabled: true, 
      showOrderSummary: true, 
      enableCouponCodes: false
    },
    messages: { thankYouMessage: '', processingMessage: '' }
  }

  // Enhanced form state for configurable fields
  const [configurableFields, setConfigurableFields] = useState(
    checkoutSettings.fields?.configurableFields || defaultFieldsConfig
  )
  const [customFields] = useState<string[]>(checkoutSettings.fields?.customFields ?? [])
  const [newCustomField, setNewCustomField] = useState('')

  // Appearance settings
  const [primaryColor, setPrimaryColor] = useState(checkoutSettings.appearance?.primaryColor ?? '#3b82f6')
  const [buttonText, setButtonText] = useState(checkoutSettings.appearance?.buttonText ?? 'Continue')
  const [submitButtonText, setSubmitButtonText] = useState(checkoutSettings.appearance?.submitButtonText ?? 'Place Order')

  // Features settings - Remove shipping step toggle
  const [guestCheckoutEnabled, setGuestCheckoutEnabled] = useState(checkoutSettings.features?.guestCheckoutEnabled ?? true)
  const [showOrderSummary, setShowOrderSummary] = useState(checkoutSettings.features?.showOrderSummary ?? true)
  const [enableCouponCodes, setEnableCouponCodes] = useState(checkoutSettings.features?.enableCouponCodes ?? false)

  // Messages settings
  const [thankYouMessage, setThankYouMessage] = useState(checkoutSettings.messages?.thankYouMessage ?? '')
  const [processingMessage, setProcessingMessage] = useState(checkoutSettings.messages?.processingMessage ?? '')

  // Field configuration handlers
  const updateFieldConfig = (fieldId: string, updates: Partial<typeof configurableFields[0]>) => {
    setConfigurableFields((fields: any) =>
      fields.map((field: any) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    )
  }

  const moveFieldUp = (fieldId: string) => {
    const currentIndex = configurableFields.findIndex((f: any) => f.id === fieldId)
    if (currentIndex > 0) {
      const newFields = [...configurableFields]
      const temp = newFields[currentIndex]
      newFields[currentIndex] = newFields[currentIndex - 1]
      newFields[currentIndex - 1] = temp
      
      // Update order values
      newFields.forEach((field, index) => {
        field.order = index + 1
      })
      
      setConfigurableFields(newFields)
    }
  }

  const moveFieldDown = (fieldId: string) => {
    const currentIndex = configurableFields.findIndex((f: any) => f.id === fieldId)
    if (currentIndex < configurableFields.length - 1) {
      const newFields = [...configurableFields]
      const temp = newFields[currentIndex]
      newFields[currentIndex] = newFields[currentIndex + 1]
      newFields[currentIndex + 1] = temp
      
      // Update order values
      newFields.forEach((field, index) => {
        field.order = index + 1
      })
      
      setConfigurableFields(newFields)
    }
  }

  const addNewConfigurableField = () => {
    if (newCustomField.trim()) {
      const newField = {
        id: `custom_${Date.now()}`,
        label: newCustomField.trim(),
        required: false,
        enabled: true,
        order: configurableFields.length + 1
      }
      setConfigurableFields([...configurableFields, newField])
      setNewCustomField('')
    }
  }

  const removeConfigurableField = (fieldId: string) => {
    // Don't allow removing core fields (but allow disabling them)
    const coreFields = ['fullName', 'phoneNumber', 'email', 'address', 'city']
    if (!coreFields.includes(fieldId)) {
      setConfigurableFields((fields: any) =>
        fields.filter((field: any) => field.id !== fieldId)
          .map((field: any, index: any) => ({ ...field, order: index + 1 }))
      )
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const updatedCheckoutSettings = {
        fields: {
          phoneRequired: configurableFields.find((f: any) => f.id === 'phoneNumber')?.required ?? true,
          companyNameEnabled: configurableFields.find((f: any) => f.id === 'companyName')?.enabled ?? false,
          emailEnabled: configurableFields.find((f: any) => f.id === 'email')?.enabled ?? true,
          addressEnabled: configurableFields.find((f: any) => f.id === 'address')?.enabled ?? true,
          customFields,
          configurableFields
        },
        appearance: { primaryColor, buttonText, submitButtonText },
        features: { 
          guestCheckoutEnabled, 
          showOrderSummary, 
          enableCouponCodes
        },
        messages: { thankYouMessage, processingMessage }
      }

      const updateData: Partial<StoresRecord> = {
        checkoutSettings: updatedCheckoutSettings
      }

      if ('id' in storeSettings && storeSettings.id) {
        // Update existing store record
        await pb.collection(Collections.Stores).update(storeSettings.id, updateData, {
          requestKey: `update-checkout-settings-${Date.now()}`
        })
      } else {
        // Create new store record
        await pb.collection(Collections.Stores).create(updateData, {
          requestKey: `create-checkout-settings-${Date.now()}`
        })
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.data?.message || err.message || 'Failed to save checkout settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between gap-3 p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/dashboard/settings' })}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Back to Settings</span>
            </Button>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg sm:text-xl">Checkout Settings</h1>
            </div>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="hidden sm:flex"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        {/* Store Currency Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Store Currency:</strong> {currency} ({currencySymbol}) - All prices in checkout will use this currency
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Checkout settings saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Enhanced Checkout Fields Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Checkout Fields Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Field Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Field Configuration</h3>
                  <p className="text-xs text-gray-600">Configure which fields to show and their settings</p>
                </div>
                
                <div className="space-y-3">
                  {configurableFields
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((field: any, index: any) => (
                    <div key={field.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start gap-3">
                        {/* Drag Handle & Order Controls */}
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveFieldUp(field.id)}
                              disabled={index === 0}
                              className="h-6 w-6 p-0"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveFieldDown(field.id)}
                              disabled={index === configurableFields.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              ↓
                            </Button>
                          </div>
                        </div>

                        {/* Field Configuration */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={field.enabled}
                                onCheckedChange={(enabled) => 
                                  updateFieldConfig(field.id, { enabled })
                                }
                              />
                              <span className="text-sm font-medium">
                                {field.enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            
                            {/* Remove button for custom fields only */}
                            {!['fullName', 'phoneNumber', 'email', 'address', 'city', 'companyName'].includes(field.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeConfigurableField(field.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Field Label */}
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Field Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) => 
                                  updateFieldConfig(field.id, { label: e.target.value })
                                }
                                placeholder="Enter field label"
                                className="h-9"
                              />
                            </div>

                            {/* Required Toggle */}
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-600">Field Type</Label>
                              <div className="flex items-center gap-2 h-9">
                                <Switch
                                  checked={field.required}
                                  onCheckedChange={(required) => 
                                    updateFieldConfig(field.id, { required })
                                  }
                                  disabled={field.id === 'fullName' || field.id === 'email'} // Full name and email should stay required when enabled
                                />
                                <span className="text-xs text-gray-600">
                                  {field.required ? 'Required' : 'Optional'}
                                </span>
                                {(field.id === 'fullName' || field.id === 'email') && (
                                  <span className="text-xs text-blue-600">(Always required when enabled)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Field Preview with special handling for email and address */}
                          <div className="p-2 bg-gray-50 rounded border">
                            <Label className="text-xs text-gray-600">Preview:</Label>
                            <div className="mt-1">
                              <Label className="text-sm font-medium">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </Label>
                              <Input 
                                type={field.id === 'email' ? 'email' : 'text'}
                                placeholder={
                                  field.id === 'email' 
                                    ? 'Enter email address' 
                                    : field.id === 'address'
                                    ? 'Enter your address'
                                    : `Enter ${field.label.toLowerCase()}`
                                }
                                className="h-8 mt-1"
                                disabled
                              />
                              {field.id === 'email' && (
                                <p className="text-xs text-gray-500 mt-1">We'll send order updates to this email</p>
                              )}
                              {field.id === 'address' && (
                                <p className="text-xs text-gray-500 mt-1">Required for delivery</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Field */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new field (e.g., 'Special Instructions', 'Company Tax ID')"
                      value={newCustomField}
                      onChange={(e) => setNewCustomField(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault() && addNewConfigurableField()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={addNewConfigurableField} 
                      variant="outline"
                      disabled={!newCustomField.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Create custom fields to collect additional information from customers
                  </p>
                </div>
              </div>

              {/* Field Order Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Checkout Form Preview</h4>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="space-y-3">
                    {configurableFields
                      .filter((field: any) => field.enabled)
                      .sort((a: any, b: any) => a.order - b.order)
                      .map((field: any) => (
                      <div key={field.id} className="space-y-1">
                        <Label className="text-sm font-medium">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <Input 
                          type={field.id === 'email' ? 'email' : 'text'}
                          placeholder={
                            field.id === 'email' 
                              ? 'Enter email address' 
                              : field.id === 'address'
                              ? 'Enter your address'
                              : `Enter ${field.label.toLowerCase()}`
                          }
                          className="h-9"
                          disabled
                        />
                        {field.id === 'email' && (
                          <p className="text-xs text-gray-500">We'll send order updates to this email</p>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    This is how the checkout form will appear to customers ({currencySymbol} currency)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-20 h-11 p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonText">Continue Button Text</Label>
                  <Input
                    id="buttonText"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Continue"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submitButtonText">Final Submit Button Text</Label>
                <Input
                  id="submitButtonText"
                  value={submitButtonText}
                  onChange={(e) => setSubmitButtonText(e.target.value)}
                  placeholder="Place Order"
                />
              </div>

              {/* Preview */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-600 mb-3">Button Preview:</p>
                <div className="space-y-2">
                  <Button style={{ backgroundColor: primaryColor }} className="text-white">
                    {buttonText}
                  </Button>
                  <Button style={{ backgroundColor: primaryColor }} className="text-white">
                    {submitButtonText}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Settings - Remove shipping step toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Checkout Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Guest Checkout</Label>
                  <p className="text-xs text-gray-600 mt-1">Allow customers to place orders without creating an account</p>
                </div>
                <Switch
                  checked={guestCheckoutEnabled}
                  onCheckedChange={setGuestCheckoutEnabled}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Show Order Summary</Label>
                  <p className="text-xs text-gray-600 mt-1">Display detailed order summary with {currencySymbol} pricing on checkout page</p>
                </div>
                <Switch
                  checked={showOrderSummary}
                  onCheckedChange={setShowOrderSummary}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Enable Coupon Codes</Label>
                  <p className="text-xs text-gray-600 mt-1">Allow customers to apply discount codes during checkout</p>
                </div>
                <Switch
                  checked={enableCouponCodes}
                  onCheckedChange={setEnableCouponCodes}
                />
              </div>
            </CardContent>
          </Card>

          {/* Messages Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Custom Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="thankYouMessage">Thank You Message</Label>
                <Textarea
                  id="thankYouMessage"
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  placeholder="Enter message shown after successful order"
                  rows={3}
                />
                <p className="text-xs text-gray-600">Displayed on order confirmation page</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processingMessage">Processing Message</Label>
                <Textarea
                  id="processingMessage"
                  value={processingMessage}
                  onChange={(e) => setProcessingMessage(e.target.value)}
                  placeholder="Enter message about order processing"
                  rows={3}
                />
                <p className="text-xs text-gray-600">Shown to customers about next steps</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t lg:hidden">
          <div className="max-w-4xl mx-auto">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="w-full h-12"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

}
