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
  Palette,
  RectangleHorizontal,
  Layers,
  Grid3X3,
  FormInput,
  Wrench,
  LayoutPanelLeft,
} from "lucide-react"
import { SidebarLayout, TopNavLayout, StackedLayout } from "darkraise-ui/layout"
import { useLayoutStore } from "darkraise-ui/layout"
import { useAuthStore } from "@/features/auth"
import type { NavGroup } from "darkraise-ui/layout"

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
    label: "Components",
    items: [
      { label: "Overview", href: "/components", icon: Palette },
      {
        label: "Primitives",
        href: "/components/buttons",
        icon: RectangleHorizontal,
        children: [
          { label: "Accordion", href: "/components/accordion" },
          { label: "Avatar", href: "/components/avatar" },
          { label: "Badges", href: "/components/badges" },
          { label: "Buttons", href: "/components/buttons" },
          { label: "Cards", href: "/components/cards" },
          { label: "Collapsible", href: "/components/collapsible" },
          { label: "Scroll Area", href: "/components/scroll-area" },
          { label: "Separator", href: "/components/separator" },
          { label: "Skeleton", href: "/components/skeleton" },
          { label: "Toggle", href: "/components/toggle" },
          { label: "Typography", href: "/components/typography" },
        ],
      },
      {
        label: "Forms & Inputs",
        href: "/components/inputs",
        icon: FormInput,
        children: [
          { label: "Inputs", href: "/components/inputs" },
          { label: "Calendar", href: "/components/calendar" },
          { label: "Form Fields", href: "/components/form-fields" },
          { label: "Slider", href: "/components/slider" },
        ],
      },
      {
        label: "Data Display",
        href: "/components/data-table",
        icon: Grid3X3,
        children: [
          { label: "Charts", href: "/components/charts" },
          { label: "Dashboard", href: "/components/dashboard" },
          { label: "Data Table", href: "/components/data-table" },
          { label: "Pagination", href: "/components/pagination" },
          { label: "Progress", href: "/components/progress" },
          { label: "Table", href: "/components/table" },
        ],
      },
      {
        label: "Overlays",
        href: "/components/dialogs",
        icon: Layers,
        children: [
          { label: "Alert Dialog", href: "/components/alert-dialog" },
          { label: "Command", href: "/components/command" },
          { label: "Dialogs", href: "/components/dialogs" },
          { label: "Drawer", href: "/components/drawer" },
          { label: "Dropdown", href: "/components/dropdown-menu" },
          { label: "Hover Card", href: "/components/hover-card" },
          { label: "Tabs", href: "/components/tabs" },
          { label: "Feedback", href: "/components/feedback" },
        ],
      },
      {
        label: "Layout & Theme",
        href: "/components/layouts",
        icon: LayoutPanelLeft,
        children: [
          { label: "Colors", href: "/components/colors" },
          { label: "Layouts", href: "/components/layouts" },
        ],
      },
      {
        label: "Patterns",
        href: "/components/customization",
        icon: Wrench,
        children: [
          { label: "Customization", href: "/components/customization" },
          { label: "Error Pages", href: "/components/error-pages" },
          { label: "Recipes", href: "/components/recipes" },
          { label: "More", href: "/components/more-components" },
        ],
      },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
]

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({ to: "/login" })
    }
  },
  component: function AuthenticatedLayout() {
    const layout = useLayoutStore((s) => s.layout)

    switch (layout) {
      case "top-nav":
        return (
          <TopNavLayout nav={nav} showLayoutSwitcher>
            <Outlet />
          </TopNavLayout>
        )
      case "stacked":
        return (
          <StackedLayout nav={nav} showLayoutSwitcher>
            <Outlet />
          </StackedLayout>
        )
      case "sidebar":
      default:
        return (
          <SidebarLayout nav={nav} showLayoutSwitcher>
            <Outlet />
          </SidebarLayout>
        )
    }
  },
})
