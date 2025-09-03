import type { CategoriesResponse } from "@/lib/types"
import { Plus } from "lucide-react"
import { renderDeleteConfirmationDialog } from "./renderDeleteConfirmationDialog"
import { renderCategoriesList } from "./renderCategoriesList"
import { renderAddCategoryForm } from "./renderAddCategoryForm"

export function CategoryManagementSection({
  categories,
  isAddingCategory,
  setIsAddingCategory,
  newCategoryName,
  setNewCategoryName,
  editingCategoryId,

  editCategoryName,
  setEditCategoryName,
  categoryToDelete,
  setCategoryToDelete,
  categoryManagementLoading,
  handleAddCategory,
  handleEditCategory,
  handleDeleteCategory,
  startEditCategory,
  cancelEdit
}: {
  categories: CategoriesResponse[]
  isAddingCategory: boolean
  setIsAddingCategory: (value: boolean) => void
  newCategoryName: string
  setNewCategoryName: (value: string) => void
  editingCategoryId: string | null
  setEditingCategoryId: (value: string | null) => void
  editCategoryName: string
  setEditCategoryName: (value: string) => void
  categoryToDelete: string | null
  setCategoryToDelete: (value: string | null) => void
  categoryManagementLoading: boolean
  handleAddCategory: () => void
  handleEditCategory: (categoryId: string) => void
  handleDeleteCategory: (categoryId: string) => void
  startEditCategory: (category: CategoriesResponse) => void
  cancelEdit: () => void
}) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Manage Categories
      </h4>
      
      {renderAddCategoryForm({
        isAddingCategory,
        setIsAddingCategory,
        newCategoryName,
        setNewCategoryName,
        categoryManagementLoading,
        handleAddCategory
      })}

      {renderCategoriesList({
        categories,
        editingCategoryId,
        editCategoryName,
        setEditCategoryName,
        categoryManagementLoading,
        handleEditCategory,
        cancelEdit,
        startEditCategory,
        setCategoryToDelete
      })}

      {renderDeleteConfirmationDialog({
        categoryToDelete,
        setCategoryToDelete,
        categoryManagementLoading,
        handleDeleteCategory
      })}
    </div>
  )
}