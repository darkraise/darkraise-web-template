import { createContext, useContext, type ReactNode } from "react"

interface SidebarContextValue {
  collapsed: boolean
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

interface SidebarProviderProps {
  collapsed: boolean
  children: ReactNode
}

export function SidebarProvider({ collapsed, children }: SidebarProviderProps) {
  return (
    <SidebarContext.Provider value={{ collapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error("useSidebar must be used within a <SidebarProvider>")
  }
  return ctx
}
