import { createFileRoute } from "@tanstack/react-router"
import {
  AlertOctagon,
  BarChart3,
  ChevronsUpDown,
  Home,
  Palette,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react"
import { SidebarNav, SidebarProvider, Stack } from "darkraise-ui/layout"
import type { NavGroup } from "darkraise-ui/layout"
import { TooltipProvider } from "darkraise-ui/components/tooltip"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/layouts")({
  component: LayoutsPage,
})

// Real routes, so the example's links go somewhere. Two parents on purpose:
// this page lives under /components, so that group is the one the sidebar
// opens on its own while Reports stays closed.
const nestedNav: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: Home }],
  },
  {
    label: "Library",
    items: [
      {
        label: "Components",
        href: "/components",
        icon: Palette,
        badge: "2",
        children: [
          {
            label: "Accordion",
            href: "/components/accordion",
            icon: ChevronsUpDown,
          },
          { label: "Alert", href: "/components/alert", icon: AlertOctagon },
        ],
      },
      {
        label: "Reports",
        href: "/analytics",
        icon: BarChart3,
        children: [
          { label: "Orders", href: "/orders", icon: ShoppingCart },
          { label: "Customers", href: "/customers", icon: Users },
        ],
      },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
]

function LayoutsPage() {
  return (
    <ShowcasePage
      title="Layouts"
      description="Full-page layout shells for structuring your application. Each variant suits different navigation complexity and content patterns."
    >
      <ShowcaseExample
        title="Sidebar Layout"
        code={`import { SidebarLayout } from "darkraise-ui/layout"

const nav: NavGroup[] = [
  { label: "Main", items: [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
  ]},
]

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <SidebarLayout nav={nav}>
      <Outlet />
    </SidebarLayout>
  ),
})`}
      >
        <Stack gap="sm">
          <div className="flex h-[300px] overflow-hidden rounded-lg border">
            {/* Sidebar */}
            <div className="bg-surface-sidebar flex w-48 shrink-0 flex-col border-r">
              <div className="flex h-10 items-center border-b px-3">
                <span className="text-xs font-semibold">App</span>
              </div>
              <div className="flex-1 py-2">
                <div className="bg-primary/20 mx-2 my-0.5 h-7 rounded" />
                <div className="hover:bg-muted mx-2 my-0.5 h-7 rounded bg-transparent" />
                <div className="hover:bg-muted mx-2 my-0.5 h-7 rounded bg-transparent" />
                <div className="hover:bg-muted mx-2 my-0.5 h-7 rounded bg-transparent" />
                <div className="hover:bg-muted mx-2 my-0.5 h-7 rounded bg-transparent" />
              </div>
            </div>
            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-10 items-center gap-2 border-b px-3">
                <div className="bg-muted h-5 w-32 rounded" />
                <div className="flex-1" />
                <div className="bg-muted h-6 w-6 rounded-full" />
              </div>
              <div className="flex-1 space-y-3 p-4">
                <div className="bg-muted h-20 w-full rounded" />
                <div className="bg-muted h-20 w-full rounded" />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Collapsible sidebar with grouped navigation, header bar with search
            and user menu. Best for complex apps with many navigation items.
          </p>
        </Stack>
      </ShowcaseExample>

      <ShowcaseExample
        title="Nested Navigation"
        code={`const nav: NavGroup[] = [
  { label: "Library", items: [
    {
      label: "Components",
      href: "/components",
      icon: Palette,
      badge: "2",
      children: [
        { label: "Accordion", href: "/components/accordion", icon: ChevronsUpDown },
        { label: "Alert", href: "/components/alert", icon: AlertOctagon },
      ],
    },
  ]},
]

// A parent item is a link in its own right. Expanded, the chevron beside it
// toggles the children; collapsed, its icon opens a popover that leads with
// the parent's own route. Groups covering the current route open themselves.
<SidebarProvider collapsed={false}>
  <SidebarNav nav={nav} />
</SidebarProvider>`}
      >
        <Stack gap="sm">
          <TooltipProvider delayDuration={0}>
            <div className="flex gap-4">
              <div className="bg-surface-sidebar w-56 shrink-0 rounded-lg border py-2">
                <SidebarProvider collapsed={false}>
                  <SidebarNav nav={nestedNav} />
                </SidebarProvider>
              </div>
              <div className="bg-surface-sidebar w-16 shrink-0 rounded-lg border py-2">
                <SidebarProvider collapsed>
                  <SidebarNav nav={nestedNav} />
                </SidebarProvider>
              </div>
            </div>
          </TooltipProvider>
          <p className="text-muted-foreground text-sm">
            An item with <code>children</code> renders as a link plus a chevron
            toggle, so the parent route stays reachable while its children
            expand and collapse. A group opens itself when the current route
            falls inside it — Components is open here because this page lives
            under it, while Reports stays closed — and a group you collapse by
            hand stays collapsed. On the collapsed rail the same item marks
            itself active for its children and opens a popover that lists the
            parent first, then the rest.
          </p>
        </Stack>
      </ShowcaseExample>

      <ShowcaseExample
        title="Top Navigation Layout"
        code={`import { TopNavLayout } from "darkraise-ui/layout"

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <TopNavLayout nav={nav}>
      <Outlet />
    </TopNavLayout>
  ),
})`}
      >
        <Stack gap="sm">
          <div className="flex h-[300px] flex-col overflow-hidden rounded-lg border">
            {/* Top nav */}
            <div className="flex h-10 shrink-0 items-center gap-4 border-b px-3">
              <div className="bg-primary-fill h-6 w-6 shrink-0 rounded" />
              <div className="flex items-center gap-1">
                <div className="bg-muted h-5 w-14 rounded px-2 text-[length:var(--text-2xs)]" />
                <div className="bg-muted h-5 w-16 rounded px-2 text-[length:var(--text-2xs)]" />
                <div className="bg-muted h-5 w-14 rounded px-2 text-[length:var(--text-2xs)]" />
                <div className="bg-muted h-5 w-18 rounded px-2 text-[length:var(--text-2xs)]" />
              </div>
              <div className="flex-1" />
              <div className="bg-muted h-6 w-6 rounded-full" />
            </div>
            {/* Content */}
            <div className="flex-1 space-y-3 p-4">
              <div className="bg-muted h-20 w-full rounded" />
              <div className="bg-muted h-20 w-full rounded" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Horizontal navigation in the header bar. Simpler feel, suited for
            apps with fewer top-level sections.
          </p>
        </Stack>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stacked Layout"
        code={`import { StackedLayout } from "darkraise-ui/layout"

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <StackedLayout nav={nav}>
      <Outlet />
    </StackedLayout>
  ),
})`}
      >
        <Stack gap="sm">
          <div className="flex h-[300px] overflow-hidden rounded-lg border">
            {/* Icon sidebar */}
            <div className="bg-surface-sidebar flex w-12 shrink-0 flex-col items-center gap-2 border-r py-3">
              <div className="bg-primary-fill h-6 w-6 rounded" />
              <div className="bg-primary/20 h-8 w-8 rounded" />
              <div className="bg-muted/30 h-8 w-8 rounded" />
              <div className="bg-muted/30 h-8 w-8 rounded" />
              <div className="bg-muted/30 h-8 w-8 rounded" />
            </div>
            {/* Sub-nav */}
            <div className="flex w-40 shrink-0 flex-col border-r">
              <div className="flex h-10 items-center border-b px-3">
                <span className="text-muted-foreground text-[length:var(--text-2xs)] font-semibold tracking-wide uppercase">
                  Section
                </span>
              </div>
              <div className="flex-1 py-2">
                <div className="bg-primary/20 mx-2 my-0.5 h-7 rounded" />
                <div className="mx-2 my-0.5 h-7 rounded bg-transparent" />
                <div className="mx-2 my-0.5 h-7 rounded bg-transparent" />
                <div className="mx-2 my-0.5 h-7 rounded bg-transparent" />
              </div>
            </div>
            {/* Main area */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-10 items-center gap-2 border-b px-3">
                <div className="bg-muted h-5 w-28 rounded" />
                <div className="flex-1" />
                <div className="bg-muted h-6 w-6 rounded-full" />
              </div>
              <div className="flex-1 space-y-3 p-4">
                <div className="bg-muted h-20 w-full rounded" />
                <div className="bg-muted h-16 w-full rounded" />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Icon sidebar for top-level sections plus a text sub-navigation
            panel. Ideal for complex apps with deep navigation hierarchies.
          </p>
        </Stack>
      </ShowcaseExample>

      <ShowcaseExample
        title="Split Panel Layout"
        code={`import { SplitPanelLayout } from "darkraise-ui/layout"

export const Route = createFileRoute("/_authenticated")({
  component: () => (
    <SplitPanelLayout nav={nav} panel={<MessageList />}>
      <Outlet />
    </SplitPanelLayout>
  ),
})`}
      >
        <Stack gap="sm">
          <div className="flex h-[300px] flex-col overflow-hidden rounded-lg border">
            {/* Header */}
            <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
              <div className="bg-primary-fill h-6 w-6 shrink-0 rounded" />
              <div className="bg-muted h-5 w-32 rounded" />
              <div className="flex-1" />
              <div className="bg-muted h-6 w-6 rounded-full" />
            </div>
            {/* Body */}
            <div className="flex min-h-0 flex-1">
              {/* Left list panel */}
              <div className="w-1/3 overflow-hidden border-r">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-12 flex-col justify-center border-b px-3"
                  >
                    <div className="bg-muted h-3 w-24 rounded" />
                    <div className="bg-muted/50 mt-1 h-2 w-16 rounded" />
                  </div>
                ))}
              </div>
              {/* Resize handle */}
              <div className="bg-border w-1 cursor-col-resize" />
              {/* Right content */}
              <div className="flex-1 space-y-3 p-4">
                <div className="bg-muted h-20 w-full rounded" />
                <div className="bg-muted h-16 w-full rounded" />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Master-detail layout with a resizable list panel on the left and
            content on the right. Perfect for email, messaging, or
            record-browsing interfaces.
          </p>
        </Stack>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
