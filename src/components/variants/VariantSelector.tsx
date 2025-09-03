
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { 
  ProductVariantConfig, 
  SelectedVariants, 
  VariantOption,
  VariantPriceCalculation 
} from '@/lib/types/variants'
import { 
  calculateVariantPrice, 
  isVariantAvailable, 

  formatVariantSelection 
} from '@/lib/variant-utils'

interface VariantSelectorProps {
  config: ProductVariantConfig
  basePrice: number
  selectedVariants: SelectedVariants
  onVariantChange: (variants: SelectedVariants) => void
  onPriceChange?: (calculation: VariantPriceCalculation) => void
  disabled?: boolean
  className?: string
}

interface VariantOptionProps {
  option: VariantOption
  selectedValue: string | undefined
  onValueChange: (value: string) => void
  disabled?: boolean
}

function SwatchOption({ option, selectedValue, onValueChange, disabled }: VariantOptionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {option.name}
        {option.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value: any) => (
          <button
            key={value.id}
            type="button"
            disabled={disabled || value.isAvailable === false}
            onClick={() => onValueChange(value.value)}
            className={cn(
              "relative w-8 h-8 rounded-full border-2 transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selectedValue === value.value
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-gray-300 hover:border-gray-400"
            )}
            style={{
              backgroundColor: value.value.startsWith('#') ? value.value : undefined
            }}
            title={`${value.label}${value.priceModifier ? ` (+${value.priceModifier})` : ''}`}
          >
            {value.image && !value.value.startsWith('#') && (
              <img
                src={value.image}
                alt={value.label}
                className="w-full h-full rounded-full object-cover"
              />
            )}
            {value.isAvailable === false && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute" />
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedValue && (
        <div className="text-xs text-muted-foreground">
          Selected: {option.values.find((v: any) => v.value === selectedValue)?.label}
          {option.values.find((v: any) => v.value === selectedValue)?.priceModifier && (
            <span className="text-green-600 ml-1">
              (+{option.values.find((v: any) => v.value === selectedValue)?.priceModifier})
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function RadioOption({ option, selectedValue, onValueChange, disabled }: VariantOptionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {option.name}
        {option.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="space-y-2">
        {option.values.map((value: any) => (
          <label
            key={value.id}
            className={cn(
              "flex items-center space-x-3 cursor-pointer p-2 rounded-lg border transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              selectedValue === value.value
                ? "bg-primary/5 border-primary"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <input
              type="radio"
              name={option.name}
              value={value.value}
              checked={selectedValue === value.value}
              onChange={() => onValueChange(value.value)}
              disabled={disabled || value.isAvailable === false}
              className="sr-only"
            />
            <div className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selectedValue === value.value
                ? "border-primary bg-primary"
                : "border-gray-300"
            )}>
              {selectedValue === value.value && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm">{value.label}</span>
              {value.priceModifier && (
                <Badge variant="secondary" className="text-xs">
                  +{value.priceModifier}
                </Badge>
              )}
            </div>
            {value.isAvailable === false && (
              <Badge variant="destructive" className="text-xs">
                Unavailable
              </Badge>
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

function SelectOption({ option, selectedValue, onValueChange, disabled }: VariantOptionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {option.name}
        {option.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={selectedValue || ''}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-11">
          <SelectValue 
            placeholder={`Select ${option.name.toLowerCase()}`} 
          />
        </SelectTrigger>
        <SelectContent>
          {option.values.map((value: any) => (
            <SelectItem
              key={value.id}
              value={value.value}
              disabled={value.isAvailable === false}
              className="flex items-center justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <span>{value.label}</span>
                {value.priceModifier && (
                  <span className="text-green-600 text-sm ml-2">
                    +{value.priceModifier}
                  </span>
                )}
                {value.isAvailable === false && (
                  <span className="text-red-500 text-xs ml-2">
                    (Unavailable)
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function VariantSelector({
  config,
  basePrice,
  selectedVariants,
  onVariantChange,
  onPriceChange,
  disabled = false,
  className
}: VariantSelectorProps) {
  const handleVariantChange = (optionName: string, value: string) => {
    const newSelection = {
      ...selectedVariants,
      [optionName]: value
    }
    onVariantChange(newSelection)
    
    // Calculate and notify price change immediately if callback provided
    if (onPriceChange) {
      const newPriceCalculation = calculateVariantPrice(basePrice, newSelection, config)
      onPriceChange(newPriceCalculation)
    }
  }

  // Calculate price for current selection
  calculateVariantPrice(basePrice, selectedVariants, config)

  const availability = isVariantAvailable(selectedVariants, config)

  if (!config.options || config.options.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-6", className)}>
      {config.options.map((option: any) => {
        const selectedValue = selectedVariants[option.name]
        
        const commonProps = {
          option,
          selectedValue,
          onValueChange: (value: string) => handleVariantChange(option.name, value),
          disabled
        }

        switch (option.type) {
          case 'swatch':
            return <SwatchOption key={option.name} {...commonProps} />
          case 'radio':
            return <RadioOption key={option.name} {...commonProps} />
          case 'select':
          default:
            return <SelectOption key={option.name} {...commonProps} />
        }
      })}

      {/* Selection Summary */}
      {Object.keys(selectedVariants).length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm font-medium text-gray-700 mb-1">
            Selected Configuration:
          </div>
          <div className="text-sm text-gray-600">
            {formatVariantSelection(selectedVariants, config)}
          </div>
          {!availability.isAvailable && (
            <div className="text-sm text-red-600 mt-2">
              ⚠️ {availability.reason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VariantSelector