import { Badge } from '@/components/ui/badge'
import type { SelectedVariants, ProductVariantConfig } from '@/lib/types/variants'
import { formatVariantSelection } from '@/lib/variant-utils'

interface VariantDisplayProps {
  selectedVariants: SelectedVariants | null | undefined
  config?: ProductVariantConfig | null
  className?: string
  compact?: boolean
  showLabel?: boolean
}

export function VariantDisplay({ 
  selectedVariants, 
  config, 
  className = '',
  compact = false,
  showLabel = true
}: VariantDisplayProps) {
  // Return null if no variants are selected
  if (!selectedVariants || Object.keys(selectedVariants).length === 0) {
    return null
  }

  // If we have config, use it for better formatting
  if (config) {
    const formattedSelection = formatVariantSelection(selectedVariants, config)
    
    if (compact) {
      return (
        <div className={`text-xs text-gray-600 ${className}`}>
          {showLabel && <span className="font-medium">Variant: </span>}
          {formattedSelection}
        </div>
      )
    }

    return (
      <div className={`space-y-1 ${className}`}>
        {showLabel && (
          <span className="text-xs font-medium text-gray-700">Selected Options:</span>
        )}
        <div className="flex flex-wrap gap-1">
          {Object.entries(selectedVariants).map(([optionName, value]) => {
            const option = config.options.find((o: any) => o.name === optionName)
            const variantValue = option?.values.find((v: any) => v.value === value)
            const displayLabel = variantValue?.label || value
            
            return (
              <Badge 
                key={optionName} 
                variant="secondary" 
                className="text-xs px-2 py-0.5"
              >
                {option?.name}: {displayLabel}
              </Badge>
            )
          })}
        </div>
      </div>
    )
  }

  // Fallback display without config
  const entries = Object.entries(selectedVariants)
  
  if (compact) {
    const formattedEntries = entries.map(([key, value]) => `${key}: ${value}`).join(', ')
    return (
      <div className={`text-xs text-gray-600 ${className}`}>
        {showLabel && <span className="font-medium">Variant: </span>}
        {formattedEntries}
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <span className="text-xs font-medium text-gray-700">Selected Options:</span>
      )}
      <div className="flex flex-wrap gap-1">
        {entries.map(([key, value]) => (
          <Badge 
            key={key} 
            variant="secondary" 
            className="text-xs px-2 py-0.5"
          >
            {key}: {String(value)}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default VariantDisplay