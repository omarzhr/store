import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Store, Upload, X, AlertCircle, Phone } from 'lucide-react'
import type { StoresResponse, StoresRecord } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/settings/store')({
  loader: async () => {
    try {
      // Fetch store settings from database
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-info-settings-${Date.now()}`
      })
      
      return { storeSettings }
    } catch (error) {
      // If no store settings exist, return default values with MAD currency
      const defaultSettings: Partial<StoresResponse> = {
        storeName: '',
        storeDescription: '',
        currency: 'MAD', // Default to Moroccan Dirham
        timezone: 'Africa/Casablanca', // Default to Morocco timezone
        taxRate: 0,
        phone: '',
        email: '',
        address: '',
        website: '',
        aboutUs: ''
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

  // Form state using existing StoresRecord fields - default to MAD
  const [storeName, setStoreName] = useState(storeSettings.storeName || '')
  const [storeDescription, setStoreDescription] = useState(storeSettings.storeDescription || '')
  const [currency, setCurrency] = useState(storeSettings.currency || 'MAD')
  const [timezone, setTimezone] = useState(storeSettings.timezone || 'Africa/Casablanca')
  const [taxRate, setTaxRate] = useState((storeSettings.taxRate || 0).toString())
  const [taxEnabled, setTaxEnabled] = useState((storeSettings.taxRate || 0) > 0)
  const [logo, setLogo] = useState<File | null>(null)

  // These fields are now available in the StoresRecord type
  const [address, setAddress] = useState(storeSettings.address || '')
  const [phone, setPhone] = useState(storeSettings.phone || '')
  const [email, setEmail] = useState(storeSettings.email || '')
  const [website, setWebsite] = useState(storeSettings.website || '')
  const [aboutUs, setAboutUs] = useState(storeSettings.aboutUs || '')

  const currencies = [
    { value: 'MAD', label: 'Moroccan Dirham (DH)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' },
    { value: 'AUD', label: 'Australian Dollar (A$)' },
    { value: 'JPY', label: 'Japanese Yen (¥)' },
    { value: 'CNY', label: 'Chinese Yuan (¥)' },
    { value: 'INR', label: 'Indian Rupee (₹)' }
  ]

  const timezones = [
    { value: 'Africa/Casablanca', label: 'Morocco (WET/WEST)' },
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (US)' },
    { value: 'America/Chicago', label: 'Central Time (US)' },
    { value: 'America/Denver', label: 'Mountain Time (US)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' }
  ]

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      setError(null)
    }
  }

  function removeLogo() {
    setLogo(null)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Calculate final tax rate based on enabled state
      const finalTaxRate = taxEnabled ? (Number(taxRate) || 0) : 0

      // Prepare update data using existing StoresRecord fields
      const updateData: Partial<StoresRecord> = {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        currency,
        timezone,
        taxRate: finalTaxRate,
        // Add taxEnabled to checkoutSettings to track tax state properly
        checkoutSettings: {
          ...((storeSettings as any)?.checkoutSettings || {}),
          taxEnabled: taxEnabled,
          taxRate: finalTaxRate
        },
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        website: website.trim(),
        aboutUs: aboutUs.trim()
      }

      // Remove empty fields to avoid validation issues
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof typeof updateData]
        if (value === '' || value === null || value === undefined) {
          delete updateData[key as keyof typeof updateData]
        }
      })

      // If we have file uploads, use FormData
      if (logo) {
        const formData = new FormData()
        
        // Add all the data fields
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString())
          }
        })

        // Add logo
        formData.append('logo', logo)

        if ('id' in storeSettings && storeSettings.id) {
          await pb.collection(Collections.Stores).update(storeSettings.id, formData, {
            requestKey: `update-store-info-${Date.now()}`
          })
        } else {
          await pb.collection(Collections.Stores).create(formData, {
            requestKey: `create-store-info-${Date.now()}`
          })
        }
      } else {
        // No file uploads, use regular data update
        if ('id' in storeSettings && storeSettings.id) {
          await pb.collection(Collections.Stores).update(storeSettings.id, updateData, {
            requestKey: `update-store-info-${Date.now()}`
          })
        } else {
          await pb.collection(Collections.Stores).create(updateData, {
            requestKey: `create-store-info-${Date.now()}`
          })
        }
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
      // Trigger cart recalculation by dispatching a custom event
      window.dispatchEvent(new CustomEvent('taxSettingsChanged', { 
        detail: { taxRate: finalTaxRate, taxEnabled } 
      }))
      
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.data?.message || err.message || 'Failed to save store information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = storeName.trim().length > 0

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
              <Store className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg sm:text-xl">Store Information</h1>
            </div>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={loading || !isFormValid}
            className="hidden sm:flex"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Store information saved successfully!
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value)
                      setError(null)
                    }}
                    placeholder="Enter your store name"
                    className="h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Brief description of your store"
                    rows={3}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600">This will be displayed on your storefront</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aboutUs">About Us</Label>
                  <Textarea
                    id="aboutUs"
                    value={aboutUs}
                    onChange={(e) => setAboutUs(e.target.value)}
                    placeholder="Tell customers about your business story"
                    rows={4}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-600">
                    Share your business story and values with customers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Store Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Logo */}
              {storeSettings.logo && (
                <div className="space-y-2">
                  <Label>Current Logo</Label>
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={pb.files.getUrl(storeSettings, storeSettings.logo, { thumb: '100x100' })}
                      alt="Current logo"
                      className="w-16 h-16 object-contain border rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">Current logo</p>
                      <p className="text-xs text-gray-600">{storeSettings.logo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload New Logo */}
              <div className="space-y-2">
                <Label htmlFor="logo">Upload New Logo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Label
                    htmlFor="logo"
                    className="flex flex-col items-center justify-center cursor-pointer space-y-2 min-h-[80px]"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {logo ? logo.name : 'Click to upload logo'}
                    </span>
                  </Label>
                </div>
                
                {/* Show selected logo */}
                {logo && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate">{logo.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeLogo}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  Recommended: Square image, minimum 200x200px, PNG or JPG
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter store phone number"
                    className="h-11"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="store@example.com"
                    className="h-11"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Store Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street, City, State, Country"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.yourstore.com"
                  className="h-11"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={currency} 
                    onValueChange={setCurrency}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={timezone} 
                    onValueChange={setTimezone}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable Tax</Label>
                    <p className="text-xs text-muted-foreground">Apply tax to orders and cart calculations</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="taxEnabled"
                      checked={taxEnabled}
                      onChange={(e) => {
                        setTaxEnabled(e.target.checked)
                        if (!e.target.checked) {
                          setTaxRate('0')
                        }
                      }}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      disabled={loading}
                    />
                    <Label htmlFor="taxEnabled" className="text-sm cursor-pointer">
                      {taxEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>

                {taxEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      placeholder="0.00"
                      className="h-11"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-600">
                      Tax rate applied to orders (e.g., 8.25 for 8.25%)
                    </p>
                  </div>
                )}

                {/* Tax Preview */}
                <div className="p-3 bg-white border rounded">
                  <div className="text-xs text-muted-foreground mb-1">Tax Preview:</div>
                  <div className="text-sm">
                    {taxEnabled ? (
                      <span>
                        {Number(taxRate) || 0}% tax will be applied to cart and orders
                      </span>
                    ) : (
                      <span className="text-gray-500">No tax will be applied</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Example: 100.00 {currency === 'MAD' ? 'DH' : currency} + tax = {' '}
                    {taxEnabled 
                      ? (100 + (100 * (Number(taxRate) || 0) / 100)).toFixed(2)
                      : '100.00'
                    } {currency === 'MAD' ? 'DH' : currency}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t lg:hidden">
          <div className="max-w-4xl mx-auto">
            <Button 
              onClick={handleSave}
              disabled={loading || !isFormValid}
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
