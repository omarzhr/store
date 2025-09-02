import type { StoresResponse } from "@/lib/types"
import { FileUploadArea } from "./FileUploadArea"
import pb from "@/lib/db"
import { Label } from "../ui/label"
import { ImageIcon } from "lucide-react"
import { Input } from "../ui/input"

export function renderLogoTypeSelector({
  logoType,
  setLogoType
}: {
  logoType: 'upload' | 'url'
  setLogoType: (type: 'upload' | 'url') => void
}) {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => setLogoType('upload')}
        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          logoType === 'upload' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Upload File
      </button>
      <button
        type="button"
        onClick={() => setLogoType('url')}
        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          logoType === 'url' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Image URL
      </button>
    </div>
  )
}

export function renderLogoUpload({
  storeSettings,
  removeCurrentLogo,
  handleRemoveCurrentLogo,
  logoFile,
  setLogoFile
}: {
  storeSettings: StoresResponse | null
  removeCurrentLogo: boolean
  handleRemoveCurrentLogo: () => void
  logoFile: File | null
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setLogoFile: (file: File | null) => void
}) {
  return (
    <FileUploadArea
      id="logo"
      label="Logo"
      currentFile={storeSettings?.logo ? {
        url: pb.files.getUrl(storeSettings, storeSettings.logo, { thumb: '100x100' }),
        name: storeSettings.logo
      } : null}
      selectedFile={logoFile}
      onFileChange={setLogoFile}
      onRemoveFile={handleRemoveCurrentLogo}
      removeCurrentFile={removeCurrentLogo}
      onRestoreCurrentFile={() => setLogoFile(null)}
    />
  )
}

export function renderLogoUrlInput({
  logoUrl,
  setLogoUrl
}: {
  logoUrl: string
  setLogoUrl: (url: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo Image URL</Label>
        <div className="flex gap-2">
          <ImageIcon className="w-4 h-4 text-gray-400 mt-3" />
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Enter image URL (e.g., https://example.com/logo.png)"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-gray-600">
          Use a direct link to an image file (PNG, JPG, SVG)
        </p>
      </div>

      {logoUrl.trim() && renderLogoUrlPreview(logoUrl)}
    </div>
  )
}

export function renderLogoUrlPreview(logoUrl: string) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <p className="text-sm font-medium mb-2">Logo Preview:</p>
      <div className="flex items-center gap-3">
        <img
          src={logoUrl}
          alt="Logo preview"
          className="w-16 h-16 object-contain rounded border bg-white"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            ;(e.currentTarget.nextElementSibling as HTMLElement)!.style.display = 'block'
          }}
        />
        <div className="hidden text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          ❌ Failed to load image. Please check the URL.
        </div>
        <div>
          <p className="text-sm text-gray-600">Logo from URL</p>
          <p className="text-xs text-gray-500 break-all">{logoUrl}</p>
        </div>
      </div>
    </div>
  )
}