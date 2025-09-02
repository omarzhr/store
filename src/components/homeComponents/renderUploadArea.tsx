import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Upload } from "lucide-react"

export 
function renderUploadArea({
  id,
  selectedFile,
  onFileChange,
  accept
}: {
  id: string
  selectedFile?: File | null
  onFileChange: (file: File | null) => void
  accept: string
}) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6 hover:border-gray-400 transition-colors">
      <Input
        id={id}
        type="file"
        accept={accept}
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />
      <Label
        htmlFor={id}
        className="flex flex-col items-center justify-center cursor-pointer space-y-2 min-h-[80px] lg:min-h-[100px]"
      >
        <Upload className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
        <div className="text-center">
          <span className="text-sm lg:text-base text-gray-600 font-medium">
            {selectedFile ? selectedFile.name : 'Click to upload image'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG up to 5MB
          </p>
        </div>
      </Label>
    </div>
  )
}