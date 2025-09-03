import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { 
  Plus, 
  Trash2, 
  GripVertical, 
  AlertTriangle,
  Eye,
  EyeOff,
  Palette,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { 
  ProductVariantConfig, 
  VariantOption, 
  VariantValue, 
  PricingRule 
} from '@/lib/types/variants'
import { validateVariantConfig } from '@/lib/variant-utils'

interface VariantConfigProps {
  config: ProductVariantConfig | null
  onChange: (config: ProductVariantConfig) => void
  basePrice: number
  currency?: string
  className?: string
}

interface VariantValueEditorProps {
  value: VariantValue
  onChange: (value: VariantValue) => void
  onRemove: () => void
  optionType: 'select' | 'radio' | 'swatch'
}

function VariantValueEditor({ value, onChange, onRemove, optionType }: VariantValueEditorProps) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-gray-50">
      <div className="col-span-1">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="col-span-3">
        <Input
          placeholder="Label (e.g., Large)"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      
      <div className="col-span-3">
        <Input
          placeholder="Value (e.g., L)"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      
      <div className="col-span-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Price +/-"
          value={value.priceModifier || ''}
          onChange={(e) => onChange({ 
            ...value, 
            priceModifier: e.target.value ? Number(e.target.value) : undefined 
          })}
          className="h-8 text-sm"
        />
      </div>
      
      {optionType === 'swatch' && (
        <div className="col-span-1">
          <div className="flex items-center gap-1">
            {value.value.startsWith('#') ? (
              <Palette className="h-4 w-4" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            <Input
              type={value.value.startsWith('#') ? 'color' : 'url'}
              value={value.value.startsWith('#') ? value.value : (value.image || '')}
              onChange={(e) => {
                if (value.value.startsWith('#')) {
                  onChange({ ...value, value: e.target.value })
                } else {
                  onChange({ ...value, image: e.target.value })
                }
              }}
              className="h-8 w-8 p-0 border-none"
            />
          </div>
        </div>
      )}
      
      <div className="col-span-1 flex items-center gap-1">
        <Switch
          checked={value.isDefault || false}
          onCheckedChange={(checked) => onChange({ ...value, isDefault: checked })}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

interface VariantOptionEditorProps {
  option: VariantOption
  onChange: (option: VariantOption) => void
  onRemove: () => void
}

function VariantOptionEditor({ option, onChange, onRemove }: VariantOptionEditorProps) {
  const addValue = () => {
    const newValue: VariantValue = {
      id: `${option.name.toLowerCase()}-${Date.now()}`,
      label: '',
      value: '',
      isAvailable: true
    }
    
    onChange({
      ...option,
      values: [...option.values, newValue]
    })
  }

  const updateValue = (index: number, updatedValue: VariantValue) => {
    const newValues = [...option.values]
    newValues[index] = updatedValue
    onChange({ ...option, values: newValues })
  }

  const removeValue = (index: number) => {
    const newValues = option.values.filter((_: any, i: number) => i !== index)
    onChange({ ...option, values: newValues })
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div>
                <Label className="text-xs">Option Name</Label>
                <Input
                  placeholder="e.g., Size, Color"
                  value={option.name}
                  onChange={(e) => onChange({ ...option, name: e.target.value })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Display Type</Label>
                <Select
                  value={option.type}
                  onValueChange={(value: 'select' | 'radio' | 'swatch') => 
                    onChange({ ...option, type: value })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="swatch">Color/Image Swatches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={option.required}
                    onCheckedChange={(checked) => onChange({ ...option, required: checked })}
                  />
                  <Label className="text-xs">Required</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="h-6 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Values</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addValue}
              className="h-7"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Value
            </Button>
          </div>
          
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-3">
            <div className="col-span-1"></div>
            <div className="col-span-3">Label</div>
            <div className="col-span-3">Value</div>
            <div className="col-span-2">Price Modifier</div>
            {option.type === 'swatch' && <div className="col-span-1">Color/Image</div>}
            <div className="col-span-1">Default/Actions</div>
          </div>
          
          <div className="space-y-2">
            {option.values.map((value, index) => (
              <VariantValueEditor
                key={value.id}
                value={value}
                onChange={(updatedValue) => updateValue(index, updatedValue)}
                onRemove={() => removeValue(index)}
                optionType={option.type}
              />
            ))}
          </div>
          
          {option.values.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed rounded-lg">
              No values added yet. Click "Add Value" to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface PricingRuleEditorProps {
  rule: PricingRule
  onChange: (rule: PricingRule) => void
  onRemove: () => void
  availableOptions: VariantOption[]
}

function PricingRuleEditor({ rule, onChange, onRemove, availableOptions }: PricingRuleEditorProps) {
  const addCondition = () => {
    if (availableOptions.length === 0) return
    
    const firstOption = availableOptions[0]
    const firstValue = firstOption.values[0]
    
    if (firstValue) {
      onChange({
        ...rule,
        conditions: {
          ...rule.conditions,
          [firstOption.name]: firstValue.value
        }
      })
    }
  }

  const updateCondition = (optionName: string, value: string) => {
    onChange({
      ...rule,
      conditions: {
        ...rule.conditions,
        [optionName]: value
      }
    })
  }

  const removeCondition = (optionName: string) => {
    const newConditions = { ...rule.conditions }
    delete newConditions[optionName]
    onChange({ ...rule, conditions: newConditions })
  }

  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Pricing Rule</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Price Modifier</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="10.00"
                value={rule.priceModifier}
                onChange={(e) => onChange({ 
                  ...rule, 
                  priceModifier: Number(e.target.value) || 0 
                })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={rule.type}
                onValueChange={(value: 'fixed' | 'percentage') => 
                  onChange({ ...rule, type: value })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description (Optional)</Label>
              <Input
                placeholder="e.g., XL size surcharge"
                value={rule.description || ''}
                onChange={(e) => onChange({ ...rule, description: e.target.value })}
                className="h-8"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Conditions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="h-6"
                disabled={availableOptions.length === 0}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Condition
              </Button>
            </div>
            
            <div className="space-y-2">
              {Object.entries(rule.conditions).map(([optionName, value]) => {
                const option = availableOptions.find(o => o.name === optionName)
                if (!option) return null
                
                return (
                  <div key={optionName} className="flex items-center gap-2">
                    <Badge variant="outline">{optionName}</Badge>
                    <span className="text-xs">=</span>
                    <Select
                      value={value}
                      onValueChange={(newValue: string) => updateCondition(optionName, newValue)}
                    >
                      <SelectTrigger className="h-7 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {option.values.map((optionValue: any) => (
                          <SelectItem key={optionValue.id} value={optionValue.value}>
                            {optionValue.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(optionName)}
                      className="h-6 w-6 p-0 text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
            
            {Object.keys(rule.conditions).length === 0 && (
              <div className="text-center py-2 text-gray-500 text-sm border border-dashed rounded">
                No conditions set. This rule will apply to all variants.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VariantConfig({ 
  config, 
  onChange, 
  basePrice: _basePrice,
  currency: _currency = 'DH',
  className 
}: VariantConfigProps) {
  const [internalConfig, setInternalConfig] = useState<ProductVariantConfig>(
    config || { options: [], pricingRules: [] }
  )
  const [showPreview, setShowPreview] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    const validation = validateVariantConfig(internalConfig)
    setValidationErrors(validation.errors)
    
    if (validation.isValid) {
      onChange(internalConfig)
    }
  }, [internalConfig, onChange])

  const addOption = () => {
    const newOption: VariantOption = {
      name: '',
      type: 'select',
      required: false,
      values: []
    }
    
    setInternalConfig({
      ...internalConfig,
      options: [...internalConfig.options, newOption]
    })
  }

  const updateOption = (index: number, updatedOption: VariantOption) => {
    const newOptions = [...internalConfig.options]
    newOptions[index] = updatedOption
    setInternalConfig({ ...internalConfig, options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = internalConfig.options.filter((_: any, i: number) => i !== index)
    setInternalConfig({ ...internalConfig, options: newOptions })
  }

  const addPricingRule = () => {
    const newRule: PricingRule = {
      conditions: {},
      priceModifier: 0,
      type: 'fixed'
    }
    
    setInternalConfig({
      ...internalConfig,
      pricingRules: [...(internalConfig.pricingRules || []), newRule]
    })
  }

  const updatePricingRule = (index: number, updatedRule: PricingRule) => {
    const newRules = [...(internalConfig.pricingRules || [])]
    newRules[index] = updatedRule
    setInternalConfig({ ...internalConfig, pricingRules: newRules })
  }

  const removePricingRule = (index: number) => {
    const newRules = (internalConfig.pricingRules || []).filter((_: any, i: number) => i !== index)
    setInternalConfig({ ...internalConfig, pricingRules: newRules })
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Product Variants
        </h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Validation Errors:</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Variant Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Variant Options</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>

        {internalConfig.options.map((option: any, index: number) => (
          <VariantOptionEditor
            key={index}
            option={option}
            onChange={(updatedOption) => updateOption(index, updatedOption)}
            onRemove={() => removeOption(index)}
          />
        ))}

        {internalConfig.options.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            <div className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No variant options configured</p>
            <p className="text-xs text-gray-400 mb-3">
              Add options like Size, Color, Material, etc.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Option
            </Button>
          </div>
        )}
      </div>

      {/* Pricing Rules */}
      {internalConfig.options.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Advanced Pricing Rules</Label>
              <p className="text-xs text-gray-500 mt-1">
                Create complex pricing based on variant combinations
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPricingRule}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {(internalConfig.pricingRules || []).map((rule: any, index: number) => (
            <PricingRuleEditor
              key={index}
              rule={rule}
              onChange={(updatedRule) => updatePricingRule(index, updatedRule)}
              onRemove={() => removePricingRule(index)}
              availableOptions={internalConfig.options}
            />
          ))}
        </div>
      )}

      {/* Preview Section */}
      {showPreview && internalConfig.options.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div>
            <Label className="text-sm font-medium">Preview</Label>
            <div className="mt-2 p-4 border rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500 mb-3">
                This is how customers will see the variant selector:
              </div>
              {/* Here you would render a preview of the VariantSelector component */}
              <div className="space-y-3">
                {internalConfig.options.map((option: any) => (
                  <div key={option.name} className="space-y-1">
                    <div className="text-sm font-medium">
                      {option.name}
                      {option.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      Type: {option.type} • Values: {option.values.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VariantConfig