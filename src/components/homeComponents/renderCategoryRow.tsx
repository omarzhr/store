import type { CategoriesResponse } from "@/lib/types"
import { Button } from "../ui/button"
import { Trash2 } from "lucide-react"

export function renderCategoryRow({
  category,
  startEditCategory,
  setCategoryToDelete
}: {
  category: CategoriesResponse
  startEditCategory: (category: CategoriesResponse) => void
  setCategoryToDelete: (value: string | null) => void
}) {
  return (
    <>
      <span className="flex-1 text-sm font-medium">{category.name}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => startEditCategory(category)}
        className="h-8 px-2 text-blue-600 hover:text-blue-700"
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setCategoryToDelete(category.id)}
        className="h-8 px-2 text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </>
  )
}