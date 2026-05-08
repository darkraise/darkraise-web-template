import * as React from "react"
import { ChevronRight, Copy } from "lucide-react"
import { cn } from "@lib/utils"
import "./json-tree-view.css"

export interface JsonTreeViewProps extends React.HTMLAttributes<HTMLDivElement> {
  data: unknown
  defaultExpandLevel?: number
  copyable?: boolean
}

type JsonType = "object" | "array" | "string" | "number" | "boolean" | "null"

function typeOf(v: unknown): JsonType {
  if (v === null || v === undefined) return "null"
  if (Array.isArray(v)) return "array"
  if (typeof v === "object") return "object"
  if (typeof v === "string") return "string"
  if (typeof v === "number") return "number"
  if (typeof v === "boolean") return "boolean"
  return "null"
}

function summary(v: unknown): string {
  const t = typeOf(v)
  if (t === "array") return `Array(${(v as unknown[]).length})`
  if (t === "object") return `{${Object.keys(v as object).length}}`
  return ""
}

function JsonTreeView({
  data,
  defaultExpandLevel = 1,
  copyable = false,
  className,
  ...rest
}: JsonTreeViewProps) {
  return (
    <div className={cn("dr-json-tree", className)} {...rest}>
      <Node
        value={data}
        keyName={null}
        depth={0}
        defaultExpandLevel={defaultExpandLevel}
        copyable={copyable}
      />
    </div>
  )
}

interface NodeProps {
  value: unknown
  keyName: string | null
  depth: number
  defaultExpandLevel: number
  copyable: boolean
}

function Node({
  value,
  keyName,
  depth,
  defaultExpandLevel,
  copyable,
}: NodeProps) {
  const t = typeOf(value)
  const isContainer = t === "object" || t === "array"
  const [expanded, setExpanded] = React.useState(depth < defaultExpandLevel)

  const renderPrimitive = () => {
    if (t === "string")
      return <span className="dr-json-string">"{value as string}"</span>
    if (t === "number")
      return <span className="dr-json-number">{String(value)}</span>
    if (t === "boolean")
      return <span className="dr-json-boolean">{String(value)}</span>
    if (t === "null") return <span className="dr-json-null">null</span>
    return null
  }

  const onCopy = () => {
    void navigator.clipboard.writeText(JSON.stringify(value, null, 2))
  }

  return (
    <div className="dr-json-row" style={{ paddingLeft: depth * 12 }}>
      <div className="dr-json-line">
        {isContainer ? (
          <button
            type="button"
            aria-label={keyName !== null ? `Toggle ${keyName}` : "Toggle root"}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
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
          <span className="dr-json-key">{keyName}</span>
        ) : null}
        {keyName !== null && !isContainer ? <span>: </span> : null}
        {isContainer ? (
          <span className="dr-json-summary">{summary(value)}</span>
        ) : (
          renderPrimitive()
        )}
        {copyable && isContainer ? (
          <button
            type="button"
            aria-label={`Copy ${keyName ?? "root"}`}
            onClick={onCopy}
            className="dr-json-copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      {isContainer && expanded ? (
        <div className="dr-json-children">
          {t === "array"
            ? (value as unknown[]).map((item, i) => (
                <Node
                  key={i}
                  value={item}
                  keyName={String(i)}
                  depth={depth + 1}
                  defaultExpandLevel={defaultExpandLevel}
                  copyable={copyable}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <Node
                  key={k}
                  value={v}
                  keyName={k}
                  depth={depth + 1}
                  defaultExpandLevel={defaultExpandLevel}
                  copyable={copyable}
                />
              ))}
        </div>
      ) : null}
    </div>
  )
}

export { JsonTreeView }
