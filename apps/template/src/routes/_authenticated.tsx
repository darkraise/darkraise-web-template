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
  ChevronsRight,
  CircleUser,
  Wallpaper,
  Shield,
  RectangleHorizontal,
  CreditCard,
  PanelTopClose,
  ScrollText,
  SeparatorHorizontal,
  Bone,
  ToggleRight,
  TextCursorInput,
  CalendarDays,
  Calendar,
  Compass,
  FormInput,
  Layers,
  List,
  Map,
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
  LayoutPanelLeft,
  AlertCircle,
  Download,
  GalleryHorizontal,
  KeyRound,
  Keyboard,
  Menu,
  Navigation,
  SplitSquareHorizontal,
  TrendingUp,
  Wrench,
  Sparkles,
  Shapes,
  PackageOpen,
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
  Square,
  PenTool,
  Crop,
  Monitor,
  Braces,
  AlertOctagon,
  AlignLeft,
  Bookmark,
  CircleDot,
  Clock,
  HelpCircle,
  LayoutGrid,
  ListFilter,
  MousePointer,
  PanelLeftOpen,
  Pin,
  Power,
  SquareCheck,
  SquareChevronDown,
  Tag,
  ListChecks,
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
      { label: "Alert", href: "/components/alert", icon: AlertOctagon },
      {
        label: "Alert Dialog",
        href: "/components/alert-dialog",
        icon: AlertTriangle,
      },
      {
        label: "Angle Slider",
        href: "/components/angle-slider",
        icon: Compass,
      },
      { label: "Animation", href: "/components/animation", icon: Sparkles },
      {
        label: "Aspect Ratio",
        href: "/components/aspect-ratio",
        icon: RectangleHorizontal,
      },
      { label: "Avatar", href: "/components/avatar", icon: CircleUser },
      {
        label: "Background Page",
        href: "/components/background-page",
        icon: Wallpaper,
      },
      { label: "Badges", href: "/components/badges", icon: Shield },
      { label: "Banner", href: "/components/banner", icon: AlertCircle },
      {
        label: "Breadcrumb",
        href: "/components/breadcrumb",
        icon: ChevronsRight,
      },
      {
        label: "Button Group",
        href: "/components/button-group",
        icon: Layers,
      },
      {
        label: "Buttons",
        href: "/components/buttons",
        icon: RectangleHorizontal,
      },
      { label: "Calendar", href: "/components/calendar", icon: Calendar },
      { label: "Cards", href: "/components/cards", icon: CreditCard },
      {
        label: "Carousel",
        href: "/components/carousel",
        icon: GalleryHorizontal,
      },
      {
        label: "Cascade Select",
        href: "/components/cascade-select",
        icon: Layers,
      },
      { label: "Charts", href: "/components/charts", icon: BarChart2 },
      { label: "Checkbox", href: "/components/checkbox", icon: SquareCheck },
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
      { label: "Combobox", href: "/components/combobox", icon: Search },
      { label: "Command", href: "/components/command", icon: Terminal },
      {
        label: "Context Menu",
        href: "/components/context-menu",
        icon: MousePointer,
      },
      {
        label: "Dashboard",
        href: "/components/dashboard",
        icon: LayoutDashboard,
      },
      { label: "Data Table", href: "/components/data-table", icon: Table2 },
      {
        label: "Date Input",
        href: "/components/date-input",
        icon: CalendarDays,
      },
      {
        label: "Date Picker",
        href: "/components/date-picker",
        icon: CalendarRange,
      },
      { label: "Dialogs", href: "/components/dialogs", icon: MessageSquare },
      {
        label: "Download Trigger",
        href: "/components/download-trigger",
        icon: Download,
      },
      { label: "Drawer", href: "/components/drawer", icon: PanelRightOpen },
      {
        label: "Dropdown",
        href: "/components/dropdown-menu",
        icon: ChevronDown,
      },
      { label: "Editable", href: "/components/editable", icon: Pencil },
      {
        label: "Empty State",
        href: "/components/empty-state",
        icon: PackageOpen,
      },
      {
        label: "Error Pages",
        href: "/components/error-pages",
        icon: AlertCircle,
      },
      { label: "Feedback", href: "/components/feedback", icon: Bell },
      { label: "Field", href: "/components/field", icon: Tag },
      {
        label: "Fieldset",
        href: "/components/fieldset",
        icon: FormInput,
      },
      {
        label: "File Upload",
        href: "/components/file-upload",
        icon: Upload,
      },
      {
        label: "Floating Panel",
        href: "/components/floating-panel",
        icon: Square,
      },
      {
        label: "Form Fields",
        href: "/components/form-fields",
        icon: FormInput,
      },
      { label: "Frame", href: "/components/frame", icon: Monitor },
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
      {
        label: "Image Cropper",
        href: "/components/image-cropper",
        icon: Crop,
      },
      {
        label: "Image Editor",
        href: "/components/image-editor",
        icon: Crop,
      },
      {
        label: "Image Editor Playground",
        href: "/components/image-editor-playground",
        icon: Crop,
      },
      { label: "Inputs", href: "/components/inputs", icon: TextCursorInput },
      {
        label: "Input OTP",
        href: "/components/input-otp",
        icon: KeyRound,
      },
      {
        label: "JSON Tree View",
        href: "/components/json-tree-view",
        icon: Braces,
      },
      { label: "Kbd", href: "/components/kbd", icon: Keyboard },
      { label: "Label", href: "/components/label", icon: Bookmark },
      { label: "Layouts", href: "/components/layouts", icon: LayoutPanelLeft },
      { label: "Listbox", href: "/components/listbox", icon: List },
      {
        label: "Marquee",
        href: "/components/marquee",
        icon: ChevronsRight,
      },
      { label: "Menubar", href: "/components/menubar", icon: Menu },
      {
        label: "Multi Select",
        href: "/components/multi-select",
        icon: ListChecks,
      },
      {
        label: "Navigation Menu",
        href: "/components/navigation-menu",
        icon: Navigation,
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
      { label: "Popover", href: "/components/popover", icon: Pin },
      { label: "Progress", href: "/components/progress", icon: Loader },
      { label: "QR Code", href: "/components/qr-code", icon: QrCodeIcon },
      {
        label: "Radio Group",
        href: "/components/radio-group",
        icon: CircleDot,
      },
      {
        label: "Rating Group",
        href: "/components/rating-group",
        icon: Star,
      },
      {
        label: "Resizable",
        href: "/components/resizable",
        icon: SplitSquareHorizontal,
      },
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
        label: "Select",
        href: "/components/select",
        icon: SquareChevronDown,
      },
      {
        label: "Separator",
        href: "/components/separator",
        icon: SeparatorHorizontal,
      },
      { label: "Sheet", href: "/components/sheet", icon: PanelLeftOpen },
      {
        label: "Signature Pad",
        href: "/components/signature-pad",
        icon: PenTool,
      },
      { label: "Skeleton", href: "/components/skeleton", icon: Bone },
      { label: "Slider", href: "/components/slider", icon: SlidersHorizontal },
      { label: "Spinner", href: "/components/spinner", icon: Loader },
      { label: "Stat", href: "/components/stat", icon: TrendingUp },
      { label: "Steps", href: "/components/steps", icon: ListOrdered },
      { label: "Swap", href: "/components/swap", icon: Repeat },
      { label: "Switch", href: "/components/switch", icon: Power },
      { label: "Table", href: "/components/table", icon: Table },
      { label: "Tabs", href: "/components/tabs", icon: PanelTop },
      { label: "Tags Input", href: "/components/tags-input", icon: Tags },
      { label: "Textarea", href: "/components/textarea", icon: AlignLeft },
      { label: "Time Picker", href: "/components/time-picker", icon: Clock },
      { label: "Timer", href: "/components/timer", icon: TimerIcon },
      { label: "Toggle", href: "/components/toggle", icon: ToggleRight },
      {
        label: "Toggle Group",
        href: "/components/toggle-group",
        icon: LayoutGrid,
      },
      { label: "Toolbar", href: "/components/toolbar", icon: Wrench },
      { label: "Tooltip", href: "/components/tooltip", icon: HelpCircle },
      { label: "Tour", href: "/components/tour", icon: Map },
      {
        label: "Tree View",
        href: "/components/tree-view",
        icon: FolderTree,
      },
      {
        label: "Virtualized Dropdown Menu",
        href: "/components/virtualized-dropdown-menu",
        icon: ListFilter,
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
