import type { StoresResponse } from "@/lib/types"
import { Label } from "@radix-ui/react-dropdown-menu"
import { renderLogoTypeSelector, renderLogoUpload, renderLogoUrlInput } from "./logocomponent"

export function LogoSection({
  logoType,
  setLogoType,
  storeSettings,
  removeCurrentLogo,
  handleRemoveCurrentLogo,
  logoFile,
  handleLogoChange,
  setLogoFile,
  logoUrl,
  setLogoUrl
}: {
  logoType: 'upload' | 'url'
  setLogoType: (type: 'upload' | 'url') => void
  storeSettings: StoresResponse | null
  removeCurrentLogo: boolean
  handleRemoveCurrentLogo: () => void
  logoFile: File | null
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setLogoFile: (file: File | null) => void
  logoUrl: string
  setLogoUrl: (url: string) => void
}) {
  return (
    <div className="space-y-4">
      <Label>Store Logo</Label>
      
      {renderLogoTypeSelector({ logoType, setLogoType })}

      {logoType === 'upload' ? 
        renderLogoUpload({
          storeSettings,
          removeCurrentLogo,
          handleRemoveCurrentLogo,
          logoFile,
          handleLogoChange,
          setLogoFile
        }) :
        renderLogoUrlInput({ logoUrl, setLogoUrl })
      }
    </div>
  )
}