import * as React from "react"
import {
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Route,
  Search,
  X,
} from "lucide-react"
import { cn } from "@lib/utils"
import { Button } from "@components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/tooltip"
import "./json-tree-view.css"

// ─── Types ──────────────────────────────────────────────────────────────────

type JsonType = "object" | "array" | "string" | "number" | "boolean" | "null"

export interface JsonTreeViewProps extends React.HTMLAttributes<HTMLDivElement> {
  data: unknown
  /** Auto-expand all containers up to this depth. Default 1. */
  defaultExpandLevel?: number
  /** Show a "Copy value" / "Copy path" toolbar on hover-or-focus of every
   *  row. Default false. */
  copyable?: boolean
  /** Render a toolbar above the tree with a search input and expand-all /
   *  collapse-all buttons. Default false. */
  toolbar?: boolean
  /** Override the search input placeholder. */
  searchPlaceholder?: string
  /** Strings longer than this render with a "Show more" toggle. Default
   *  120. Pass `Infinity` to disable truncation. */
  longStringThreshold?: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function typeOf(v: unknown): JsonType {
  if (v === null || v === undefined) return "null"
  if (Array.isArray(v)) return "array"
  if (typeof v === "object") return "object"
  if (typeof v === "string") return "string"
  if (typeof v === "number") return "number"
  if (typeof v === "boolean") return "boolean"
  return "null"
}

function isContainer(t: JsonType): boolean {
  return t === "object" || t === "array"
}

function isEmpty(v: unknown): boolean {
  const t = typeOf(v)
  if (t === "array") return (v as unknown[]).length === 0
  if (t === "object") return Object.keys(v as object).length === 0
  return false
}

function summary(v: unknown): string {
  const t = typeOf(v)
  if (t === "array") return `Array(${(v as unknown[]).length})`
  if (t === "object") return `{${Object.keys(v as object).length}}`
  return ""
}

// JSONPath-style child path. Object keys requiring bracket access (spaces,
// dots, digits-only) use bracket notation so the emitted path is always
// directly usable in a jq-like expression.
const SAFE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/
function childPath(
  parent: string,
  key: string | number,
  isArrayChild: boolean,
): string {
  if (isArrayChild) return `${parent}[${key}]`
  const k = String(key)
  if (SAFE_KEY.test(k)) return `${parent}.${k}`
  return `${parent}[${JSON.stringify(k)}]`
}

// URL and hex-color detection patterns — kept loose: a real-world JSON value
// rarely matches by accident, and the cost of a false positive is a clickable
// link or a color swatch that the consumer can ignore.
const URL_RE = /^https?:\/\/[^\s]+$/i
const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_RE = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/i

function isUrl(s: string): boolean {
  return URL_RE.test(s)
}
function isColor(s: string): boolean {
  return HEX_RE.test(s) || RGB_RE.test(s)
}

// ─── Search ────────────────────────────────────────────────────────────────
//
// `matches` is the set of paths whose key or stringified primitive value
// contains the search query (case-insensitive). `visible` includes those
// plus every ancestor on the way down — so collapsing the tree to "only
// matching branches" is just `visible.has(path)`.

interface SearchIndex {
  matches: Set<string>
  visible: Set<string>
}

function buildSearchIndex(data: unknown, query: string): SearchIndex {
  const matches = new Set<string>()
  const visible = new Set<string>()
  if (!query) return { matches, visible }
  const q = query.toLowerCase()

  function visit(value: unknown, key: string | null, path: string): boolean {
    const t = typeOf(value)
    let selfHit = false
    if (key !== null && key.toLowerCase().includes(q)) selfHit = true
    if (!isContainer(t)) {
      const str = String(value).toLowerCase()
      if (str.includes(q)) selfHit = true
      if (selfHit) {
        matches.add(path)
        visible.add(path)
      }
      return selfHit
    }
    let childHit = false
    if (t === "array") {
      ;(value as unknown[]).forEach((item, i) => {
        if (visit(item, String(i), childPath(path, i, true))) childHit = true
      })
    } else {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        if (visit(v, k, childPath(path, k, false))) childHit = true
      })
    }
    const hit = selfHit || childHit
    if (hit) {
      visible.add(path)
      if (selfHit) matches.add(path)
    }
    return hit
  }

  visit(data, null, "$")
  return { matches, visible }
}

