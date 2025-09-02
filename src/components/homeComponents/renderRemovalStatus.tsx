import { Trash2, X } from "lucide-react"
import { Button } from "../ui/button"

export function renderRemovalStatus({
  removeCurrentFile,
  onRestoreCurrentFile
}: {
  removeCurrentFile?: boolean
  onRestoreCurrentFile?: () => void
}) {
  if (!removeCurrentFile || !onRestoreCurrentFile) return null

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
        onClick={onRestoreCurrentFile}
        className="text-red-600 hover:text-red-700 shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}