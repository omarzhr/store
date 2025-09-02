import type { CategoriesResponse } from "@/lib/types"
import { renderCategoryRow } from "./renderCategoryRow"
import { renderEditingCategoryRow } from "./renderEditingCategoryRow"
import { Label } from "@radix-ui/react-dropdown-menu"

export function renderCategoriesList({
  categories,
  editingCategoryId,
  editCategoryName,
  setEditCategoryName,
  categoryManagementLoading,
  handleEditCategory,
  cancelEdit,
  startEditCategory,
  setCategoryToDelete
}: {
  categories: CategoriesResponse[]
  editingCategoryId: string | null
  editCategoryName: string
  setEditCategoryName: (value: string) => void
  categoryManagementLoading: boolean
  handleEditCategory: (categoryId: string) => void
  cancelEdit: () => void
  startEditCategory: (category: CategoriesResponse) => void
  setCategoryToDelete: (value: string | null) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Existing Categories</Label>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2 p-2 bg-white rounded border">
            {editingCategoryId === category.id ? 
              renderEditingCategoryRow({
                categoryId: category.id,
                editCategoryName,
                setEditCategoryName,
                categoryManagementLoading,
                handleEditCategory,
                cancelEdit
              }) :
              renderCategoryRow({
                category,
                startEditCategory,
                setCategoryToDelete
              })
            }
          </div>
        ))}
      </div>
    </div>
  )
}