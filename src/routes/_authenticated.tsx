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
  TextCursorInput,
  CreditCard,
  Tag,
  Layers,
  ChevronDown as ChevronDownIcon,
  PanelTop,
  CircleUser,
  Minus,
  Loader,
  Table2,
  ScrollText,
  Search,
  LayoutDashboard,
  LineChart,
  Grid3X3,
  FormInput,
  Type,
  Paintbrush,
  ListCollapse,
  Wrench,
  CookingPot,
  MessageSquareMore,
  ToggleLeft,
  AlertTriangle,
  PanelBottom,
  ChevronsUpDown,
  SquareMousePointer,
  SlidersHorizontal,
  CalendarDays,
  ArrowLeftRight,
  MoreHorizontal,
} from "lucide-react"
import { SidebarLayout } from "@/core/layout"
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
    label: "Components",
    items: [
      { label: "Overview", href: "/components", icon: Palette },
      {
        label: "Buttons",
        href: "/components/buttons",
        icon: RectangleHorizontal,
      },
      { label: "Inputs", href: "/components/inputs", icon: TextCursorInput },
      { label: "Cards", href: "/components/cards", icon: CreditCard },
      { label: "Badges", href: "/components/badges", icon: Tag },
      { label: "Dialogs", href: "/components/dialogs", icon: Layers },
      {
        label: "Dropdown",
        href: "/components/dropdown-menu",
        icon: ChevronDownIcon,
      },
      { label: "Accordion", href: "/components/accordion", icon: ListCollapse },
      { label: "Tabs", href: "/components/tabs", icon: PanelTop },
      { label: "Avatar", href: "/components/avatar", icon: CircleUser },
      { label: "Separator", href: "/components/separator", icon: Minus },
      { label: "Skeleton", href: "/components/skeleton", icon: Loader },
      { label: "Table", href: "/components/table", icon: Table2 },
      {
        label: "Scroll Area",
        href: "/components/scroll-area",
        icon: ScrollText,
      },
      { label: "Command", href: "/components/command", icon: Search },
      {
        label: "Dashboard",
        href: "/components/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Charts", href: "/components/charts", icon: LineChart },
      { label: "Data Table", href: "/components/data-table", icon: Grid3X3 },
      {
        label: "Form Fields",
        href: "/components/form-fields",
        icon: FormInput,
      },
      { label: "Typography", href: "/components/typography", icon: Type },
      { label: "Colors", href: "/components/colors", icon: Paintbrush },
      {
        label: "Customization",
        href: "/components/customization",
        icon: Wrench,
      },
      { label: "Recipes", href: "/components/recipes", icon: CookingPot },
      {
        label: "Feedback",
        href: "/components/feedback",
        icon: MessageSquareMore,
      },
      { label: "Toggle", href: "/components/toggle", icon: ToggleLeft },
      {
        label: "Alert Dialog",
        href: "/components/alert-dialog",
        icon: AlertTriangle,
      },
      { label: "Drawer", href: "/components/drawer", icon: PanelBottom },
      {
        label: "Collapsible",
        href: "/components/collapsible",
        icon: ChevronsUpDown,
      },
      {
        label: "Hover Card",
        href: "/components/hover-card",
        icon: SquareMousePointer,
      },
      {
        label: "Slider",
        href: "/components/slider",
        icon: SlidersHorizontal,
      },
      { label: "Calendar", href: "/components/calendar", icon: CalendarDays },
      {
        label: "Pagination",
        href: "/components/pagination",
        icon: ArrowLeftRight,
      },
      {
        label: "More",
        href: "/components/more-components",
        icon: MoreHorizontal,
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
  component: () => (
    <SidebarLayout nav={nav}>
      <Outlet />
    </SidebarLayout>
  ),
})