// Collect every container path up to a given depth — used for the initial
// expansion set so the tree opens to defaultExpandLevel by default.
function pathsToDepth(data: unknown, maxDepth: number): Set<string> {
  const out = new Set<string>()
  function visit(value: unknown, depth: number, path: string) {
    if (depth >= maxDepth) return
    const t = typeOf(value)
    if (!isContainer(t)) return
    out.add(path)
    if (t === "array") {
      ;(value as unknown[]).forEach((item, i) =>
        visit(item, depth + 1, childPath(path, i, true)),
      )
    } else {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) =>
        visit(v, depth + 1, childPath(path, k, false)),
      )
    }
  }
  visit(data, 0, "$")
  return out
}

// Collect every container path — used for "Expand all".
function allContainerPaths(data: unknown): Set<string> {
  const out = new Set<string>()
  function visit(value: unknown, path: string) {
    const t = typeOf(value)
    if (!isContainer(t)) return
    out.add(path)
    if (t === "array") {
      ;(value as unknown[]).forEach((item, i) =>
        visit(item, childPath(path, i, true)),
      )
    } else {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) =>
        visit(v, childPath(path, k, false)),
      )
    }
  }
  visit(data, "$")
  return out
}

// ─── Match highlighting ───────────────────────────────────────────────────

function HighlightedText({
  text,
  query,
  className,
}: {
  text: string
  query: string
  className?: string
}) {
  if (!query) return <span className={className}>{text}</span>
  const lower = text.toLowerCase()
  const needle = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let cursor = 0
  let idx = lower.indexOf(needle, cursor)
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx))
    parts.push(
      <mark key={`m-${idx}`} className="dr-json-mark">
        {text.slice(idx, idx + needle.length)}
      </mark>,
    )
    cursor = idx + needle.length
    idx = lower.indexOf(needle, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return <span className={className}>{parts}</span>
}

// ─── Container preview ────────────────────────────────────────────────────
//
// When a container is collapsed, render a short inline preview so the user
// can scan structure without expanding. Bounded character count keeps deep
// or wide trees from blowing up the preview row.

const PREVIEW_MAX_CHARS = 60

function previewValue(v: unknown, budget: number): string {
  if (budget <= 0) return "…"
  const t = typeOf(v)
  if (t === "string") {
    const s = v as string
    return JSON.stringify(s.length > 24 ? s.slice(0, 24) + "…" : s)
  }
  if (t === "number") return String(v)
  if (t === "boolean") return String(v)
  if (t === "null") return "null"
  if (t === "array") {
    if ((v as unknown[]).length === 0) return "[]"
    return `[${(v as unknown[])
      .slice(0, 3)
      .map((x) => previewValue(x, budget - 4))
      .join(", ")}${(v as unknown[]).length > 3 ? ", …" : ""}]`
  }
  if (t === "object") {
    const entries = Object.entries(v as Record<string, unknown>)
    if (entries.length === 0) return "{}"
    return `{${entries
      .slice(0, 3)
      .map(([k, val]) => `${k}: ${previewValue(val, budget - k.length - 4)}`)
      .join(", ")}${entries.length > 3 ? ", …" : ""}}`
  }
  return ""
}

function containerPreview(v: unknown): string {
  const raw = previewValue(v, PREVIEW_MAX_CHARS)
  if (raw.length > PREVIEW_MAX_CHARS) {
    return raw.slice(0, PREVIEW_MAX_CHARS - 1) + "…"
  }
  return raw
}

// ─── Context ──────────────────────────────────────────────────────────────

interface TreeApi {
  copyable: boolean
  longStringThreshold: number
  query: string
  search: SearchIndex
  isExpanded: (path: string) => boolean
  toggleExpand: (path: string) => void
  focusedPath: string | null
  setFocusedPath: (path: string | null) => void
  rootRef: React.RefObject<HTMLDivElement | null>
}

const TreeContext = React.createContext<TreeApi | null>(null)

function useTreeContext(): TreeApi {
  const ctx = React.useContext(TreeContext)
  if (!ctx) throw new Error("Tree component used outside JsonTreeView")
  return ctx
}

// ─── Root ─────────────────────────────────────────────────────────────────

