import { type ReactNode } from "react"
import type { RouterAdapter } from "./types"
import { RouterAdapterContext } from "./routerAdapterContext"

interface RouterAdapterProviderProps {
  value: RouterAdapter
  children: ReactNode
}

export function RouterAdapterProvider({
  value,
  children,
}: RouterAdapterProviderProps) {
  return (
    <RouterAdapterContext.Provider value={value}>
      {children}
    </RouterAdapterContext.Provider>
  )
}
