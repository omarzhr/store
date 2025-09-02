import { Label } from "@/components/ui/label";

import { renderRecommendedSize } from "./renderRecommendedSize";
import { renderRemovalStatus } from "./renderRemovalStatus";
import { renderSelectedFilePreview } from "./renderSelectedFilePreview";
import { renderCurrentFile } from "./renderCurrentFile";
import { renderUploadArea } from "./renderUploadArea";

export function FileUploadArea({
  id,
  label,
  currentFile,
  selectedFile,
  onFileChange,
  onRemoveFile,
  removeCurrentFile,
  onRestoreCurrentFile,
  accept = "image/*",
  recommendedSize
}: {
  id: string
  label: string
  currentFile?: { url: string; name: string } | null
  selectedFile?: File | null
  onFileChange: (file: File | null) => void
  onRemoveFile?: () => void
  removeCurrentFile?: boolean
  onRestoreCurrentFile?: () => void
  accept?: string
  recommendedSize?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      
      {renderCurrentFile({ currentFile, removeCurrentFile, onRemoveFile, label })}
      {renderUploadArea({ id, selectedFile, onFileChange, accept })}
      {renderSelectedFilePreview({ selectedFile, onFileChange })}
      {renderRemovalStatus({ removeCurrentFile, onRestoreCurrentFile })}
      {recommendedSize && renderRecommendedSize(recommendedSize)}
    </div>
  )
}