function JsonTreeView({
  data,
  defaultExpandLevel = 1,
  copyable = false,
  toolbar = false,
  searchPlaceholder = "Search keys and values…",
  longStringThreshold = 120,
  className,
  ...rest
}: JsonTreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(() =>
    pathsToDepth(data, defaultExpandLevel),
  )
  const [query, setQuery] = React.useState("")
  const [focusedPath, setFocusedPath] = React.useState<string | null>(null)
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  // Cache the previous query so we only auto-expand on transitions from
  // empty→non-empty (or query change), not on every keystroke that already
  // had the right paths expanded.
  const prevQueryRef = React.useRef("")

  const search = React.useMemo(
    () => buildSearchIndex(data, query),
    [data, query],
  )

  // When the search query changes, ensure every visible (ancestor-of-match)
  // path is expanded so matches are reachable without a manual expand pass.
  React.useEffect(() => {
    if (query && query !== prevQueryRef.current) {
      setExpanded((prev) => {
        const next = new Set(prev)
        search.visible.forEach((p) => next.add(p))
        return next
      })
    }
    prevQueryRef.current = query
  }, [query, search])

  const isExpanded = React.useCallback(
    (path: string) => expanded.has(path),
    [expanded],
  )

  const toggleExpand = React.useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const expandAll = React.useCallback(() => {
    setExpanded(allContainerPaths(data))
  }, [data])

  const collapseAll = React.useCallback(() => {
    setExpanded(new Set())
  }, [])

  const api = React.useMemo<TreeApi>(
    () => ({
      copyable,
      longStringThreshold,
      query,
      search,
      isExpanded,
      toggleExpand,
      focusedPath,
      setFocusedPath,
      rootRef,
    }),
    [
      copyable,
      longStringThreshold,
      query,
      search,
      isExpanded,
      toggleExpand,
      focusedPath,
    ],
  )

  // Keyboard navigation: move focus between visible treeitems via the DOM.
  // Using DOM order rather than maintaining an in-memory visible list keeps
  // the navigation logic decoupled from how rows decide to hide themselves
  // (search filter, collapsed parent, etc.).
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root) return
    const rows = Array.from(
      root.querySelectorAll<HTMLDivElement>('[role="treeitem"]'),
    )
    if (rows.length === 0) return
    const active = document.activeElement as HTMLElement | null
    const currentIdx = active
      ? rows.findIndex((row) => row === active || row.contains(active))
      : -1

    const focusRow = (idx: number) => {
      const target = rows[Math.max(0, Math.min(rows.length - 1, idx))]
      if (target) {
        target.focus()
        setFocusedPath(target.getAttribute("data-path"))
      }
    }
    const focusedRow = currentIdx >= 0 ? rows[currentIdx] : null
    const focusedRowPath = focusedRow?.getAttribute("data-path") ?? null
    const focusedRowExpanded =
      focusedRow?.getAttribute("aria-expanded") === "true"
    const focusedRowIsContainer =
      focusedRow?.getAttribute("aria-expanded") !== null

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        focusRow(currentIdx < 0 ? 0 : currentIdx + 1)
        break
      case "ArrowUp":
        event.preventDefault()
        focusRow(currentIdx < 0 ? 0 : currentIdx - 1)
        break
      case "ArrowRight":
        event.preventDefault()
        if (focusedRowIsContainer && !focusedRowExpanded && focusedRowPath) {
          toggleExpand(focusedRowPath)
        } else if (focusedRowIsContainer && focusedRowExpanded) {
          focusRow(currentIdx + 1)
        }
        break
      case "ArrowLeft":
        event.preventDefault()
        if (focusedRowIsContainer && focusedRowExpanded && focusedRowPath) {
          toggleExpand(focusedRowPath)
        } else {
          // Move to parent row: find a previous row whose depth is smaller.
          const currentLevel = parseInt(
            focusedRow?.getAttribute("aria-level") ?? "1",
            10,
          )
          for (let i = currentIdx - 1; i >= 0; i -= 1) {
            const row = rows[i]
            const lvl = parseInt(row?.getAttribute("aria-level") ?? "1", 10)
            if (lvl < currentLevel) {
              focusRow(i)
              break
            }
          }
        }
        break
      case "Home":
        event.preventDefault()
        focusRow(0)
        break
      case "End":
        event.preventDefault()
        focusRow(rows.length - 1)
        break
      case "Enter":
      case " ":
        if (focusedRowIsContainer && focusedRowPath) {
          event.preventDefault()
          toggleExpand(focusedRowPath)
        }
        break
    }
  }

  return (
    <div ref={rootRef} className={cn("dr-json-tree", className)} {...rest}>
      <TreeContext.Provider value={api}>
        {toolbar ? (
          <Toolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder={searchPlaceholder}
            expandAll={expandAll}
            collapseAll={collapseAll}
            matchCount={search.matches.size}
          />
        ) : null}
        <div
          role="tree"
          aria-label="JSON tree"
          className="dr-json-tree-body"
          tabIndex={focusedPath ? -1 : 0}
          onKeyDown={handleKeyDown}
        >
          <Node value={data} keyName={null} path="$" depth={0} />
        </div>
      </TreeContext.Provider>
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────

function Toolbar({
  query,
  onQueryChange,
  searchPlaceholder,
  expandAll,
  collapseAll,
  matchCount,
}: {
  query: string
  onQueryChange: (next: string) => void
  searchPlaceholder: string
  expandAll: () => void
  collapseAll: () => void
  matchCount: number
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="dr-json-toolbar"
        role="toolbar"
        aria-label="JSON tree controls"
      >
        {/* Search section — bare input nested inside the toolbar surface so
         * the whole bar reads as one integrated control rather than a row
         * of disjoint widgets. */}
        <div className="dr-json-toolbar-search">
          <Search className="dr-json-toolbar-search-icon" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="dr-json-toolbar-search-input"
            aria-label="Search keys and values"
          />
          {query ? (
            <>
              <span className="dr-json-toolbar-match-count">
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Clear search"
                    className="dr-json-toolbar-clear"
                    onClick={() => onQueryChange("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear search</TooltipContent>
              </Tooltip>
            </>
          ) : null}
        </div>
        <span className="dr-json-toolbar-divider" />
        {/* Action group — icon-only buttons with tooltips, sized to match
         * the search input height for a single-line bar. */}
        <div className="dr-json-toolbar-actions" role="group">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Expand all"
                className="dr-json-toolbar-action"
                onClick={expandAll}
              >
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Expand all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Collapse all"
                className="dr-json-toolbar-action"
                onClick={collapseAll}
              >
                <ChevronsDownUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Collapse all</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}

// ─── Row actions (copy path / copy value) ──────────────────────────────────

function CopyButton({
  value,
  label,
  icon,
}: {
  value: string
  label: string
  icon: React.ReactNode
}) {
  const [copied, setCopied] = React.useState(false)
  const timerRef = React.useRef<number | null>(null)
  const onClick = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCopied(false), 1200)
    })
  }
  React.useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={copied ? "Copied!" : label}
      onClick={onClick}
      className="dr-json-row-action"
      data-state={copied ? "copied" : undefined}
    >
      {icon}
    </Button>
  )
}

