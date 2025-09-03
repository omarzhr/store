import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Palette, Eye, RotateCcw, AlertCircle } from 'lucide-react'
import type { StoresResponse } from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/settings/appearance')({
  loader: async () => {
    try {
      // Fetch store settings from database
      const storeSettings = await pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
        requestKey: `store-appearance-settings-${Date.now()}`
      })
      
      return { storeSettings }
    } catch (error) {
      // If no store settings exist, return default values
      const defaultSettings: Partial<StoresResponse> = {
        storeName: '',
        storeDescription: ''
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

  // Form state - these fields would need to be added to StoresRecord in PocketBase
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#1f2937')
  const [accentColor, setAccentColor] = useState('#10b981')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [headerFont, setHeaderFont] = useState('Inter')
  const [customCSS, setCustomCSS] = useState('')

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Default)' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro' },
    { value: 'Nunito', label: 'Nunito' },
    { value: 'Raleway', label: 'Raleway' },
    { value: 'Playfair Display', label: 'Playfair Display (Serif)' },
    { value: 'Merriweather', label: 'Merriweather (Serif)' }
  ]

  const presetThemes = [
    {
      name: 'Default Blue',
      primary: '#3b82f6',
      secondary: '#1f2937',
      accent: '#10b981'
    },
    {
      name: 'Professional Green',
      primary: '#059669',
      secondary: '#374151',
      accent: '#f59e0b'
    },
    {
      name: 'Elegant Purple',
      primary: '#7c3aed',
      secondary: '#1f2937',
      accent: '#ec4899'
    },
    {
      name: 'Warm Orange',
      primary: '#ea580c',
      secondary: '#374151',
      accent: '#0ea5e9'
    },
    {
      name: 'Modern Dark',
      primary: '#6366f1',
      secondary: '#111827',
      accent: '#06b6d4'
    }
  ]

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate saving - these fields would need to be added to StoresRecord
      console.log('Would save appearance settings:', {
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        headerFont,
        customCSS
      })
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Save error:', err)
      setError('Failed to save appearance settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyPresetTheme = (theme: typeof presetThemes[0]) => {
    setPrimaryColor(theme.primary)
    setSecondaryColor(theme.secondary)
    setAccentColor(theme.accent)
  }

  const resetToDefaults = () => {
    setPrimaryColor('#3b82f6')
    setSecondaryColor('#1f2937')
    setAccentColor('#10b981')
    setFontFamily('Inter')
    setHeaderFont('Inter')
    setCustomCSS('')
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
              <Palette className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg sm:text-xl">Appearance & Branding</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={resetToDefaults}
              disabled={loading}
              className="hidden sm:flex"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
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
        {/* Database Warning */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Setup Required:</strong> To use this feature, add these fields to your PocketBase stores collection:
            <code className="block mt-2 text-xs bg-amber-100 p-2 rounded">
              primaryColor, secondaryColor, accentColor, fontFamily, headerFont, customCSS
            </code>
          </AlertDescription>
        </Alert>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Appearance settings saved successfully!
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
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-6 space-y-4"
                style={{ 
                  backgroundColor: secondaryColor + '10',
                  fontFamily: fontFamily
                }}
              >
                <h2 
                  className="text-2xl font-bold"
                  style={{ 
                    color: primaryColor,
                    fontFamily: headerFont
                  }}
                >
                  {storeSettings.storeName || 'Your Store Name'}
                </h2>
                <p className="text-gray-600" style={{ fontFamily: fontFamily }}>
                  {storeSettings.storeDescription || 'This is how your store will look with these appearance settings.'}
                </p>
                <div className="flex gap-3">
                  <Button 
                    style={{ backgroundColor: primaryColor }}
                    className="text-white"
                  >
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline"
                    style={{ 
                      borderColor: accentColor,
                      color: accentColor
                    }}
                  >
                    Accent Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <p className="text-xs text-gray-600">Main brand color for buttons and links</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-20 h-11 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#1f2937"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Text and background accents</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-20 h-11 p-1"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Highlights and success states</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Quick Themes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presetThemes.map((theme) => (
                    <Button
                      key={theme.name}
                      variant="outline"
                      onClick={() => applyPresetTheme(theme)}
                      className="h-auto p-3 justify-start"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: theme.secondary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border" 
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <span className="text-sm font-medium">{theme.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Body Font</Label>
                  <Select value={fontFamily} onValueChange={setFontFamily}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select font family" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">Used for body text and paragraphs</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerFont">Heading Font</Label>
                  <Select value={headerFont} onValueChange={setHeaderFont}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select header font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">Used for headings and titles</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium mb-2">Font Preview</h4>
                <div className="space-y-2">
                  <h3 
                    className="text-lg font-bold"
                    style={{ fontFamily: headerFont }}
                  >
                    Heading Sample Text (H3)
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ fontFamily: fontFamily }}
                  >
                    This is how your body text will look with the selected font. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom CSS */}
          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customCSS">Custom CSS Rules</Label>
                <Textarea
                  id="customCSS"
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  placeholder="/* Add your custom CSS here */
.custom-button {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Override default styles */
.product-card:hover {
  transform: translateY(-2px);
}"
                  rows={8}
                  className="font-mono text-sm"
                  disabled={loading}
                />
                <p className="text-xs text-gray-600">
                  Advanced: Add custom CSS to override default styles. Use with caution.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t lg:hidden">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Button 
              variant="outline"
              onClick={resetToDefaults}
              disabled={loading}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
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
          
