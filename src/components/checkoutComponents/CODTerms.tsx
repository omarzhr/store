import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield } from 'lucide-react'
import { type StoresResponse } from '@/lib/types'

// Checkout settings interface
interface CheckoutSettings {
  appearance?: {
    primaryColor?: string;
  };
  messages?: {
    processingMessage?: string;
  };
}

interface CODTermsProps {
  accepted: boolean
  onAcceptChange: (accepted: boolean) => void
  storeSettings: StoresResponse | null
}

export function CODTerms({
  accepted,
  onAcceptChange,
  storeSettings
}: CODTermsProps) {
  const checkoutSettings: CheckoutSettings = storeSettings?.checkoutSettings ? 
    (typeof storeSettings.checkoutSettings === 'string' ? 
      JSON.parse(storeSettings.checkoutSettings) : 
      storeSettings.checkoutSettings) : {}
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5" />
          Terms & Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div 
            className="border rounded-lg p-4"
            style={{ 
              backgroundColor: `${checkoutSettings?.appearance?.primaryColor}08`,
              borderColor: `${checkoutSettings?.appearance?.primaryColor}20`
            }}
          >
            <h4 className="font-medium text-sm mb-2">Cash on Delivery Terms</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Payment is due in full upon delivery</li>
              <li>• We accept cash in {storeSettings?.currency || 'MAD'} only</li>
              <li>• Please have exact change when possible</li>
              <li>• Delivery person will provide receipt</li>
              <li>• Orders may be cancelled if payment cannot be collected</li>
            </ul>
          </div>

          {/* Custom thank you message from store settings */}
          {checkoutSettings?.messages?.processingMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                ℹ️ {checkoutSettings.messages.processingMessage}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox 
            id="terms" 
            checked={accepted} 
            onCheckedChange={onAcceptChange}
            style={{ '--tw-ring-color': checkoutSettings?.appearance?.primaryColor } as any}
          />
          <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
            I agree to the terms and conditions, and I understand that payment is required upon delivery
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}
