import { type ReactNode } from "react"
import { SidebarContext } from "./sidebar-context"

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