// ─── Primitive renderer with smart detection ───────────────────────────────

function StringValue({
  value,
  query,
  threshold,
}: {
  value: string
  query: string
  threshold: number
}) {
  const [showFull, setShowFull] = React.useState(false)
  const isLong = value.length > threshold
  const displayed = isLong && !showFull ? value.slice(0, threshold) : value

  if (isUrl(value)) {
    return (
      <span className="dr-json-string">
        "
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="dr-json-url"
          onClick={(e) => e.stopPropagation()}
        >
          <HighlightedText text={value} query={query} />
        </a>
        "
      </span>
    )
  }
  if (isColor(value)) {
    return (
      <span className="dr-json-string">
        <span
          className="dr-json-color-swatch"
          style={{ background: value }}
          aria-hidden
        />
        "<HighlightedText text={value} query={query} />"
      </span>
    )
  }
  return (
    <span className="dr-json-string">
      "<HighlightedText text={displayed} query={query} />
      {isLong && !showFull ? "…" : ""}"
      {isLong ? (
        <button
          type="button"
          className="dr-json-show-more"
          onClick={(e) => {
            e.stopPropagation()
            setShowFull((v) => !v)
          }}
        >
          {showFull ? "less" : "more"}
        </button>
      ) : null}
    </span>
  )
}

