import { createFileRoute } from "@tanstack/react-router"
import { Stack } from "darkraise-ui/layout"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/layouts")({
  component: LayoutsPage,
})

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
              <div className="bg-primary h-6 w-6 shrink-0 rounded" />
              <div className="flex items-center gap-1">
                <div className="bg-muted h-5 w-14 rounded px-2 text-[10px]" />
                <div className="bg-muted h-5 w-16 rounded px-2 text-[10px]" />
                <div className="bg-muted h-5 w-14 rounded px-2 text-[10px]" />
                <div className="bg-muted h-5 w-18 rounded px-2 text-[10px]" />
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
              <div className="bg-primary h-6 w-6 rounded" />
              <div className="bg-primary/20 h-8 w-8 rounded" />
              <div className="bg-muted/30 h-8 w-8 rounded" />
              <div className="bg-muted/30 h-8 w-8 rounded" />
              <div className="bg-muted/30 h-8 w-8 rounded" />
            </div>
            {/* Sub-nav */}
            <div className="flex w-40 shrink-0 flex-col border-r">
              <div className="flex h-10 items-center border-b px-3">
                <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
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
              <div className="bg-primary h-6 w-6 shrink-0 rounded" />
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
