interface CheckoutStepperProps {
  currentStep: number
  primaryColor?: string
  hasShippingZones?: boolean
  enableShippingStep?: boolean
  enableShippingOptions?: boolean
}

export function CheckoutStepper({ 
  currentStep, 
  primaryColor = '#3b82f6',
  hasShippingZones = false,
  enableShippingStep = true,
  enableShippingOptions = true
}: CheckoutStepperProps) {
  // Build steps based on enabled features
  let steps = []
  
  if (enableShippingStep && hasShippingZones) {
    if (enableShippingOptions) {
      // Full flow: Info -> Shipping -> Options -> Review
      steps = [
        { number: 1, title: 'Information', description: 'Contact details' },
        { number: 2, title: 'Shipping', description: 'Delivery address' },
        { number: 3, title: 'Options', description: 'Shipping method' },
        { number: 4, title: 'Review', description: 'Confirm order' }
      ]
    } else {
      // Skip options: Info -> Shipping -> Review
      steps = [
        { number: 1, title: 'Information', description: 'Contact details' },
        { number: 2, title: 'Shipping', description: 'Delivery address' },
        { number: 3, title: 'Review', description: 'Confirm order' }
      ]
    }
  } else {
    // No shipping step or no zones: Info -> Review
    steps = [
      { number: 1, title: 'Information', description: 'Contact & delivery' },
      { number: 2, title: 'Review', description: 'Confirm order' }
    ]
  }

  // Adjust current step for display based on actual flow
  let displayStep = currentStep
  
  if (!enableShippingStep || !hasShippingZones) {
    // Map: 1->1, 4->2
    if (currentStep === 4) displayStep = 2
  } else if (!enableShippingOptions) {
    // Map: 1->1, 2->2, 4->3
    if (currentStep === 4) displayStep = 3
  }
  // If both enabled, displayStep = currentStep (no mapping needed)

  return (
    <div className="mb-4 lg:mb-8">
      {/* Mobile Stepper */}
      <div className="block lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            Step {displayStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {steps[displayStep - 1]?.title}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(displayStep / steps.length) * 100}%`,
              backgroundColor: primaryColor
            }}
          />
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200"
                  style={{
                    backgroundColor: displayStep >= step.number ? primaryColor : 'transparent',
                    borderColor: displayStep >= step.number ? primaryColor : '#d1d5db',
                    color: displayStep >= step.number ? 'white' : '#6b7280'
                  }}
                >
                  <span className="text-sm font-semibold">{step.number}</span>
                </div>
                <div className="mt-2 text-center">
                  <div 
                    className="text-sm font-medium"
                    style={{ color: displayStep >= step.number ? primaryColor : '#6b7280' }}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div 
                  className="flex-1 h-0.5 mx-4 transition-colors duration-200"
                  style={{ backgroundColor: displayStep > step.number ? primaryColor : '#d1d5db' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
