import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import type { ProductsResponse } from '@/lib/types'
import pb from '@/lib/db'

interface ImageGalleryProps {
  product: ProductsResponse
}

export function ImageGallery({ product }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const galleryRef = useRef<HTMLImageElement>(null)

  // Get product images from PocketBase
  const getProductImages = () => {
    const images: string[] = []
    if (product.featured_image) {
      images.push(pb.files.getUrl(product, product.featured_image, { thumb: '800x800' }))
    }
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imageUrl = pb.files.getUrl(product, image, { thumb: '800x800' })
        // Avoid duplicates if featured_image is also in images array
        if (!images.includes(imageUrl)) {
          images.push(imageUrl)
        }
      })
    }
    // Fallback image if no images
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop')
    }
    return images
  }

  const images = getProductImages()

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextImage()
    }
    if (isRightSwipe) {
      prevImage()
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <img
          ref={galleryRef}
          src={images[currentImageIndex]}
          alt={`Product image ${currentImageIndex + 1}`}
          className={`w-full h-full object-cover transition-transform duration-300 cursor-pointer lg:cursor-zoom-in ${
            isZoomed ? 'scale-150 lg:scale-200' : 'scale-100'
          }`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={toggleZoom}
        />
        
        {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg hidden lg:flex"
          onClick={prevImage}
          disabled={images.length <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-lg hidden lg:flex"
          onClick={nextImage}
          disabled={images.length <= 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Zoom Icon - Desktop only */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 bg-white/80 hover:bg-white shadow-lg hidden lg:flex"
          onClick={toggleZoom}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {/* Image Counter */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`flex-shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-md overflow-hidden border-2 transition-all duration-200 ${
              index === currentImageIndex
                ? 'border-primary shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img
              src={image}
              alt={`Thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Mobile Swipe Indicator */}
      <div className="flex justify-center gap-1 lg:hidden">
        {images.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentImageIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
