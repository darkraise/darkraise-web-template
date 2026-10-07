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

type Structure = (typeof STRUCTURES)[number]["id"]

// Only the areas the grid of each structure declares: a region the template
// does not name lands in an implicit track and leaves a blank strip.
const REGIONS: Record<Structure, readonly string[]> = {
  sidebar: ["nav", "bar", "content"],
  "top-nav": ["bar", "content"],
  stacked: ["nav", "subnav", "bar", "content"],
  "split-panel": ["bar", "panel", "handle", "content"],
}

const RAIL_WIDTHS: Record<string, string> = {
  nav: "w-10",
  subnav: "w-14",
  panel: "w-16",
}

function Lines({ widths }: { widths: readonly string[] }) {
  return (
    <div className="space-y-1.5">
      {widths.map((width, index) => (
        <div
          key={index}
          className={`bg-muted-foreground/20 h-1.5 rounded-full ${width}`}
        />
      ))}
    </div>
  )
}

// Floating runs the content under its chrome and pads it by the app-sized
// rails, which outgrow a thumbnail; these clear the preview-sized chrome.
const FLOATING_CLEARANCE: Record<Structure, string> = {
  sidebar: "ps-16 pt-16",
  "top-nav": "pt-16",
  stacked: "ps-33 pt-16",
  "split-panel": "ps-26 pt-16",
}

function Region({
  region,
  structure,
  style,
}: {
  region: string
  structure: Structure
  style: string
}) {
  if (region === "bar") return <div data-region="bar" className="h-8" />
  if (region === "handle") return <div data-region="handle" className="w-1" />
  if (region === "content") {
    const clearance = style === "floating" ? FLOATING_CLEARANCE[structure] : ""
    return (
      <div data-region="content" className={`p-3 ${clearance}`}>
        <Lines widths={["w-3/4", "w-1/2"]} />
      </div>
    )
  }
  return (
    <div data-region={region} className={`${RAIL_WIDTHS[region]} p-2`}>
      <Lines widths={["w-full", "w-2/3", "w-full"]} />
    </div>
  )
}

// The previews mount the real .dr-shell CSS rather than a redrawing of it, so
// a broken style shows up here instead of only in a running app.
function Preview({
  structure,
  style,
}: {
  structure: Structure
  style: string
}) {
  return (
    <figure className="space-y-2">
      <div
        className="dr-shell h-40 overflow-hidden rounded-lg border"
        data-structure={structure}
        data-shell-style={style}
      >
        {REGIONS[structure].map((region) => (
          <Region
            key={region}
            region={region}
            structure={structure}
            style={style}
          />
        ))}
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
      description="Six chrome treatments, each composing with all four shell structures. Pick one under Shell style in the layout switcher to move every shell in the app at once, set the app's starting style with the defaultShellStyle prop, or pin one shell with the shellStyle prop."
    >
      {STRUCTURES.map(({ id, label, blurb }) => (
        <ShowcaseExample
          key={id}
          title={label}
          code={`import { SidebarLayout } from "darkraise-ui/layout"

// Follows the user's pick in the layout switcher, else the default:
<SidebarLayout nav={nav} showLayoutSwitcher defaultShellStyle="inset">
  <Outlet />
</SidebarLayout>

// Or pin one shell, ignoring the user's pick:
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
