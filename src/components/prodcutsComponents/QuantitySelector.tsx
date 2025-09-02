import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  quantity: number
  maxQuantity: number
  onQuantityChange: (quantity: number) => void
  disabled?: boolean
}

export function QuantitySelector({
  quantity,
  maxQuantity,
  onQuantityChange,
  disabled = false
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (quantity < maxQuantity) {
      onQuantityChange(quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    if (!isNaN(value) && value >= 1 && value <= maxQuantity) {
      onQuantityChange(value)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Quantity</h4>
        <span className="text-xs text-gray-500">
          {maxQuantity > 0 ? `${maxQuantity} available` : 'Out of stock'}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
            onClick={handleDecrease}
            disabled={disabled || quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <input
            type="number"
            value={quantity}
            onChange={handleInputChange}
            disabled={disabled}
            min="1"
            max={maxQuantity}
            className="w-16 h-10 text-center text-sm font-medium border-0 border-l border-r border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50 disabled:text-gray-500"
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-none border-0 hover:bg-gray-100"
            onClick={handleIncrease}
            disabled={disabled || quantity >= maxQuantity}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Stock warning */}
        {maxQuantity > 0 && maxQuantity <= 5 && (
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs">
            Low Stock
          </Badge>
        )}
      </div>
      
      {/* Quantity validation message */}
      {quantity >= maxQuantity && maxQuantity > 0 && (
        <p className="text-xs text-orange-600">
          Maximum quantity available: {maxQuantity}
        </p>
      )}
    </div>
  )
}

