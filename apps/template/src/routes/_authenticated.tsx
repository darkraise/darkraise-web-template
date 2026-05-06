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
  ChevronsUpDown,
  CircleUser,
  Shield,
  RectangleHorizontal,
  CreditCard,
  PanelTopClose,
  ScrollText,
  SeparatorHorizontal,
  Bone,
  ToggleRight,
  Type,
  TextCursorInput,
  Calendar,
  FormInput,
  SlidersHorizontal,
  BarChart2,
  LayoutDashboard,
  Table2,
  ChevronsLeftRight,
  Loader,
  Table,
  AlertTriangle,
  Terminal,
  MessageSquare,
  PanelRightOpen,
  ChevronDown,
  MousePointerClick,
  PanelTop,
  Bell,
  Paintbrush,
  LayoutPanelLeft,
  Wrench,
  AlertCircle,
  BookOpen,
  MoreHorizontal,
  Sparkles,
  Shapes,
  ClipboardCopy,
  Pipette,
  Search,
  CalendarRange,
  Pencil,
  Upload,
  Highlighter,
  Hash,
  Lock,
  QrCode as QrCodeIcon,
  Star,
  Rows3,
  ListOrdered,
  Repeat,
  Timer as TimerIcon,
  FolderTree,
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
        label: "Accordion",
        href: "/components/accordion",
        icon: ChevronsUpDown,
      },
      {
        label: "Alert Dialog",
        href: "/components/alert-dialog",
        icon: AlertTriangle,
      },
      { label: "Animation", href: "/components/animation", icon: Sparkles },
      { label: "Avatar", href: "/components/avatar", icon: CircleUser },
      {
        label: "Accent Surfaces",
        href: "/components/accent-surfaces",
        icon: Paintbrush,
      },
      { label: "Badges", href: "/components/badges", icon: Shield },
      {
        label: "Buttons",
        href: "/components/buttons",
        icon: RectangleHorizontal,
      },
      { label: "Calendar", href: "/components/calendar", icon: Calendar },
      { label: "Cards", href: "/components/cards", icon: CreditCard },
      { label: "Charts", href: "/components/charts", icon: BarChart2 },
      {
        label: "Clipboard",
        href: "/components/clipboard",
        icon: ClipboardCopy,
      },
      {
        label: "Collapsible",
        href: "/components/collapsible",
        icon: PanelTopClose,
      },
      {
        label: "Color Picker",
        href: "/components/color-picker",
        icon: Pipette,
      },
      { label: "Colors", href: "/components/colors", icon: Paintbrush },
      { label: "Combobox", href: "/components/combobox", icon: Search },
      { label: "Command", href: "/components/command", icon: Terminal },
      {
        label: "Customization",
        href: "/components/customization",
        icon: Wrench,
      },
      {
        label: "Dashboard",
        href: "/components/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Data Table", href: "/components/data-table", icon: Table2 },
      {
        label: "Date Picker",
        href: "/components/date-picker",
        icon: CalendarRange,
      },
      { label: "Dialogs", href: "/components/dialogs", icon: MessageSquare },
      { label: "Drawer", href: "/components/drawer", icon: PanelRightOpen },
      {
        label: "Dropdown",
        href: "/components/dropdown-menu",
        icon: ChevronDown,
      },
      { label: "Editable", href: "/components/editable", icon: Pencil },
      {
        label: "Error Pages",
        href: "/components/error-pages",
        icon: AlertCircle,
      },
      { label: "Feedback", href: "/components/feedback", icon: Bell },
      {
        label: "File Upload",
        href: "/components/file-upload",
        icon: Upload,
      },
      {
        label: "Form Fields",
        href: "/components/form-fields",
        icon: FormInput,
      },
      {
        label: "Highlight",
        href: "/components/highlight",
        icon: Highlighter,
      },
      {
        label: "Hover Card",
        href: "/components/hover-card",
        icon: MousePointerClick,
      },
      { label: "Icons", href: "/components/icons", icon: Shapes },
      { label: "Inputs", href: "/components/inputs", icon: TextCursorInput },
      { label: "Layouts", href: "/components/layouts", icon: LayoutPanelLeft },
      {
        label: "More",
        href: "/components/more-components",
        icon: MoreHorizontal,
      },
      {
        label: "Number Input",
        href: "/components/number-input",
        icon: Hash,
      },
      {
        label: "Pagination",
        href: "/components/pagination",
        icon: ChevronsLeftRight,
      },
      {
        label: "Password Input",
        href: "/components/password-input",
        icon: Lock,
      },
      { label: "Progress", href: "/components/progress", icon: Loader },
      { label: "QR Code", href: "/components/qr-code", icon: QrCodeIcon },
      {
        label: "Rating Group",
        href: "/components/rating-group",
        icon: Star,
      },
      { label: "Recipes", href: "/components/recipes", icon: BookOpen },
      {
        label: "Scroll Area",
        href: "/components/scroll-area",
        icon: ScrollText,
      },
      {
        label: "Segment Group",
        href: "/components/segment-group",
        icon: Rows3,
      },
      {
        label: "Separator",
        href: "/components/separator",
        icon: SeparatorHorizontal,
      },
      { label: "Skeleton", href: "/components/skeleton", icon: Bone },
      { label: "Slider", href: "/components/slider", icon: SlidersHorizontal },
      { label: "Steps", href: "/components/steps", icon: ListOrdered },
      { label: "Swap", href: "/components/swap", icon: Repeat },
      { label: "Table", href: "/components/table", icon: Table },
      { label: "Tabs", href: "/components/tabs", icon: PanelTop },
      { label: "Tags Input", href: "/components/tags-input", icon: Tags },
      { label: "Timer", href: "/components/timer", icon: TimerIcon },
      { label: "Toggle", href: "/components/toggle", icon: ToggleRight },
      {
        label: "Tree View",
        href: "/components/tree-view",
        icon: FolderTree,
      },
      { label: "Typography", href: "/components/typography", icon: Type },
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
