import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";

export function renderCurrentFile({
  currentFile,
  removeCurrentFile,
  onRemoveFile,
  label
}: {
  currentFile?: { url: string; name: string } | null
  removeCurrentFile?: boolean
  onRemoveFile?: () => void
  label: string
}) {
  if (!currentFile || removeCurrentFile) return null

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={currentFile.url}
            alt={`Current ${label.toLowerCase()}`}
            className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded border bg-white"
          />
          <div>
            <p className="text-sm font-medium">Current {label.toLowerCase()}</p>
            <p className="text-xs text-gray-600">{currentFile.name}</p>
          </div>
        </div>
        {onRemoveFile && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemoveFile}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>
    </div>
  )
}