import { createFileRoute, Link } from "@tanstack/react-router"
import { PageHeader } from "darkraise-ui/layout"
import { nav } from "@/routes/_authenticated"

// Short blurbs keyed by route. The grid itself is derived from the sidebar's
// "Components" nav group (the single source of truth), so a component added to
// the sidebar appears here automatically; add its description below.
const DESCRIPTIONS: Record<string, string> = {
  "/components/accordion": "Collapsible sections for progressive disclosure",
  "/components/alert": "Inline, non-blocking status messages with variants",
  "/components/alert-dialog":
    "Blocking modal dialogs requiring explicit confirmation",
  "/components/angle-slider":
    "Circular control for picking an angle in degrees",
  "/components/animation":
    "Motion utilities for loaders, transitions, and entrances",
  "/components/aspect-ratio":
    "Constrains content to a fixed width-to-height ratio",
  "/components/avatar": "User profile image with initials fallback",
  "/components/background-page":
    "Animated, interactive full-page backgrounds for auth screens",
  "/components/badges": "Compact status and label indicators",
  "/components/banner": "Full-width, page-level announcements and notices",
  "/components/breadcrumb": "Hierarchical trail showing the current location",
  "/components/button-group": "Segmented sets of related buttons",
  "/components/buttons": "Variants, sizes, and states for the Button primitive",
  "/components/calendar":
    "Date and date-range picker built on react-day-picker",
  "/components/cards": "Card layout with header, content, and footer regions",
  "/components/carousel": "Swipeable slides with snap points and controls",
  "/components/cascade-select":
    "Multi-level dependent dropdowns for nested options",
  "/components/charts": "Area, Bar, Line, and Pie charts wrapped in ChartCard",
  "/components/checkbox":
    "Single and grouped checkboxes with indeterminate state",
  "/components/clipboard":
    "Copy-to-clipboard control with success-state feedback",
  "/components/collapsible": "Show and hide content sections on demand",
  "/components/color-picker":
    "Hex color picker with swatch presets and eyedropper",
  "/components/combobox":
    "Searchable input with dropdown listbox and keyboard nav",
  "/components/command": "Searchable command palette with grouped results",
  "/components/context-menu":
    "Right-click menus with items, checkboxes, and submenus",
  "/components/dashboard": "StatCard, KPICard, ProgressCard, and ActivityFeed",
  "/components/data-table":
    "Feature-rich table with sorting, filtering, and pagination",
  "/components/date-input":
    "Segmented day/month/year fields with keyboard entry",
  "/components/date-picker":
    "Date input with calendar popover, range mode, and presets",
  "/components/dialogs": "Dialog, Sheet, Popover, and Tooltip overlays",
  "/components/download-trigger":
    "Generates and downloads a file from in-app data",
  "/components/drawer": "Bottom sheet panel with drag-to-close",
  "/components/dropdown-menu":
    "Context menus with checkboxes, radio groups, and submenus",
  "/components/editable":
    "Click-to-edit text with submit-on-blur and explicit controls",
  "/components/empty-state": "Placeholder for empty lists with action prompts",
  "/components/error-pages": "Ready-made 404 and error-boundary screens",
  "/components/feedback":
    "Toast notifications, inline alerts, and progress indicators",
  "/components/field": "Label, control, hint, and error wrapper for inputs",
  "/components/fieldset": "Grouped form controls with a shared legend",
  "/components/file-upload":
    "Drag-and-drop multi-file upload with previews and validation",
  "/components/floating-panel": "Draggable, resizable floating window panels",
  "/components/form-fields":
    "TanStack Form–integrated field components with validation",
  "/components/frame": "Device and browser chrome frames for previews",
  "/components/highlight":
    "Inline text highlighting for search results and emphasis",
  "/components/hover-card": "Non-interactive preview cards triggered by hover",
  "/components/icons": "Searchable lucide-react catalog with usage conventions",
  "/components/image-cropper": "Crop and zoom images to a target aspect ratio",
  "/components/image-editor": "Crop, rotate, and adjust images in the browser",
  "/components/image-editor-playground":
    "Interactive sandbox for the Image Editor APIs",
  "/components/inputs": "Text, textarea, select, checkbox, switch, radio group",
  "/components/input-otp": "One-time-code entry with per-digit slots and paste",
  "/components/json-tree-view": "Collapsible, syntax-highlighted JSON explorer",
  "/components/kbd": "Keyboard key and shortcut display elements",
  "/components/label": "Accessible labels associated with form controls",
  "/components/layouts":
    "Sidebar, top-nav, stacked, and split-panel layout shells",
  "/components/listbox":
    "Single and multi-select option lists with keyboard nav",
  "/components/marquee": "Continuously scrolling ticker of content",
  "/components/menubar": "Desktop-style application menu bar with menus",
  "/components/multi-select":
    "Tag-style selection of multiple options with search",
  "/components/navigation-menu": "Top-level nav with rich dropdown panels",
  "/components/number-input":
    "Numeric input with steppers, locale formatting, and clamp",
  "/components/pagination": "Page navigation with numbered links and ellipsis",
  "/components/password-input":
    "Password field with show/hide toggle and a11y announcement",
  "/components/popover": "Floating content anchored to a trigger",
  "/components/progress":
    "Horizontal progress bar with value and animation support",
  "/components/qr-code":
    "SVG QR generator with logo overlay and theme-aware colors",
  "/components/radio-group": "Mutually exclusive option selection",
  "/components/rating-group":
    "Star ratings with hover preview and half-star support",
  "/components/resizable": "Draggable split panes with persisted sizes",
  "/components/scroll-area":
    "Scrollable container with a custom styled scrollbar",
  "/components/segment-group":
    "iOS-style segmented control with animated indicator pill",
  "/components/select": "Dropdown single-select with keyboard navigation",
  "/components/separator": "Horizontal and vertical visual dividers",
  "/components/sheet": "Slide-in panel docked to a screen edge",
  "/components/signature-pad": "Canvas for capturing handwritten signatures",
  "/components/skeleton":
    "Animated loading placeholders that match content shape",
  "/components/slider": "Numeric range input with step and disabled support",
  "/components/spinner": "Indeterminate loading indicators in several sizes",
  "/components/stat": "Single metric display with label, value, and trend",
  "/components/steps": "Wizard / stepper with content slots and linear gating",
  "/components/swap":
    "Crossfade between two children driven by a pressed boolean",
  "/components/switch": "On/off toggle for boolean settings",
  "/components/table":
    "Semantic HTML table with caption, header, body, and footer",
  "/components/tabs": "Tabbed navigation between related content panels",
  "/components/tags-input":
    "Chip-based tag entry with paste-split and validation",
  "/components/textarea": "Multi-line text input with auto-resize support",
  "/components/time-picker": "Hour, minute, and meridiem selection control",
  "/components/timer":
    "Stopwatch and countdown with start, pause, resume, and reset",
  "/components/toggle": "Stateful toggle buttons for binary actions",
  "/components/toggle-group": "Grouped single or multi-select toggle bars",
  "/components/toolbar": "Horizontal container grouping actions and controls",
  "/components/tooltip": "Hover and focus hints anchored to a trigger",
  "/components/tour": "Guided product walkthroughs with step highlights",
  "/components/tree-view":
    "Recursive nav tree with selection, expand, and keyboard nav",
  "/components/virtualized-dropdown-menu":
    "Dropdown that virtualizes very long option lists",
}

const componentItems = (
  nav.find((group) => group.label === "Components")?.items ?? []
).filter((item) => item.href !== "/components")

export const Route = createFileRoute("/_authenticated/components/")({
  component: ComponentsIndexPage,
})

function ComponentsIndexPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Component Library"
        description={`${componentItems.length} UI components, each with live demos and copyable code snippets.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {componentItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            className="group border-border bg-card hover:border-primary/50 hover:bg-accent rounded-lg border p-5 transition-colors"
          >
            <div className="bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary mb-3 flex h-9 w-9 items-center justify-center rounded-md transition-colors">
              {Icon && <Icon className="h-4 w-4" />}
            </div>
            <p className="text-foreground font-medium">{label}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {DESCRIPTIONS[href] ?? "Live demo and usage examples"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
