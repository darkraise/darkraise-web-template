import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import {
  Home,
  BarChart3,
  Package,
  Tags,
  ShoppingCart,
  Users,
  Inbox,
  Settings,
} from "lucide-react"
import { useAuthStore } from "@/features/auth"
import type { NavGroup } from "@/core/layout/types"

const nav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: Home },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/products", icon: Package },
      { label: "Categories", href: "/categories", icon: Tags },
    ],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingCart },
      { label: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Messaging",
    items: [{ label: "Inbox", href: "/inbox", icon: Inbox }],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
]

export const Route = createFileRoute("/_inbox")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: () => <Outlet />,
})

export { nav as inboxNav }
