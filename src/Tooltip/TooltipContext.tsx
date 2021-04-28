import React from 'react'
import tooltipDictionary from './TooltipDictionary.yaml'

export interface TooltipContextValue {
  tooltipDictionary: Record<string, string>
  getTooltip?(key: string, vars?: Record<string, any>): string
}

export const TooltipContext = React.createContext<TooltipContextValue>({ tooltipDictionary })

export function useTooltipContext(): TooltipContextValue {
  return React.useContext(TooltipContext)
}
