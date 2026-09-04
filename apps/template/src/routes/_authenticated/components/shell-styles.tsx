import { createFileRoute } from "@tanstack/react-router"
import { SHELL_STYLES } from "darkraise-ui/theme"
import { Stack } from "darkraise-ui/layout"
import { ShowcasePage } from "./_components/-showcase-page"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/shell-styles")(
  { component: ShellStylesPage },
)

const STRUCTURES = [
  {
    id: "sidebar",
    label: "Sidebar",
    blurb: "Rail plus app bar over content. The most gutter-sensitive shape.",
  },
  {
    id: "top-nav",
    label: "Top navigation",
    blurb: "App bar carries the nav; content runs full width.",
  },
  {
    id: "stacked",
    label: "Stacked",
    blurb: "Icon rail, contextual sub-nav, app bar, content — four regions.",
  },
  {
    id: "split-panel",
    label: "Split panel",
    blurb: "Full-width bar over a resizable record list and content.",
  },
] as const

// The previews mount the real .dr-shell CSS rather than a redrawing of it, so
// a broken style shows up here instead of only in a running app.
function Preview({ structure, style }: { structure: string; style: string }) {
  return (
    <figure className="space-y-2">
      <div
        className="dr-shell h-40 overflow-hidden rounded-lg border"
        data-structure={structure}
        data-shell-style={style}
      >
        <div data-region="nav" className="bg-surface-sidebar w-10" />
        <div data-region="subnav" className="bg-background w-14" />
        <div data-region="bar" className="bg-surface-header h-8" />
        <div data-region="panel" className="bg-card w-16" />
        <div data-region="handle" className="w-1" />
        <div data-region="content" className="bg-muted/40" />
      </div>
      <figcaption className="text-muted-foreground font-mono text-xs">
        {style}
      </figcaption>
    </figure>
  )
}

function ShellStylesPage() {
  return (
    <ShowcasePage
      title="Shell Styles"
      description="One theme axis, six chrome treatments, each composing with all four shell structures. Switch the axis in the theme panel to move every shell in the app at once, or pin one shell with the shellStyle prop."
    >
      {STRUCTURES.map(({ id, label, blurb }) => (
        <ShowcaseExample
          key={id}
          title={label}
          code={`import { SidebarLayout } from "darkraise-ui/layout"

// Follows the theme axis:
<SidebarLayout nav={nav}>
  <Outlet />
</SidebarLayout>

// Or pin one shell, ignoring the axis:
<SidebarLayout nav={nav} shellStyle="island">
  <Outlet />
</SidebarLayout>`}
        >
          <Stack gap="sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SHELL_STYLES.map((style) => (
                <Preview key={style} structure={id} style={style} />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">{blurb}</p>
          </Stack>
        </ShowcaseExample>
      ))}
    </ShowcasePage>
  )
}
