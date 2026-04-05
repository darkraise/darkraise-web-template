import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/colors")({
  component: ColorsPage,
})

function ColorsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Colors" },
        ]}
        title="Colors & Surfaces"
        description="Semantic color tokens and surface elevation layers defined in the theme."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Surface elevations"
          code={`// Surfaces are stacked: sunken → base → raised → overlay
<div className="bg-surface-sunken">sunken — inset areas</div>
<div className="bg-surface-base">base — page background</div>
<div className="bg-surface-raised">raised — cards, panels</div>
<div className="bg-surface-overlay">overlay — dialogs, popovers</div>`}
        >
          <div className="flex items-center justify-center py-8">
            <div
              className="relative w-full max-w-lg"
              style={{ perspective: "800px" }}
            >
              {[
                {
                  token: "bg-surface-sunken",
                  label: "sunken",
                  desc: "Inset areas, wells",
                  offset: 0,
                  z: 0,
                },
                {
                  token: "bg-surface-base",
                  label: "base",
                  desc: "Page background",
                  offset: 1,
                  z: 1,
                },
                {
                  token: "bg-surface-raised",
                  label: "raised",
                  desc: "Cards, panels",
                  offset: 2,
                  z: 2,
                },
                {
                  token: "bg-surface-overlay",
                  label: "overlay",
                  desc: "Dialogs, popovers",
                  offset: 3,
                  z: 3,
                },
              ].map(({ token, label, desc, offset, z }) => (
                <div
                  key={token}
                  className={`${token} relative rounded-lg border border-border px-5 py-4 ring-1 ring-border/50`}
                  style={{
                    transform: `translateZ(${z * 12}px) translateY(${-offset * 8}px)`,
                    boxShadow: `0 ${z * 4}px ${z * 8 + 4}px -${z * 2}px rgb(0 0 0 / ${0.03 + z * 0.04})`,
                    marginTop: offset > 0 ? "-2rem" : "0",
                    marginLeft: `${offset * 1.5}rem`,
                    marginRight: `${offset * 1.5}rem`,
                    zIndex: z,
                  }}
                >
                  <div className="flex items-baseline justify-between">
                    <p className="font-mono text-sm font-medium text-foreground">
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    var(--surface-{label})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Layout-specific surfaces"
          code={`<div className="bg-surface-sidebar">sidebar — navigation rail</div>
<div className="bg-surface-header">header — top bar</div>`}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="flex h-20 flex-col justify-end rounded-lg bg-surface-sidebar p-4 ring-1 ring-border">
              <p className="font-mono text-xs font-medium text-white">
                sidebar
              </p>
              <p className="font-mono text-[10px] text-white/60">
                var(--surface-sidebar)
              </p>
            </div>
            <div className="flex h-20 flex-col justify-end rounded-lg bg-surface-header p-4 ring-1 ring-border">
              <p className="font-mono text-xs font-medium text-foreground">
                header
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                var(--surface-header)
              </p>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Semantic color tokens"
          code={`<div className="bg-primary text-primary-foreground">primary</div>
<div className="bg-secondary text-secondary-foreground">secondary</div>
<div className="bg-muted text-muted-foreground">muted</div>
<div className="bg-destructive text-destructive-foreground">destructive</div>
<div className="bg-accent text-accent-foreground">accent</div>
<div className="bg-card text-card-foreground ring-1 ring-border">card</div>
<div className="bg-background text-foreground ring-1 ring-border">background</div>
<div className="bg-popover text-popover-foreground ring-1 ring-border">popover</div>`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                bg: "bg-primary",
                fg: "text-primary-foreground",
                label: "primary",
              },
              {
                bg: "bg-secondary",
                fg: "text-secondary-foreground",
                label: "secondary",
              },
              { bg: "bg-muted", fg: "text-muted-foreground", label: "muted" },
              {
                bg: "bg-destructive",
                fg: "text-destructive-foreground",
                label: "destructive",
              },
              {
                bg: "bg-accent",
                fg: "text-accent-foreground",
                label: "accent",
              },
              {
                bg: "bg-card ring-1 ring-border",
                fg: "text-card-foreground",
                label: "card",
              },
              {
                bg: "bg-background ring-1 ring-border",
                fg: "text-foreground",
                label: "background",
              },
              {
                bg: "bg-popover ring-1 ring-border",
                fg: "text-popover-foreground",
                label: "popover",
              },
            ].map(({ bg, fg, label }) => (
              <div key={label} className={`rounded-lg p-4 ${bg}`}>
                <p className={`font-mono text-xs ${fg}`}>{label}</p>
              </div>
            ))}
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Border and ring tokens"
          code={`<div className="border border-border">border</div>
<div className="ring-1 ring-border">ring-1 ring-border</div>
<div className="ring-2 ring-primary">ring-2 ring-primary</div>`}
        >
          <div className="flex flex-wrap gap-4">
            <div className="rounded-lg border border-border p-4 text-sm">
              border-border
            </div>
            <div className="rounded-lg p-4 text-sm ring-1 ring-border">
              ring-1 ring-border
            </div>
            <div className="rounded-lg p-4 text-sm ring-2 ring-primary">
              ring-2 ring-primary
            </div>
            <div className="rounded-lg p-4 text-sm ring-2 ring-destructive">
              ring-2 ring-destructive
            </div>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
