import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { Home, Settings } from "lucide-react"
import { SidebarLayout } from "@/core/layout"
import { useAuthStore } from "@/features/auth"
import type { NavGroup } from "@/core/layout/types"

const nav: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: () => (
    <SidebarLayout nav={nav}>
      <Outlet />
    </SidebarLayout>
  ),
})