function PrimitiveValue({
  value,
  query,
  threshold,
}: {
  value: unknown
  query: string
  threshold: number
}) {
  const t = typeOf(value)
  if (t === "string") {
    return (
      <StringValue
        value={value as string}
        query={query}
        threshold={threshold}
      />
    )
  }
  if (t === "number") {
    return (
      <span className="dr-json-number">
        <HighlightedText text={String(value)} query={query} />
      </span>
    )
  }
  if (t === "boolean") {
    return (
      <span className="dr-json-boolean">
        <HighlightedText text={String(value)} query={query} />
      </span>
    )
  }
  return <span className="dr-json-null">null</span>
}

// ─── Node ─────────────────────────────────────────────────────────────────

interface NodeProps {
  value: unknown
  keyName: string | null
  path: string
  depth: number
}

function Node({ value, keyName, path, depth }: NodeProps) {
  const ctx = useTreeContext()
  const t = typeOf(value)
  const containerLike = isContainer(t)
  const empty = isEmpty(value)
  const expanded = ctx.isExpanded(path)
  const showChildren = containerLike && !empty && expanded

  // Filter hiding: when the user searches, only paths in `visible` should
  // render. The root is always shown so the user has somewhere to type.
  if (ctx.query && depth > 0 && !ctx.search.visible.has(path)) return null

  const isMatch = ctx.search.matches.has(path)
  const rowFocused = ctx.focusedPath === path

  // Render an inline empty marker for {} and [] instead of a chevron-led
  // row that opens to nothing.
  const inlineEmpty =
    containerLike && empty ? (
      <span className="dr-json-empty">{t === "array" ? "[]" : "{}"}</span>
    ) : null

  return (
    <div
      role="treeitem"
      tabIndex={rowFocused ? 0 : -1}
      aria-level={depth + 1}
      aria-expanded={containerLike && !empty ? expanded : undefined}
      data-path={path}
      data-matching={isMatch ? "true" : undefined}
      data-focused={rowFocused ? "true" : undefined}
      className="dr-json-row"
      style={{ paddingLeft: depth * 14 + 4 }}
      onFocus={() => ctx.setFocusedPath(path)}
    >
      <div className="dr-json-line">
        {containerLike && !empty ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Toggle ${keyName ?? "root"}`}
            aria-expanded={expanded}
            onClick={(e) => {
              e.stopPropagation()
              ctx.toggleExpand(path)
            }}
            className="dr-json-chevron"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="dr-json-chevron-spacer" />
        )}
        {keyName !== null ? (
          <span className="dr-json-key">
            <HighlightedText text={keyName} query={ctx.query} />
          </span>
        ) : null}
        {keyName !== null ? <span className="dr-json-punct">: </span> : null}
        {containerLike ? (
          empty ? (
            inlineEmpty
          ) : (
            <>
              <span className="dr-json-summary">{summary(value)}</span>
              {!expanded ? (
                <span className="dr-json-preview">
                  {containerPreview(value)}
                </span>
              ) : null}
            </>
          )
        ) : (
          <PrimitiveValue
            value={value}
            query={ctx.query}
            threshold={ctx.longStringThreshold}
          />
        )}
        {ctx.copyable ? (
          <span className="dr-json-row-actions">
            <CopyButton
              value={path}
              label="Copy path"
              icon={<Route className="h-3 w-3" />}
            />
            <CopyButton
              value={
                containerLike
                  ? JSON.stringify(value, null, 2)
                  : typeOf(value) === "string"
                    ? (value as string)
                    : String(value)
              }
              label="Copy value"
              icon={<Copy className="h-3 w-3" />}
            />
          </span>
        ) : null}
      </div>
      {showChildren ? (
        <div className="dr-json-children">
          {t === "array"
            ? (value as unknown[]).map((item, i) => (
                <Node
                  key={i}
                  value={item}
                  keyName={String(i)}
                  path={childPath(path, i, true)}
                  depth={depth + 1}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <Node
                  key={k}
                  value={v}
                  keyName={k}
                  path={childPath(path, k, false)}
                  depth={depth + 1}
                />
              ))}
        </div>
      ) : null}
    </div>
  )
}

export { JsonTreeView }
