import { ImageIcon, X } from "lucide-react"
import { Button } from "../ui/button"

export function renderSelectedFilePreview({
  selectedFile,
  onFileChange
}: {
  selectedFile?: File | null
  onFileChange: (file: File | null) => void
}) {
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
        onClick={() => onFileChange(null)}
        className="text-green-600 hover:text-green-700 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}