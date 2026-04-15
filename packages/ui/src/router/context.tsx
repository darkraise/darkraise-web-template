import { createContext, useContext, type ReactNode } from "react"
import type { RouterAdapter } from "./types"

const RouterAdapterContext = createContext<RouterAdapter | null>(null)

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

export function useRouterAdapter(): RouterAdapter {
  const adapter = useContext(RouterAdapterContext)
  if (adapter === null) {
    throw new Error(
      "useRouterAdapter must be used inside a <RouterAdapterProvider>",
    )
  }
  return adapter
}
