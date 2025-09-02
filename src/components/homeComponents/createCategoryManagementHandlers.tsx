import pb from "@/lib/db"
import { Collections } from "@/lib/types"

export function createCategoryManagementHandlers(
  setError: (error: string | null) => void,
  setCategoryManagementLoading: (loading: boolean) => void,
  setVisibleCategories: (fn: (prev: string[]) => string[]) => void,
  setNewCategoryName: (name: string) => void,
  setIsAddingCategory: (adding: boolean) => void,
  setEditingCategoryId: (id: string | null) => void,
  setEditCategoryName: (name: string) => void,
  setCategoryToDelete: (id: string | null) => void
) {
  const handleAddCategory = async (newCategoryName: string) => {
    if (!newCategoryName.trim()) {
      setError('Category name is required')
      return
    }

    setCategoryManagementLoading(true)
    try {
      const newCategory = await pb.collection(Collections.Categories).create({
        name: newCategoryName.trim()
      })
      
      setVisibleCategories(prev => [...prev, newCategory.id])
      setNewCategoryName('')
      setIsAddingCategory(false)
      setError(null)
      
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to create category:', err)
      setError(err.message || 'Failed to create category')
    } finally {
      setCategoryManagementLoading(false)
    }
  }

  const handleEditCategory = async (categoryId: string, editCategoryName: string) => {
    if (!editCategoryName.trim()) {
      setError('Category name is required')
      return
    }

    setCategoryManagementLoading(true)
    try {
      await pb.collection(Collections.Categories).update(categoryId, {
        name: editCategoryName.trim()
      })
      
      setEditingCategoryId(null)
      setEditCategoryName('')
      setError(null)
      
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to update category:', err)
      setError(err.message || 'Failed to update category')
    } finally {
      setCategoryManagementLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    setCategoryManagementLoading(true)
    try {
      await pb.collection(Collections.Categories).delete(categoryId)
      
      setVisibleCategories(prev => prev.filter(id => id !== categoryId))
      setCategoryToDelete(null)
      setError(null)
      
      window.location.reload()
    } catch (err: any) {
      console.error('Failed to delete category:', err)
      setError(err.message || 'Failed to delete category')
    } finally {
      setCategoryManagementLoading(false)
    }
  }

  return { handleAddCategory, handleEditCategory, handleDeleteCategory }
}