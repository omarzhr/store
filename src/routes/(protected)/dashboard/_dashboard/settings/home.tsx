import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Plus, 
  AlertCircle,
  Home as HomeIcon,
  Image as ImageIcon,
  Layout,
  Navigation,
  Save,
  Mail,
  Trash2,
  Link as LinkIcon,
  Eye
} from 'lucide-react'
import type { StoresResponse, CategoriesResponse} from '@/lib/types'
import { Collections } from '@/lib/types'
import pb from '@/lib/db'
import { CategoryManagementSection } from '@/components/homeComponents/CategoryManagementSection'

import { LogoSection } from '@/components/homeComponents/LogoSection'
import { CategoryImageManager } from '@/components/homeComponents/categogyComponent'
import { createCategoryManagementHandlers } from '@/components/homeComponents/createCategoryManagementHandlers'
import { createSettingsData } from '@/components/homeComponents/createSettingsData'

export const Route = createFileRoute('/(protected)/dashboard/_dashboard/settings/home')({
  loader: async () => {
    try {
      const [storeSettings, categories] = await Promise.all([
        pb.collection(Collections.Stores).getFirstListItem<StoresResponse>('', {
          requestKey: `home-settings-${Date.now()}`
        }).catch(() => null),
        pb.collection(Collections.Categories).getFullList<CategoriesResponse>({
          requestKey: `categories-home-${Date.now()}`
        })
      ])
      
      return { storeSettings, categories }
    } catch (error) {
      console.error('Failed to load home settings:', error)
      return { storeSettings: null, categories: [] }
    }
  },
  component: HomeSettingsComponent,
})


