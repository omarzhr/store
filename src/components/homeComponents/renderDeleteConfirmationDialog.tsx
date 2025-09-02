import { Button } from "../ui/button"

export function renderDeleteConfirmationDialog({
  categoryToDelete,
  setCategoryToDelete,
  categoryManagementLoading,
  handleDeleteCategory
}: {
  categoryToDelete: string | null
  setCategoryToDelete: (value: string | null) => void
  categoryManagementLoading: boolean
  handleDeleteCategory: (categoryId: string) => void
}) {
  if (!categoryToDelete) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Category</h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this category? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCategoryToDelete(null)}
            disabled={categoryManagementLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleDeleteCategory(categoryToDelete)}
            disabled={categoryManagementLoading}
          >
            {categoryManagementLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}