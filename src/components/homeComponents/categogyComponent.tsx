import type { CategoriesResponse } from "@/lib/types"
import { Button } from "../ui/button"
import { Trash2, Upload, ImageIcon, X } from "lucide-react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export function CategoryImageManager({
  category,
  showCategoryImages,
  visibleCategories,
  categoryImageFiles,
  removeCategoryImages,
  getCurrentCategoryImage,
  handleCategoryImageFileChange,
  handleRemoveCategoryImage,
  handleRestoreCategoryImage
}: {
  category: CategoriesResponse
  showCategoryImages: boolean
  visibleCategories: string[]
  categoryImageFiles: Record<string, File>
  removeCategoryImages: string[]
  getCurrentCategoryImage: (categoryId: string) => string | null
  handleCategoryImageFileChange: (categoryId: string, file: File | null) => void
  handleRemoveCategoryImage: (categoryId: string) => void
  handleRestoreCategoryImage: (categoryId: string) => void
}) {
  if (!showCategoryImages || !visibleCategories.includes(category.id)) {
    return null
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Category Image</Label>
      
      {renderCurrentCategoryImage({
        category,
        getCurrentCategoryImage,
        removeCategoryImages,
        handleRemoveCategoryImage
      })}

      {renderCategoryImageUpload({
        category,
        categoryImageFiles,
        handleCategoryImageFileChange
      })}

      {renderCategoryImagePreview({
        category,
        categoryImageFiles,
        handleCategoryImageFileChange
      })}

      {renderCategoryImageRemovalStatus({
        category,
        removeCategoryImages,
        handleRestoreCategoryImage
      })}
      
      <p className="text-xs lg:text-sm text-gray-500">
        Upload an image file for this category. Recommended size: 200x200px for best results.
      </p>
    </div>
  )
}

export function renderCurrentCategoryImage({
  category,
  getCurrentCategoryImage,
  removeCategoryImages,
  handleRemoveCategoryImage
}: {
  category: CategoriesResponse
  getCurrentCategoryImage: (categoryId: string) => string | null
  removeCategoryImages: string[]
  handleRemoveCategoryImage: (categoryId: string) => void
}) {
  const currentImage = getCurrentCategoryImage(category.id)
  if (!currentImage || removeCategoryImages.includes(category.id)) {
    return null
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <img
          src={currentImage}
          alt={`Current ${category.name} image`}
          className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded border bg-white"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Current category image</p>
          <p className="text-xs text-gray-600 truncate">{category.name}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleRemoveCategoryImage(category.id)}
          className="text-red-600 hover:text-red-700 shrink-0"
        >
          <Trash2 className="w-4 h-4 lg:mr-2" />
          <span className="hidden lg:inline">Remove</span>
        </Button>
      </div>
    </div>
  )
}

export function renderCategoryImageUpload({
  category,
  categoryImageFiles,
  handleCategoryImageFileChange
}: {
  category: CategoriesResponse
  categoryImageFiles: Record<string, File>
  handleCategoryImageFileChange: (categoryId: string, file: File | null) => void
}) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6 hover:border-gray-400 transition-colors">
      <Input
        id={`categoryImageFile-${category.id}`}
        type="file"
        accept="image/*"
        onChange={(e) => handleCategoryImageFileChange(category.id, e.target.files?.[0] || null)}
        className="hidden"
      />
      <Label
        htmlFor={`categoryImageFile-${category.id}`}
        className="flex flex-col items-center justify-center cursor-pointer space-y-2 min-h-[80px] lg:min-h-[100px]"
      >
        <Upload className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
        <div className="text-center">
          <span className="text-sm lg:text-base text-gray-600 font-medium">
            {categoryImageFiles[category.id] ? 
              categoryImageFiles[category.id].name : 
              'Click to upload image'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG up to 5MB
          </p>
        </div>
      </Label>
    </div>
  )
}

export function renderCategoryImagePreview({
  category,
  categoryImageFiles,
  handleCategoryImageFileChange
}: {
  category: CategoriesResponse
  categoryImageFiles: Record<string, File>
  handleCategoryImageFileChange: (categoryId: string, file: File | null) => void
}) {
  const selectedFile = categoryImageFiles[category.id]
  if (!selectedFile) return null

  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
        <ImageIcon className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm lg:text-base font-medium text-green-800">
          New image selected
        </p>
        <p className="text-xs lg:text-sm text-green-700 truncate">
          {selectedFile.name}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleCategoryImageFileChange(category.id, null)}
        className="text-green-600 hover:text-green-700 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function renderCategoryImageRemovalStatus({
  category,
  removeCategoryImages,
  handleRestoreCategoryImage
}: {
  category: CategoriesResponse
  removeCategoryImages: string[]
  handleRestoreCategoryImage: (categoryId: string) => void
}) {
  if (!removeCategoryImages.includes(category.id)) return null

  return (
    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
        <Trash2 className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm lg:text-base font-medium text-red-800">
          Image will be removed
        </p>
        <p className="text-xs lg:text-sm text-red-700">
          This action will be applied when you save
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleRestoreCategoryImage(category.id)}
        className="text-red-600 hover:text-red-700 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}