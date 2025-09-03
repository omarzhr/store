import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Settings, 
  Store, 
  CreditCard, 
  Truck, 
  Bell, 
  Palette, 
  Shield, 
  DollarSign,
  ChevronRight,
  Package,
  Users,
  BarChart3,
  ShoppingCart
} from 'lucide-react'
import type { StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

interface SettingsSection {
  title: string
  description: string
  icon: React.ComponentType<any>
  configured: boolean
  action: () => void | Promise<void>
  isNew?: boolean
  badge?: string
}

interface SettingsCategory {
  id: string
  title: string
  icon: React.ComponentType<any>
  sections: SettingsSection[]
}

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/settings/')({
  loader: async () => {
    try {
      // Fetch store settings from database using proper types
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-settings-${Date.now()}`
      })
      
      return { storeSettings }
    } catch (error) {
      // If no store settings exist, return default values
      const defaultSettings: Partial<StoresResponse> = {
        is_cart_enabled: true,
        storeName: '',
        storeDescription: '',
        checkoutSettings: null,
        shippingZones: null,
        notifications_: null,
        codSettingscodSettings: null
      }
      
      return { storeSettings: defaultSettings }
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { storeSettings } = Route.useLoaderData()
  
  // Parse existing settings or use defaults
  const existingSettings = storeSettings?.checkoutSettings ? 
    (typeof storeSettings.checkoutSettings === 'string' ? 
      JSON.parse(storeSettings.checkoutSettings) : 
      storeSettings.checkoutSettings) : {}

  const [cartEnabled, setCartEnabled] = useState(storeSettings.is_cart_enabled ?? true)
  const [checkoutEnabled, setCheckoutEnabled] = useState(existingSettings?.checkoutEnabled ?? true)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSaveShoppingSettings = async () => {
    setLoading(true)
    try {
      const updatedCheckoutSettings = {
        ...existingSettings,
        checkoutEnabled
      }

      const formData = new FormData()
      formData.append('is_cart_enabled', cartEnabled.toString())
      formData.append('checkoutSettings', JSON.stringify(updatedCheckoutSettings))

      if (storeSettings?.id) {
        await pb.collection(Collections.Stores).update(storeSettings.id, formData, {
          requestKey: `update-shopping-settings-${Date.now()}`
        })
      } else {
        await pb.collection(Collections.Stores).create(formData, {
          requestKey: `create-shopping-settings-${Date.now()}`
        })
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save shopping settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const settingsCategories: SettingsCategory[] = [
    {
      id: 'general',
      title: 'General',
      icon: Settings,
      sections: [
        {
          title: 'Store Information',
          description: 'Basic store details, logo, and contact information',
          icon: Store,
          configured: !!(storeSettings.storeName && storeSettings.storeDescription),
          action: () => navigate({ to: '/dashboard/settings/store' })
        },
        {
          title: 'Appearance & Branding',
          description: 'Colors, fonts, and visual customization',
          icon: Palette,
          configured: !!(storeSettings.logo),
          action: () => navigate({ to: '/dashboard/settings/appearance' })
        }
      ]
    },
    {
      id: 'ecommerce',
      title: 'E-commerce',
      icon: Package,
      sections: [
        {
          title: 'Checkout Page Settings',
          description: 'Customize checkout fields, appearance, and messages',
          icon: CreditCard,
          configured: !!(storeSettings.checkoutSettings),
          action: () => navigate({ to: '/dashboard/settings/checkout' }),
          isNew: true
        },
        {
          title: 'Shipping Zones',
          description: 'Configure shipping options and delivery areas',
          icon: Truck,
          configured: !!(storeSettings.shippingZones),
          badge: storeSettings.shippingZones ? '2 zones' : undefined,
          action: () => navigate({ to: '/dashboard/settings/shipping' })
        },
        {
          title: 'Payment Methods',
          description: 'Cash on delivery and payment options',
          icon: DollarSign,
          configured: !!(storeSettings.codSettingscodSettings),
          action: () => navigate({ to: '/dashboard/settings/checkout' })
        }
      ]
    },
    {
      id: 'communication',
      title: 'Communication',
      icon: Bell,
      sections: [
        {
          title: 'Notifications',
          description: 'Email alerts and notification preferences',
          icon: Bell,
          configured: !!(storeSettings.notifications_),
          action: () => console.log('Notifications settings coming soon')
        },
        {
          title: 'Customer Communication',
          description: 'Order confirmations and status updates',
          icon: Users,
          configured: false,
          action: () => console.log('Communication settings coming soon')
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced',
      icon: Shield,
      sections: [
        {
          title: 'Security & Privacy',
          description: 'Data protection and security settings',
          icon: Shield,
          configured: false,
          action: () => console.log('Security settings coming soon')
        },
        {
          title: 'Analytics & Tracking',
          description: 'Google Analytics and conversion tracking',
          icon: BarChart3,
          configured: false,
          action: () => console.log('Analytics settings coming soon')
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg sm:text-xl">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-6xl mx-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Store className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Store Status</p>
                  <p className="font-semibold text-sm">
                    {storeSettings.storeName ? 'Configured' : 'Needs Setup'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Truck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Shipping</p>
                  <p className="font-semibold text-sm">
                    {storeSettings.shippingZones ? 'Active' : 'Setup Required'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CreditCard className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Checkout</p>
                  <p className="font-semibold text-sm">
                    {storeSettings.checkoutSettings ? 'Configured' : 'Needs Setup'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Notifications</p>
                  <p className="font-semibold text-sm">
                    {storeSettings.notifications_ ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Categories */}
        <div className="space-y-8">
          {settingsCategories.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.sections.map((section, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={section.action}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <section.icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {section.title}
                              {section.isNew && (
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {section.description}
                            </CardDescription>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${section.configured ? 'bg-green-500' : 'bg-yellow-500'}`} />
                          <span className="text-xs text-gray-600">
                            {section.configured ? 'Configured' : 'Needs Setup'}
                          </span>
                        </div>
                        {section.badge && (
                          <Badge variant="outline" className="text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Home Page Settings Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Home Page
              </CardTitle>
              <p className="text-sm text-gray-600">
                Customize hero section, categories, and home page layout
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" onClick={() => navigate({ to: '/dashboard/settings/home' })}>
                <Link to="/dashboard/settings/home">
                  Manage Home Page
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Existing settings cards... */}
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common settings tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate({ to: '/dashboard/settings/checkout' })}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <p className="font-medium">Setup Checkout</p>
                  <p className="text-xs text-gray-600">Customize checkout experience</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate({ to: '/dashboard/settings/shipping' })}
              >
                <Truck className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <p className="font-medium">Add Shipping Zone</p>
                  <p className="text-xs text-gray-600">Configure delivery areas</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate({ to: '/dashboard/settings/store' })}
              >
                <Store className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <p className="font-medium">Update Store Info</p>
                  <p className="text-xs text-gray-600">Edit name, logo, contact</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shopping Features Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Features
            </CardTitle>
            <p className="text-sm text-gray-600">
              Control cart and checkout functionality for your store
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success Alert */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Shopping settings saved successfully! Changes will be reflected on your website.
                </p>
              </div>
            )}

            {/* Add to Cart Control */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="cartEnabled" className="text-base font-medium">
                  Add to Cart & Shopping Cart
                </Label>
                <p className="text-sm text-gray-600">
                  Show cart icon in header and allow customers to add products to cart
                </p>
                <div className="text-xs text-gray-500">
                  When disabled: Cart icon hidden from header, "Add to Cart" buttons hidden from products
                </div>
              </div>
              <Switch
                id="cartEnabled"
                checked={cartEnabled}
                onCheckedChange={setCartEnabled}
              />
            </div>

            {/* Checkout Process Control */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="checkoutEnabled" className="text-base font-medium">
                  Checkout Process
                </Label>
                <p className="text-sm text-gray-600">
                  Enable the full checkout process for order placement
                </p>
                <div className="text-xs text-gray-500">
                  When disabled: Cart page will show but checkout button will be hidden
                </div>
              </div>
              <Switch
                id="checkoutEnabled"
                checked={checkoutEnabled}
                onCheckedChange={setCheckoutEnabled}
                disabled={!cartEnabled}
              />
            </div>

            {/* Shopping Features Preview */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Configuration:</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cartEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Cart & Add to Cart: {cartEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${checkoutEnabled && cartEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Checkout: {checkoutEnabled && cartEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                {!cartEnabled && (
                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs">
                    ⚠️ With cart disabled, your store will function as a catalog only
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveShoppingSettings}
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