function HomeSettingsComponent() {
  const navigate = useNavigate()
  const { storeSettings, categories } = Route.useLoaderData()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Parse existing settings or use defaults
  const existingSettings = storeSettings?.checkoutSettings ? 
    (typeof storeSettings.checkoutSettings === 'string' ? 
      JSON.parse(storeSettings.checkoutSettings) : 
      storeSettings.checkoutSettings) : {}
  
  // Hero Section Settings
  const [heroTitle, setHeroTitle] = useState(existingSettings.hero?.title || 'Premium Quality Products')
  const [heroSubtitle, setHeroSubtitle] = useState(existingSettings.hero?.subtitle || 'Discover amazing deals with cash on delivery')
  const [heroCtaText, setHeroCtaText] = useState(existingSettings.hero?.ctaText || 'Shop Now')
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<File | null>(null)
  const [heroEnabled, setHeroEnabled] = useState(existingSettings.hero?.enabled ?? true)
  const [heroCtaLink, setHeroCtaLink] = useState(existingSettings.hero?.ctaLink || '/products')
  const [removeHeroCtaLink, setRemoveHeroCtaLink] = useState(!existingSettings.hero?.ctaLink)
  const [heroBackgroundLink, setHeroBackgroundLink] = useState(existingSettings.hero?.backgroundLink || '')
  const [removeHeroBackgroundLink, setRemoveHeroBackgroundLink] = useState(!existingSettings.hero?.backgroundLink)

  // Header Settings
  const [storeName, setStoreName] = useState(storeSettings?.storeName || 'Store')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoType, setLogoType] = useState<'upload' | 'url'>('upload')
  const [logoUrl, setLogoUrl] = useState(existingSettings.header?.logoUrl || '')
  const [showSearchInHeader, setShowSearchInHeader] = useState(existingSettings.header?.showSearch ?? true)
  const [showWishlistInHeader, setShowWishlistInHeader] = useState(existingSettings.header?.showWishlist ?? true)
  const [headerStyle, setHeaderStyle] = useState(existingSettings.header?.style || 'default')
  const [logoLink, setLogoLink] = useState(existingSettings.header?.logoLink || '')
  const [removeLogoLink, setRemoveLogoLink] = useState(!existingSettings.header?.logoLink)
  
  // Categories Settings
  const [categoriesEnabled, setCategoriesEnabled] = useState(existingSettings.categories?.enabled ?? true)
  const [categoriesTitle, setCategoriesTitle] = useState(existingSettings.categories?.title || 'Shop by Category')
  const [categoriesLayout, setCategoriesLayout] = useState(existingSettings.categories?.layout || 'horizontal')
  const [visibleCategories, setVisibleCategories] = useState<string[]>(
    existingSettings.categories?.visibleCategories || categories.map(c => c.id)
  )
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>(
    existingSettings.categories?.categoryImages || {}
  )
  const [showCategoryImages, setShowCategoryImages] = useState(existingSettings.categories?.showImages ?? true)
  const [categoryImageFiles, setCategoryImageFiles] = useState<Record<string, File>>({})
  const [_categoryImageType, _setCategoryImageType] = useState<Record<string, 'upload' | 'url'>>({})
  const [removeCategoryImages, setRemoveCategoryImages] = useState<string[]>([])

  // Featured Products Settings
  const [featuredEnabled, setFeaturedEnabled] = useState(existingSettings.featured?.enabled ?? true)
  const [featuredTitle, setFeaturedTitle] = useState(existingSettings.featured?.title || 'Featured Products')
  const [featuredLimit, setFeaturedLimit] = useState(existingSettings.featured?.limit || 4)
  const [featuredSortBy, setFeaturedSortBy] = useState(existingSettings.featured?.sortBy || 'newest')
  
  // Promo Banners Settings
  const [promoBannersEnabled, setPromoBannersEnabled] = useState(existingSettings.promoBanners?.enabled ?? true)
  const [promoBanners, setPromoBanners] = useState(existingSettings.promoBanners?.banners || [
    {
      id: '1',
      title: 'Free Shipping',
      subtitle: 'On orders over $50',
      icon: 'Truck',
      bgColor: 'bg-blue-500',
      textColor: 'text-white',
      enabled: true
    },
    {
      id: '2',
      title: 'Special Offers',
      subtitle: 'Up to 30% off selected items',
      icon: 'Gift',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      enabled: true
    }
  ])
  
  // Newsletter Settings
  const [newsletterEnabled, setNewsletterEnabled] = useState(existingSettings.newsletter?.enabled ?? true)
  const [newsletterTitle, setNewsletterTitle] = useState(existingSettings.newsletter?.title || 'Stay Updated')
  const [newsletterSubtitle, setNewsletterSubtitle] = useState(existingSettings.newsletter?.subtitle || 'Subscribe to our newsletter and be the first to know about new products, exclusive offers, and special deals.')

  const [removeCurrentLogo, setRemoveCurrentLogo] = useState(false)
  const [removeCurrentHeroBackground, setRemoveCurrentHeroBackground] = useState(false)

  // Category Management State
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editCategoryName, setEditCategoryName] = useState('')
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [categoryManagementLoading, setCategoryManagementLoading] = useState(false)

  // Create handlers
  const categoryHandlers = createCategoryManagementHandlers(
    setError,
    setCategoryManagementLoading,
    setVisibleCategories,
    setNewCategoryName,
    setIsAddingCategory,
    setEditingCategoryId,
    setEditCategoryName,
    setCategoryToDelete
  )

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setError(null)
    }
  }

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHeroBackgroundImage(file)
      setError(null)
    }
  }

  const toggleCategoryVisibility = (categoryId: string) => {
    setVisibleCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const updatePromoBanner = (index: number, updates: Partial<typeof promoBanners[0]>) => {
    setPromoBanners((prev: typeof promoBanners) => prev.map((banner: typeof promoBanners[0], i: number) => 
      i === index ? { ...banner, ...updates } : banner
    ))
  }

  const addPromoBanner = () => {
    const newBanner = {
      id: Date.now().toString(),
      title: 'New Banner',
      subtitle: 'Banner subtitle',
      icon: 'Gift',
      bgColor: 'bg-gray-500',
      textColor: 'text-white',
      enabled: true
    }
    setPromoBanners((prev: typeof promoBanners) => [...prev, newBanner])
  }

  const removePromoBanner = (index: number) => {
    setPromoBanners((prev: typeof promoBanners) => prev.filter((_: typeof promoBanners[0], i: number) => i !== index))
  }

  const handleRemoveCurrentLogo = () => {
    setRemoveCurrentLogo(true)
    setLogoFile(null)
  }

  const handleRemoveCurrentHeroBackground = () => {
    setRemoveCurrentHeroBackground(true)
    setHeroBackgroundImage(null)
  }

  const handleCategoryImageFileChange = (categoryId: string, file: File | null) => {
    if (file) {
      setCategoryImageFiles(prev => ({ ...prev, [categoryId]: file }))
      setCategoryImages(prev => {
        const newImages = { ...prev }
        delete newImages[categoryId]
        return newImages
      })
      setRemoveCategoryImages(prev => prev.filter(id => id !== categoryId))
      setError(null)
    } else {
      setCategoryImageFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[categoryId]
        return newFiles
      })
    }
  }

  const handleRemoveCategoryImage = (categoryId: string) => {
    setRemoveCategoryImages(prev => [...prev, categoryId])
    setCategoryImageFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[categoryId]
      return newFiles
    })
    setCategoryImages(prev => {
      const newImages = { ...prev }
      delete newImages[categoryId]
      return newImages
    })
  }

  const handleRestoreCategoryImage = (categoryId: string) => {
    setRemoveCategoryImages(prev => prev.filter(id => id !== categoryId))
  }

  const getCurrentCategoryImage = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (category?.image) {
      return pb.files.getUrl(category, category.image, { thumb: '100x100' })
    }
    return null
  }

  const startEditCategory = (category: CategoriesResponse) => {
    setEditingCategoryId(category.id)
    setEditCategoryName(category.name)
  }

  const cancelEdit = () => {
    setEditingCategoryId(null)
    setEditCategoryName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      
      formData.append('storeName', storeName.trim() || 'Store')
      
      if (removeCurrentLogo) {
        formData.append('logo', '')
      } else if (logoFile) {
        formData.append('logo', logoFile)
      }
      
      if (removeCurrentHeroBackground) {
        formData.append('heroBackground', '')
      } else if (heroBackgroundImage) {
        formData.append('heroBackground', heroBackgroundImage)
      }

      for (const category of categories) {
        const categoryId = category.id
        const hasFile = categoryImageFiles[categoryId]
        const shouldRemove = removeCategoryImages.includes(categoryId)
        
        if (hasFile || shouldRemove) {
          const categoryFormData = new FormData()
          
          if (shouldRemove) {
            categoryFormData.append('image', '')
          } else if (hasFile) {
            categoryFormData.append('image', hasFile)
          }
          
          await pb.collection(Collections.Categories).update(categoryId, categoryFormData)
        }
      }
      
      const homeSettings = createSettingsData({
        heroEnabled, heroTitle, heroSubtitle, heroCtaText, removeHeroCtaLink, heroCtaLink, removeHeroBackgroundLink, heroBackgroundLink,
        showSearchInHeader, showWishlistInHeader, headerStyle, removeLogoLink, logoLink, logoFile, logoUrl,
        categoriesEnabled, categoriesTitle, categoriesLayout, visibleCategories, showCategoryImages,
        featuredEnabled, featuredTitle, featuredLimit, featuredSortBy,
        promoBannersEnabled, promoBanners,
        newsletterEnabled, newsletterTitle, newsletterSubtitle
      })
      
      formData.append('checkoutSettings', JSON.stringify(homeSettings))
      
      if (storeSettings) {
        await pb.collection(Collections.Stores).update(storeSettings.id, formData, {
          requestKey: `update-home-settings-${Date.now()}`
        })
      } else {
        await pb.collection(Collections.Stores).create(formData, {
          requestKey: `create-home-settings-${Date.now()}`
        })
      }
      
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/dashboard/settings' })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Settings
          </Button>
          <div className="flex items-center gap-2">
            <HomeIcon className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">
              Home Page Settings
            </h1>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/', '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Website
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Settings saved successfully! <a href="/" target="_blank" className="underline font-medium">View updated website</a>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="header" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="promos">Promos</TabsTrigger>
              <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            </TabsList>

            {/* Header Settings */}
            <TabsContent value="header" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Header Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Store Name */}
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Enter store name (optional)"
                    />
                    <p className="text-xs text-gray-600">
                      Leave empty to use default "Store" name
                    </p>
                  </div>

                  {/* Logo Section */}
                  <LogoSection
                    logoType={logoType}
                    setLogoType={setLogoType}
                    storeSettings={storeSettings}
                    removeCurrentLogo={removeCurrentLogo}
                    handleRemoveCurrentLogo={handleRemoveCurrentLogo}
                    logoFile={logoFile}
                    handleLogoChange={handleLogoChange}
                    setLogoFile={setLogoFile}
                    logoUrl={logoUrl}
                    setLogoUrl={setLogoUrl}
                  />

                  {/* Header Features */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Header Features</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showSearch">Show Search Bar</Label>
                          <p className="text-sm text-gray-600">Display search functionality in header</p>
                        </div>
                        <Switch
                          id="showSearch"
                          checked={showSearchInHeader}
                          onCheckedChange={setShowSearchInHeader}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showWishlist">Show Wishlist Icon</Label>
                          <p className="text-sm text-gray-600">Display wishlist icon in header</p>
                        </div>
                        <Switch
                          id="showWishlist"
                          checked={showWishlistInHeader}
                          onCheckedChange={setShowWishlistInHeader}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo Link */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="logoLink">Logo Link (optional)</Label>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="removeLogoLink" className="text-sm">No link</Label>
                        <Switch
                          id="removeLogoLink"
                          checked={removeLogoLink}
                          onCheckedChange={setRemoveLogoLink}
                        />
                      </div>
                    </div>
                    
                    {!removeLogoLink && (
                      <div className="flex gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-400 mt-3" />
                        <Input
                          id="logoLink"
                          value={logoLink}
                          onChange={(e) => setLogoLink(e.target.value)}
                          placeholder="Enter URL (e.g., https://example.com or /about)"
                          className="flex-1"
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-600">
                      {removeLogoLink ? 
                        'Logo will not be clickable' : 
                        'Where users go when clicking the logo (default: home page)'}
                    </p>
                  </div>

                  {/* Header Style */}
                  <div className="space-y-2">
                    <Label htmlFor="headerStyle">Header Style</Label>
                    <Select value={headerStyle} onValueChange={setHeaderStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select header style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="centered">Centered Logo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hero Section Settings */}
            <TabsContent value="hero" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Hero Section
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="heroEnabled">Enable Hero Section</Label>
                      <p className="text-sm text-gray-600">Show hero banner on home page</p>
                    </div>
                    <Switch
                      id="heroEnabled"
                      checked={heroEnabled}
                      onCheckedChange={setHeroEnabled}
                    />
                  </div>

                  {heroEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="heroTitle">Hero Title</Label>
                        <Input
                          id="heroTitle"
                          value={heroTitle}
                          onChange={(e) => setHeroTitle(e.target.value)}
                          placeholder="Enter hero title (optional)"
                        />
                        <p className="text-xs text-gray-600">
                          Leave empty to use default "Premium Quality Products"
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
                        <Textarea
                          id="heroSubtitle"
                          value={heroSubtitle}
                          onChange={(e) => setHeroSubtitle(e.target.value)}
                          placeholder="Enter hero subtitle (optional)"
                          rows={2}
                        />
                        <p className="text-xs text-gray-600">
                          Leave empty to use default subtitle
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="heroCtaText">Call-to-Action Button Text</Label>
                        <Input
                          id="heroCtaText"
                          value={heroCtaText}
                          onChange={(e) => setHeroCtaText(e.target.value)}
                          placeholder="Enter CTA text (optional)"
                        />
                        <p className="text-xs text-gray-600">
                          Leave empty to use default "Shop Now"
                        </p>
                      </div>

                      {/* CTA Link */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="heroCtaLink">Call-to-Action Link</Label>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="removeCtaLink" className="text-sm">No link</Label>
                            <Switch
                              id="removeCtaLink"
                              checked={removeHeroCtaLink}
                              onCheckedChange={setRemoveHeroCtaLink}
                            />
                          </div>
                        </div>
                        
                        {!removeHeroCtaLink && (
                          <div className="flex gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-400 mt-3" />
                            <Input
                              id="heroCtaLink"
                              value={heroCtaLink}
                              onChange={(e) => setHeroCtaLink(e.target.value)}
                              placeholder="/products"
                              className="flex-1"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-600">
                          {removeHeroCtaLink ? 
                            'Button will not have a link' : 
                            'Where the button should redirect (e.g., /products, /about)'}
                        </p>
                      </div>

                      {/* Background Image */}
                      <div className="space-y-2">
                        <Label htmlFor="heroBackground">Background Image</Label>
                        
                        {/* Current Background Display */}
                        {storeSettings?.heroBackground && !removeCurrentHeroBackground && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={pb.files.getUrl(storeSettings, storeSettings.heroBackground, { thumb: '150x100' })}
                                  alt="Current hero background"
                                  className="w-24 h-16 object-cover rounded border"
                                />
                                <div>
                                  <p className="text-sm font-medium">Current background</p>
                                  <p className="text-xs text-gray-600">{storeSettings.heroBackground}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemoveCurrentHeroBackground}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Upload New Background */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <Input
                            id="heroBackground"
                            type="file"
                            accept="image/*"
                            onChange={handleHeroImageChange}
                            className="hidden"
                          />
                          <Label
                            htmlFor="heroBackground"
                            className="flex flex-col items-center justify-center cursor-pointer space-y-2 min-h-[80px]"
                          >
                            <Upload className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600 text-center">
                              {heroBackgroundImage ? heroBackgroundImage.name : 
                               removeCurrentHeroBackground ? 'Click to upload background image' :
                               'Click to upload background image or replace existing'}
                            </span>
                          </Label>
                        </div>

                        {/* Show selected background file */}
                        {heroBackgroundImage && (
                          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-800">New background: {heroBackgroundImage.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setHeroBackgroundImage(null)}
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {removeCurrentHeroBackground && (
                          <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                            <span className="text-sm text-red-800">Current background will be removed</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemoveCurrentHeroBackground(false)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Background Image Link */}
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="heroBackgroundLink">Background Image Link (optional)</Label>
                            <div className="flex items-center gap-2">
                              <Label htmlFor="removeBackgroundLink" className="text-sm">No link</Label>
                              <Switch
                                id="removeBackgroundLink"
                                checked={removeHeroBackgroundLink}
                                onCheckedChange={setRemoveHeroBackgroundLink}
                              />
                            </div>
                          </div>
                          
                          {!removeHeroBackgroundLink && (
                            <div className="flex gap-2">
                              <LinkIcon className="w-4 h-4 text-gray-400 mt-3" />
                              <Input
                                id="heroBackgroundLink"
                                value={heroBackgroundLink}
                                onChange={(e) => setHeroBackgroundLink(e.target.value)}
                                placeholder="Enter URL (e.g., https://example.com or /collection)"
                                className="flex-1"
                              />
                            </div>
                          )}
                          <p className="text-xs text-gray-600">
                            {removeHeroBackgroundLink ? 
                              'Hero background will not be clickable' : 
                              'Where users go when clicking the hero background (optional)'}
                          </p>
                        </div>

                        <p className="text-xs text-gray-600">
                          Recommended size: 1200x800px. Will use default image if none provided.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Settings */}
            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Categories Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category Management Section */}
                  <CategoryManagementSection
                    categories={categories}
                    isAddingCategory={isAddingCategory}
                    setIsAddingCategory={setIsAddingCategory}
                    newCategoryName={newCategoryName}
                    setNewCategoryName={setNewCategoryName}
                    editingCategoryId={editingCategoryId}
                    setEditingCategoryId={setEditingCategoryId}
                    editCategoryName={editCategoryName}
                    setEditCategoryName={setEditCategoryName}
                    categoryToDelete={categoryToDelete}
                    setCategoryToDelete={setCategoryToDelete}
                    categoryManagementLoading={categoryManagementLoading}
                    handleAddCategory={() => categoryHandlers.handleAddCategory(newCategoryName)}
                    handleEditCategory={(id) => categoryHandlers.handleEditCategory(id, editCategoryName)}
                    handleDeleteCategory={categoryHandlers.handleDeleteCategory}
                    startEditCategory={startEditCategory}
                    cancelEdit={cancelEdit}
                  />

                  {/* Categories Display Settings */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="categoriesEnabled">Enable Categories Section</Label>
                      <p className="text-sm text-gray-600">Show category navigation on home page</p>
                    </div>
                    <Switch
                      id="categoriesEnabled"
                      checked={categoriesEnabled}
                      onCheckedChange={setCategoriesEnabled}
                    />
                  </div>

                  {categoriesEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="categoriesTitle">Section Title</Label>
                        <Input
                          id="categoriesTitle"
                          value={categoriesTitle}
                          onChange={(e) => setCategoriesTitle(e.target.value)}
                          placeholder="Enter section title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="categoriesLayout">Layout Style</Label>
                        <Select value={categoriesLayout} onValueChange={setCategoriesLayout}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="horizontal">Horizontal Scroll</SelectItem>
                            <SelectItem value="grid">Grid Layout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="showCategoryImages">Show Category Images</Label>
                          <p className="text-sm text-gray-600">Display images for each category</p>
                        </div>
                        <Switch
                          id="showCategoryImages"
                          checked={showCategoryImages}
                          onCheckedChange={setShowCategoryImages}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Visible Categories</Label>
                        <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-3">
                          {categories.map((category) => (
                            <div key={category.id} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`category-${category.id}`}
                                    checked={visibleCategories.includes(category.id)}
                                    onCheckedChange={() => toggleCategoryVisibility(category.id)}
                                  />
                                  <Label htmlFor={`category-${category.id}`} className="font-medium">
                                    {category.name}
                                  </Label>
                                </div>
                              </div>
                              
                              <CategoryImageManager
                                category={category}
                                showCategoryImages={showCategoryImages}
                                visibleCategories={visibleCategories}
                                categoryImageFiles={categoryImageFiles}
                                removeCategoryImages={removeCategoryImages}
                                getCurrentCategoryImage={getCurrentCategoryImage}
                                handleCategoryImageFileChange={handleCategoryImageFileChange}
                                handleRemoveCategoryImage={handleRemoveCategoryImage}
                                handleRestoreCategoryImage={handleRestoreCategoryImage}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Featured Products Settings */}
            <TabsContent value="featured" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Featured Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="featuredEnabled">Enable Featured Products</Label>
                      <p className="text-sm text-gray-600">Show featured products section on home page</p>
                    </div>
                    <Switch
                      id="featuredEnabled"
                      checked={featuredEnabled}
                      onCheckedChange={setFeaturedEnabled}
                    />
                  </div>

                  {featuredEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="featuredTitle">Section Title</Label>
                        <Input
                          id="featuredTitle"
                          value={featuredTitle}
                          onChange={(e) => setFeaturedTitle(e.target.value)}
                          placeholder="Enter section title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="featuredLimit">Number of Products</Label>
                        <Input
                          id="featuredLimit"
                          type="number"
                          min="1"
                          value={featuredLimit}
                          onChange={(e) => setFeaturedLimit(Number(e.target.value))}
                          placeholder="Enter number of products"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="featuredSortBy">Sort By</Label>
                        <Select value={featuredSortBy} onValueChange={setFeaturedSortBy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sort option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest Arrivals</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promo Banners Settings */}
            <TabsContent value="promos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Promo Banners
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="promoBannersEnabled">Enable Promo Banners</Label>
                      <p className="text-sm text-gray-600">Show promotional banners on home page</p>
                    </div>
                    <Switch
                      id="promoBannersEnabled"
                      checked={promoBannersEnabled}
                      onCheckedChange={setPromoBannersEnabled}
                    />
                  </div>

                  {promoBannersEnabled && (
                    <>
                      {promoBanners.map((banner: typeof promoBanners[0], index: number) => (
                        <div key={banner.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-5 h-5" />
                              <span className="font-medium">{banner.title}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePromoBanner(index)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`bannerTitle-${banner.id}`}>Banner Title</Label>
                              <Input
                                id={`bannerTitle-${banner.id}`}
                                value={banner.title}
                                onChange={(e) => updatePromoBanner(index, { title: e.target.value })}
                                placeholder="Enter banner title"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`bannerEnabled-${banner.id}`}>Enabled</Label>
                              <Switch
                                id={`bannerEnabled-${banner.id}`}
                                checked={banner.enabled}
                                onCheckedChange={(checked) => updatePromoBanner(index, { enabled: checked })}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-4">
                            <Label htmlFor={`bannerSubtitle-${banner.id}`}>Banner Subtitle</Label>
                            <Textarea
                              id={`bannerSubtitle-${banner.id}`}
                              value={banner.subtitle}
                              onChange={(e) => updatePromoBanner(index, { subtitle: e.target.value })}
                              placeholder="Enter banner subtitle"
                              rows={2}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <Label htmlFor={`bannerIcon-${banner.id}`}>Icon</Label>
                              <Input
                                id={`bannerIcon-${banner.id}`}
                                value={banner.icon}
                                onChange={(e) => updatePromoBanner(index, { icon: e.target.value })}
                                placeholder="Enter icon name (e.g., Truck)"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`bannerBgColor-${banner.id}`}>Background Color</Label>
                              <Input
                                id={`bannerBgColor-${banner.id}`}
                                value={banner.bgColor}
                                onChange={(e) => updatePromoBanner(index, { bgColor: e.target.value })}
                                placeholder="Enter background color (e.g., bg-blue-500)"
                              />
                            </div>
                          </div>
                          
                          {/* Banner Link */}
                          <div className="space-y-2 mt-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`bannerLink-${banner.id}`}>Banner Link (optional)</Label>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`bannerNoLink-${banner.id}`} className="text-sm">No link</Label>
                                <Switch
                                  id={`bannerNoLink-${banner.id}`}
                                  checked={!banner.link}
                                  onCheckedChange={(checked) => updatePromoBanner(index, { 
                                    link: checked ? '' : '/products' 
                                  })}
                                />
                              </div>
                            </div>
                            
                            {banner.link !== '' && (
                              <div className="flex gap-2">
                                <LinkIcon className="w-4 h-4 text-gray-400 mt-3" />
                                <Input
                                  id={`bannerLink-${banner.id}`}
                                  value={banner.link || ''}
                                  onChange={(e) => updatePromoBanner(index, { link: e.target.value })}
                                  placeholder="Enter URL (e.g., /products or https://example.com)"
                                  className="flex-1"
                                />
                              </div>
                            )}
                            <p className="text-xs text-gray-600">
                              {!banner.link ? 
                                'Banner will not be clickable' : 
                                'Where users go when clicking this banner'}
                            </p>
                          </div>
                          
                          <div className="mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updatePromoBanner(index, { enabled: !banner.enabled })}
                            >
                              {banner.enabled ? 'Disable Banner' : 'Enable Banner'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add New Banner */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={addPromoBanner}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Banner
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Newsletter Settings */}
            <TabsContent value="newsletter" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Newsletter Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="newsletterEnabled">Enable Newsletter</Label>
                      <p className="text-sm text-gray-600">Allow users to subscribe to newsletter</p>
                    </div>
                    <Switch
                      id="newsletterEnabled"
                      checked={newsletterEnabled}
                      onCheckedChange={setNewsletterEnabled}
                    />
                  </div>

                  {newsletterEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="newsletterTitle">Section Title</Label>
                        <Input
                          id="newsletterTitle"
                          value={newsletterTitle}
                          onChange={(e) => setNewsletterTitle(e.target.value)}
                          placeholder="Enter section title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newsletterSubtitle">Section Subtitle</Label>
                        <Textarea
                          id="newsletterSubtitle"
                          value={newsletterSubtitle}
                          onChange={(e) => setNewsletterSubtitle(e.target.value)}
                          placeholder="Enter section subtitle"
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/dashboard/settings' })}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
