import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Truck, Plus, Edit, Trash2, MapPin, Clock, DollarSign, AlertCircle } from 'lucide-react'
import type { StoresResponse, StoresRecord } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/settings/shipping')({
  loader: async () => {
    try {
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-shipping-settings-${Date.now()}`
      })
      
      return { storeSettings }
    } catch (error) {
      const defaultSettings: Partial<StoresResponse> = {
        storeName: '',
        currency: 'MAD',
        shippingZones: []
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

  // Get currency info from store settings
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

  // Shipping zones state
  const [shippingZones, setShippingZones] = useState<any[]>((storeSettings.shippingZones as any[]) || [])
  
  // Checkout settings state for shipping controls - Remove enableShippingOptions
  const [checkoutSettings, setCheckoutSettings] = useState<any>(
    storeSettings.checkoutSettings || {
      features: {
        enableShippingStep: true
      }
    }
  )

  // Form state for new/edit zone
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingZone, setEditingZone] = useState<any>(null)
  const [zoneName, setZoneName] = useState('')
  const [zoneDescription, setZoneDescription] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [newArea, setNewArea] = useState('')
  const [shippingCost, setShippingCost] = useState('')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [isActive, setIsActive] = useState(true)

  const resetForm = () => {
    setZoneName('')
    setZoneDescription('')
    setAreas([])
    setNewArea('')
    setShippingCost('')
    setFreeShippingThreshold('')
    setEstimatedDays('')
    setIsActive(true)
    setEditingZone(null)
    setShowAddForm(false)
  }

  const addArea = () => {
    if (newArea.trim() && !areas.includes(newArea.trim())) {
      setAreas([...areas, newArea.trim()])
      setNewArea('')
    }
  }

  const removeArea = (index: number) => {
    setAreas(areas.filter((_, i) => i !== index))
  }

  const handleEditZone = (zone: any) => {
    setEditingZone(zone)
    setZoneName(zone.name)
    setZoneDescription(zone.description || '')
    setAreas(zone.areas || [])
    setShippingCost(zone.shippingCost.toString())
    setFreeShippingThreshold(zone.freeShippingThreshold?.toString() || '')
    setEstimatedDays(zone.estimatedDays.toString())
    setIsActive(zone.isActive)
    setShowAddForm(true)
  }

  const handleDeleteZone = (zoneId: string) => {
    setShippingZones(shippingZones.filter((zone: any) => zone.id !== zoneId))
  }

  const handleSaveZone = () => {
    if (!zoneName.trim() || !shippingCost || !estimatedDays) {
      setError('Please fill in all required fields')
      return
    }

    const zoneData = {
      id: editingZone?.id || Date.now().toString(),
      name: zoneName.trim(),
      description: zoneDescription.trim(),
      areas,
      shippingCost: Number(shippingCost),
      freeShippingThreshold: freeShippingThreshold ? Number(freeShippingThreshold) : null,
      estimatedDays: Number(estimatedDays),
      isActive,
      currency
    }

    if (editingZone) {
      setShippingZones(shippingZones.map((zone: any) => 
        zone.id === editingZone.id ? zoneData : zone
      ))
    } else {
      setShippingZones([...shippingZones, zoneData])
    }

    resetForm()
    setError(null)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const updateData: Partial<StoresRecord> = {
        shippingZones,
        checkoutSettings
      }

      if ('id' in storeSettings && storeSettings.id) {
        await pb.collection(Collections.Stores).update(storeSettings.id, updateData, {
          requestKey: `update-shipping-settings-${Date.now()}`
        })
      } else {
        await pb.collection(Collections.Stores).create(updateData, {
          requestKey: `create-shipping-settings-${Date.now()}`
        })
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.data?.message || err.message || 'Failed to save shipping settings. Please try again.')
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
              <Truck className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg sm:text-xl">Shipping Zones</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!showAddForm && (
              <Button 
                onClick={() => setShowAddForm(true)}
                className="hidden sm:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="hidden sm:flex"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto pb-24 lg:pb-8">
        {/* Store Currency Info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Store Currency:</strong> {currency} ({currencySymbol}) - All shipping costs will use this currency
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Shipping settings saved successfully!
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
          {/* Checkout Shipping Controls - Updated */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Enable Shipping Step Control */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Enable Shipping Steps</Label>
                  <p className="text-xs text-gray-600">
                    Show shipping address and method selection steps in checkout
                  </p>
                  <p className="text-xs text-blue-600">
                    When disabled: Customer enters delivery info in contact form only
                  </p>
                </div>
                <Switch
                  checked={checkoutSettings.features?.enableShippingStep ?? true}
                  onCheckedChange={(checked) => 
                    setCheckoutSettings((prev: any) => ({
                      ...prev,
                      features: {
                        ...prev.features,
                        enableShippingStep: checked
                      }
                    }))
                  }
                />
              </div>

              {/* Updated info about shipping zones */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">How shipping steps work:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <strong>Shipping enabled + No zones:</strong> Contact form only</li>
                      <li>• <strong>Shipping enabled + Zones configured:</strong> Shows address form → method selection → review</li>
                      <li>• <strong>Shipping disabled:</strong> Customer enters all delivery info in contact form</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add/Edit Zone Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingZone ? 'Edit Shipping Zone' : 'Add New Shipping Zone'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zoneName">Zone Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="zoneName"
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      placeholder="e.g., Casablanca, Rabat"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedDays">Estimated Delivery (Days) <span className="text-red-500">*</span></Label>
                    <Input
                      id="estimatedDays"
                      type="number"
                      min="1"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      placeholder="2-5"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zoneDescription">Description</Label>
                  <Input
                    id="zoneDescription"
                    value={zoneDescription}
                    onChange={(e) => setZoneDescription(e.target.value)}
                    placeholder="Major cities in Morocco"
                    className="h-11"
                  />
                </div>

                {/* Coverage Areas */}
                <div className="space-y-4">
                  <Label>Coverage Areas</Label>
                  <div className="space-y-2">
                    {areas.map((area, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="flex-1 text-sm">{area}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArea(index)}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add city or area name"
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault() && addArea()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={addArea} 
                      variant="outline"
                      disabled={!newArea.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingCost">Shipping Cost ({currencySymbol}) <span className="text-red-500">*</span></Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold ({currencySymbol})</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(e.target.value)}
                      placeholder="500.00"
                      className="h-11"
                    />
                    <p className="text-xs text-gray-600">Optional: Free shipping for orders above this amount</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="text-sm font-medium">Active Zone</Label>
                    <p className="text-xs text-gray-600">Enable this shipping zone</p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleSaveZone} className="flex-1">
                    {editingZone ? 'Update Zone' : 'Add Zone'}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>Shipping Zones ({shippingZones.length})</span>
                {!showAddForm && (
                  <Button onClick={() => setShowAddForm(true)} size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingZones.length > 0 ? (
                <div className="space-y-4">
                  {shippingZones.map((zone: any) => (
                    <div key={zone.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{zone.name}</h3>
                            <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                              {zone.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {zone.description && (
                            <p className="text-sm text-gray-600 mb-2">{zone.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditZone(zone)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteZone(zone.id)}
                            className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400 shrink-0" />
                          <span>Cost: {formatPrice(zone.shippingCost)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                          <span>{zone.estimatedDays} days</span>
                        </div>
                        {zone.freeShippingThreshold && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 text-xs">
                              Free shipping over {formatPrice(zone.freeShippingThreshold)}
                            </span>
                          </div>
                        )}
                      </div>

                      {zone.areas && zone.areas.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Coverage Areas:</p>
                          <div className="flex flex-wrap gap-1">
                            {zone.areas.slice(0, 3).map((area: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {zone.areas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{zone.areas.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No shipping zones configured
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Add your first shipping zone to start offering delivery options
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => setShowAddForm(true)} className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shipping Zone
                    </Button>
                    <p className="text-xs text-gray-500">
                      Or use the shipping step controls above to customize checkout flow
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mobile Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t lg:hidden">
          <div className="max-w-4xl mx-auto flex gap-3">
            {!showAddForm && (
              <Button 
                onClick={() => setShowAddForm(true)}
                variant="outline"
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            )}
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

