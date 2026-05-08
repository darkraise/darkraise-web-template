import { useEffect, useMemo, useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import * as LucideIcons from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Check,
  Copy,
  Heart,
  Home,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Button } from "darkraise-ui/components/button"
import { Input } from "darkraise-ui/components/input"
import { Badge } from "darkraise-ui/components/badge"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/icons")({
  component: IconsPage,
})

interface IconEntry {
  name: string
  Component: LucideIcon
}

const NON_ICON_EXPORTS = new Set([
  "Icon",
  "LucideIcon",
  "createLucideIcon",
  "icons",
  "default",
])

const ALL_ICONS: IconEntry[] = (() => {
  const seen = new Map<unknown, IconEntry>()
  for (const [name, value] of Object.entries(
    LucideIcons as unknown as Record<string, unknown>,
  )) {
    if (NON_ICON_EXPORTS.has(name)) continue
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue
    if (name.endsWith("Icon")) continue
    if (name.startsWith("Lucide")) continue
    if (typeof value !== "object" || value === null) continue
    if (!("$$typeof" in value)) continue
    const existing = seen.get(value)
    if (
      !existing ||
      name.length < existing.name.length ||
      (name.length === existing.name.length && name < existing.name)
    ) {
      seen.set(value, { name, Component: value as LucideIcon })
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
})()

const TILE_MIN_WIDTH = 104
const TILE_HEIGHT = 96
const GAP = 8

function IconsPage() {
  return (
    <ShowcasePage
      title="Icons"
      description="Icon primitives from lucide-react. Browse the full catalog or learn the usage conventions used throughout this template."
    >
      <UsagePatterns />
      <IconCatalog />
    </ShowcasePage>
  )
}

function UsagePatterns() {
  return (
    <div className="space-y-6">
      <ShowcaseExample
        title="Sizes"
        code={`// Conventional Tailwind sizes for lucide icons
<Home className="size-3" />   // 12px — dense tables, tags
<Home className="size-4" />   // 16px — inline with body text, buttons
<Home className="size-5" />   // 20px — nav items, inputs
<Home className="size-6" />   // 24px — page headers, toolbar
<Home className="size-8" />   // 32px — empty states, hero`}
      >
        <div className="text-muted-foreground flex flex-wrap items-end gap-6">
          {[3, 4, 5, 6, 8].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Home className={`size-${size}`} />
              <span className="font-mono text-xs">size-{size}</span>
            </div>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Colors via text tokens"
        code={`// Lucide icons inherit currentColor — style with any text-* token
<Star className="size-5 text-muted-foreground" />
<Star className="size-5 text-foreground" />
<Star className="size-5 text-primary" />
<Star className="size-5 text-destructive" />
<Star className="size-5 text-amber-500" />`}
      >
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Star className="text-muted-foreground size-6" />
            <span className="text-muted-foreground font-mono text-xs">
              muted
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Star className="text-foreground size-6" />
            <span className="text-muted-foreground font-mono text-xs">
              foreground
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Star className="text-primary size-6" />
            <span className="text-muted-foreground font-mono text-xs">
              primary
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Star className="text-destructive size-6" />
            <span className="text-muted-foreground font-mono text-xs">
              destructive
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Star className="size-6 text-amber-500" />
            <span className="text-muted-foreground font-mono text-xs">
              amber-500
            </span>
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stroke width"
        code={`// Override the default 2px stroke via strokeWidth
<Heart className="size-8" strokeWidth={1} />
<Heart className="size-8" strokeWidth={1.5} />
<Heart className="size-8" />              // default 2
<Heart className="size-8" strokeWidth={2.5} />`}
      >
        <div className="flex flex-wrap items-center gap-6">
          {[1, 1.5, 2, 2.5].map((stroke) => (
            <div key={stroke} className="flex flex-col items-center gap-2">
              <Heart className="size-8" strokeWidth={stroke} />
              <span className="text-muted-foreground font-mono text-xs">
                {stroke}
              </span>
            </div>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Icon with text"
        code={`// Inline with text — use inline-flex + gap-2 and a relative size
<span className="inline-flex items-center gap-2">
  <Sparkles className="size-4" />
  New feature
</span>

// Inside a button
<Button>
  <Trash2 className="size-4" />
  Delete
</Button>

// With a badge
<Badge variant="secondary">
  <Check className="size-3" />
  Verified
</Badge>`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-2 text-sm">
            <Sparkles className="size-4" />
            New feature
          </span>
          <Button>
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Badge variant="secondary">
            <Check className="size-3" />
            Verified
          </Badge>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Accessibility"
        code={`// Decorative icon next to a visible label — hide from screen readers
<button>
  <Settings aria-hidden="true" className="size-4" />
  Settings
</button>

// Icon-only button — expose a label so it's announced
<button aria-label="Close dialog">
  <X aria-hidden="true" className="size-4" />
</button>`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline">
            <Settings aria-hidden="true" className="size-4" />
            Settings
          </Button>
          <Button variant="ghost" size="icon" aria-label="Close dialog">
            <X aria-hidden="true" className="size-4" />
          </Button>
          <p className="text-muted-foreground max-w-sm text-xs">
            When an icon sits next to a visible label it is decorative — mark it{" "}
            <code className="font-mono">aria-hidden</code>. Icon-only controls
            need an <code className="font-mono">aria-label</code> so assistive
            tech can announce them.
          </p>
        </div>
      </ShowcaseExample>
    </div>
  )
}

function IconCatalog() {
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(6)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_ICONS
    return ALL_ICONS.filter((entry) => entry.name.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const width = el.clientWidth
      const next = Math.max(
        1,
        Math.floor((width + GAP) / (TILE_MIN_WIDTH + GAP)),
      )
      setColumns(next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rows = useMemo(() => {
    const out: IconEntry[][] = []
    for (let i = 0; i < filtered.length; i += columns) {
      out.push(filtered.slice(i, i + columns))
    }
    return out
  }, [filtered, columns])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => TILE_HEIGHT + GAP,
    overscan: 4,
  })

  useEffect(() => {
    virtualizer.scrollToIndex(0)
  }, [query, virtualizer])

  const handleCopy = (name: string) => {
    const snippet = `import { ${name} } from "lucide-react"`
    void navigator.clipboard.writeText(snippet).then(() => {
      setCopied(name)
      setTimeout(
        () => setCopied((current) => (current === name ? null : current)),
        1500,
      )
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Browse all icons
      </p>
      <div className="border-border bg-card rounded-md border">
        <div className="border-border flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search icons by name…"
              className="pl-9"
              aria-label="Search icons"
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            Showing {filtered.length.toLocaleString()} of{" "}
            {ALL_ICONS.length.toLocaleString()}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="relative h-[520px] overflow-auto"
          role="grid"
          aria-label="Lucide icon catalog"
        >
          {filtered.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              No icons match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index]
                if (!row) return null
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      padding: `0 ${GAP}px`,
                    }}
                  >
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        gap: GAP,
                        paddingTop: GAP,
                      }}
                    >
                      {row.map(({ name, Component }) => {
                        const isCopied = copied === name
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handleCopy(name)}
                            className="group border-border hover:border-primary/60 hover:bg-accent focus-ring relative flex flex-col items-center justify-center gap-2 rounded-md border p-3 text-center transition-colors"
                            style={{ height: TILE_HEIGHT }}
                            title={`Click to copy: import { ${name} } from "lucide-react"`}
                            aria-label={`Copy import for ${name} icon`}
                          >
                            <Component
                              aria-hidden="true"
                              className="text-foreground size-6"
                            />
                            <span className="text-muted-foreground w-full truncate font-mono text-[11px]">
                              {name}
                            </span>
                            <span
                              className={`bg-primary text-primary-foreground pointer-events-none absolute top-1 right-1 flex size-5 items-center justify-center rounded-full transition-opacity ${
                                isCopied ? "opacity-100" : "opacity-0"
                              }`}
                              aria-hidden="true"
                            >
                              {isCopied ? (
                                <Check className="size-3" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Click any icon to copy its import statement. Rendered with{" "}
        <code className="font-mono">@tanstack/react-virtual</code> — only rows
        in view are mounted.
      </p>
    </div>
  )
}
