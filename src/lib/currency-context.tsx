import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { StoresResponse } from '@/lib/types'

interface CurrencyContextType {
  currency: string
  formatPrice: (amount: number) => string
  getCurrencySymbol: (currency: string) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
  storeSettings?: StoresResponse
}

export function CurrencyProvider({ children, storeSettings }: CurrencyProviderProps) {
  // Default to MAD (Moroccan Dirham) instead of USD
  const currency = storeSettings?.currency || 'MAD'
  
  const getCurrencySymbol = (curr: string): string => {
    const symbols: Record<string, string> = {
      'MAD': 'DH',  // Added Moroccan Dirham
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$',
      'JPY': '¥',
      'CNY': '¥',
      'INR': '₹'
    }
    return symbols[curr] || 'DH'  // Default to DH instead of $
  }

  const formatPrice = (amount: number): string => {
    const symbol = getCurrencySymbol(currency)
    // Format as "amount DH" for Moroccan Dirham, "symbol+amount" for others
    if (currency === 'MAD') {
      return `${amount.toFixed(2)} ${symbol}`
    }
    return `${symbol}${amount.toFixed(2)}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, formatPrice, getCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
