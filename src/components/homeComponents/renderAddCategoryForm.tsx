import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { Input } from "../ui/input"

export function renderAddCategoryForm({
  isAddingCategory,
  setIsAddingCategory,
  newCategoryName,
  setNewCategoryName,
  categoryManagementLoading,
  handleAddCategory
}: {
  isAddingCategory: boolean
  setIsAddingCategory: (value: boolean) => void
  newCategoryName: string
  setNewCategoryName: (value: string) => void
  categoryManagementLoading: boolean
  handleAddCategory: () => void
}) {
  if (!isAddingCategory) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsAddingCategory(true)}
        className="mb-4"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Category
      </Button>
    )
  }

  return (
    <div className="mb-4 p-3 bg-white rounded-lg border space-y-3">
      <Label htmlFor="newCategoryName">New Category Name</Label>
      <div className="flex gap-2">
        <Input
          id="newCategoryName"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Enter category name"
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddCategory}
          disabled={categoryManagementLoading || !newCategoryName.trim()}
        >
          {categoryManagementLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            'Add'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setIsAddingCategory(false)
            setNewCategoryName('')
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}