import { createFileRoute, Link } from "@tanstack/react-router"
import {
  MousePointerClick,
  FormInput,
  LayoutGrid,
  Tag,
  Layers,
  ChevronDown,
  AlignJustify,
  LayoutDashboard,
  CircleUser,
  Minus,
  Loader,
  Table2,
  ScrollText,
  Terminal,
  PieChart,
  BarChart3,
  TableProperties,
  ListChecks,
  Type,
  Palette,
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
  LayoutPanelLeft,
} from "lucide-react"
import { PageHeader } from "@/core/layout"

const COMPONENTS = [
  {
    href: "/components/accordion",
    label: "Accordion",
    description: "Collapsible sections for progressive disclosure",
    icon: AlignJustify,
  },
  {
    href: "/components/alert-dialog",
    label: "Alert Dialog",
    description: "Blocking modal dialogs requiring explicit confirmation",
    icon: AlertTriangle,
  },
  {
    href: "/components/avatar",
    label: "Avatar",
    description: "User profile image with initials fallback",
    icon: CircleUser,
  },
  {
    href: "/components/badges",
    label: "Badges",
    description: "Compact status and label indicators",
    icon: Tag,
  },
  {
    href: "/components/buttons",
    label: "Buttons",
    description: "Variants, sizes, and states for the Button primitive",
    icon: MousePointerClick,
  },
  {
    href: "/components/calendar",
    label: "Calendar",
    description: "Date and date-range picker built on react-day-picker",
    icon: CalendarDays,
  },
  {
    href: "/components/cards",
    label: "Cards",
    description: "Card layout with header, content, and footer regions",
    icon: LayoutGrid,
  },
  {
    href: "/components/charts",
    label: "Charts",
    description: "Area, Bar, Line, and Pie charts wrapped in ChartCard",
    icon: BarChart3,
  },
  {
    href: "/components/collapsible",
    label: "Collapsible",
    description: "Show and hide content sections on demand",
    icon: ChevronsUpDown,
  },
  {
    href: "/components/colors",
    label: "Colors",
    description: "Surface elevations and semantic color tokens",
    icon: Palette,
  },
  {
    href: "/components/command",
    label: "Command",
    description: "Searchable command palette with grouped results",
    icon: Terminal,
  },
  {
    href: "/components/customization",
    label: "Customization",
    description: "Extend components with new CVA variants and custom props",
    icon: Wrench,
  },
  {
    href: "/components/dashboard",
    label: "Dashboard",
    description: "StatCard, KPICard, ProgressCard, and ActivityFeed",
    icon: PieChart,
  },
  {
    href: "/components/data-table",
    label: "Data Table",
    description: "Feature-rich table with sorting, filtering, and pagination",
    icon: TableProperties,
  },
  {
    href: "/components/dialogs",
    label: "Dialogs",
    description: "Dialog, Sheet, Popover, and Tooltip overlays",
    icon: Layers,
  },
  {
    href: "/components/drawer",
    label: "Drawer",
    description: "Bottom sheet panel built on Vaul with drag-to-close",
    icon: PanelBottom,
  },
  {
    href: "/components/dropdown-menu",
    label: "Dropdown Menu",
    description: "Context menus with checkboxes, radio groups, and submenus",
    icon: ChevronDown,
  },
  {
    href: "/components/feedback",
    label: "Feedback",
    description: "Toast notifications, inline alerts, and progress indicators",
    icon: MessageSquareMore,
  },
  {
    href: "/components/form-fields",
    label: "Form Fields",
    description: "TanStack Form–integrated field components with validation",
    icon: ListChecks,
  },
  {
    href: "/components/hover-card",
    label: "Hover Card",
    description: "Non-interactive preview cards triggered by hover",
    icon: SquareMousePointer,
  },
  {
    href: "/components/inputs",
    label: "Inputs",
    description: "Text, textarea, select, checkbox, switch, radio group",
    icon: FormInput,
  },
  {
    href: "/components/layouts",
    label: "Layouts",
    description: "Sidebar, top-nav, stacked, and split-panel layout shells",
    icon: LayoutPanelLeft,
  },
  {
    href: "/components/more-components",
    label: "More Components",
    description:
      "AspectRatio, Carousel, InputOTP, Menubar, NavigationMenu, Resizable",
    icon: MoreHorizontal,
  },
  {
    href: "/components/pagination",
    label: "Pagination",
    description: "Page navigation with numbered links and ellipsis",
    icon: ArrowLeftRight,
  },
  {
    href: "/components/recipes",
    label: "Recipes",
    description: "Cross-component composition patterns for real-world UIs",
    icon: CookingPot,
  },
  {
    href: "/components/scroll-area",
    label: "Scroll Area",
    description: "Scrollable container with a custom styled scrollbar",
    icon: ScrollText,
  },
  {
    href: "/components/separator",
    label: "Separator",
    description: "Horizontal and vertical visual dividers",
    icon: Minus,
  },
  {
    href: "/components/skeleton",
    label: "Skeleton",
    description: "Animated loading placeholders that match content shape",
    icon: Loader,
  },
  {
    href: "/components/slider",
    label: "Slider",
    description: "Numeric range input with step and disabled support",
    icon: SlidersHorizontal,
  },
  {
    href: "/components/table",
    label: "Table",
    description: "Semantic HTML table with caption, header, body, and footer",
    icon: Table2,
  },
  {
    href: "/components/tabs",
    label: "Tabs",
    description: "Tabbed navigation between related content panels",
    icon: LayoutDashboard,
  },
  {
    href: "/components/toggle",
    label: "Toggle",
    description: "Stateful toggle buttons and grouped single/multi-select bars",
    icon: ToggleLeft,
  },
  {
    href: "/components/typography",
    label: "Typography",
    description: "Headings, body text, muted, mono, and size scale",
    icon: Type,
  },
]

export const Route = createFileRoute("/_authenticated/components/")({
  component: ComponentsIndexPage,
})

function ComponentsIndexPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Component Library"
        description="Every UI component available in this template, each with live demos and copyable code snippets."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {COMPONENTS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className="group border-border bg-card hover:border-primary/50 hover:bg-accent rounded-lg border p-5 transition-colors"
          >
            <div className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary mb-3 flex h-9 w-9 items-center justify-center rounded-md transition-colors">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-foreground font-medium">{label}</p>
            <p className="text-muted-foreground mt-1 text-xs">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
