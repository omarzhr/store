import { Button } from "../ui/button"
import { Input } from "../ui/input"

export function renderEditingCategoryRow({
  categoryId,
  editCategoryName,
  setEditCategoryName,
  categoryManagementLoading,
  handleEditCategory,
  cancelEdit
}: {
  categoryId: string
  editCategoryName: string
  setEditCategoryName: (value: string) => void
  categoryManagementLoading: boolean
  handleEditCategory: (categoryId: string) => void
  cancelEdit: () => void
}) {
  return (
    <>
      <Input
        value={editCategoryName}
        onChange={(e) => setEditCategoryName(e.target.value)}
        className="flex-1 h-8"
        onKeyDown={(e) => e.key === 'Enter' && handleEditCategory(categoryId)}
      />
      <Button
        type="button"
        size="sm"
        onClick={() => handleEditCategory(categoryId)}
        disabled={categoryManagementLoading || !editCategoryName.trim()}
        className="h-8 px-2"
      >
        {categoryManagementLoading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
        ) : (
          'Save'
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={cancelEdit}
        className="h-8 px-2"
      >
        Cancel
      </Button>
    </>
  )
}