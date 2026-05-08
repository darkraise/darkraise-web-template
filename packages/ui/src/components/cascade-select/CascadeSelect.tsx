import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@lib/utils"
import { Button } from "@components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"
import { useControllableState } from "@primitives/state"
import "./cascade-select.css"

export interface CascadeOption {
  value: string
  label: React.ReactNode
  children?: CascadeOption[]
  disabled?: boolean
}

export interface CascadeSelectProps {
  options: CascadeOption[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (path: string[]) => void
  placeholder?: React.ReactNode
  disabled?: boolean
  className?: string
}

function findLabelByPath(
  options: CascadeOption[],
  path: string[],
): React.ReactNode | null {
  let current = options
  let label: React.ReactNode | null = null
  for (const segment of path) {
    const found = current.find((o) => o.value === segment)
    if (!found) return null
    label = found.label
    current = found.children ?? []
  }
  return label
}

function CascadeSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  disabled,
  className,
}: CascadeSelectProps) {
  const [path, setPath] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  })
  const [open, setOpen] = React.useState(false)
  const [hoverPath, setHoverPath] = React.useState<string[]>([])

  const columns: Array<{
    items: CascadeOption[]
    activeValue: string | undefined
  }> = React.useMemo(() => {
    const cols: Array<{
      items: CascadeOption[]
      activeValue: string | undefined
    }> = []
    let cur: CascadeOption[] = options
    cols.push({ items: cur, activeValue: hoverPath[0] })
    for (let i = 0; i < hoverPath.length; i++) {
      const seg = hoverPath[i]
      if (seg === undefined) break
      const found = cur.find((o) => o.value === seg)
      if (!found || !found.children?.length) break
      cur = found.children
      cols.push({ items: cur, activeValue: hoverPath[i + 1] })
    }
    return cols
  }, [options, hoverPath])

  const onSelectAt = (depth: number, option: CascadeOption) => {
    const next = [...hoverPath.slice(0, depth), option.value]
    if (option.children?.length) {
      setHoverPath(next)
      return
    }
    setPath(next)
    setOpen(false)
    setHoverPath([])
  }

  const onHoverAt = (depth: number, option: CascadeOption) => {
    setHoverPath([...hoverPath.slice(0, depth), option.value])
  }

  const label =
    (path.length > 0 && findLabelByPath(options, path)) || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn("dr-cascade-trigger", className)}
        >
          <span>{label}</span>
          <ChevronDown className="ml-auto h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="dr-cascade-popover"
        align="start"
        sideOffset={4}
      >
        <div className="dr-cascade-grid">
          {columns.map((col, depth) => (
            <ul key={depth} role="listbox" className="dr-cascade-column">
              {col.items.map((option) => {
                const active = col.activeValue === option.value
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={active ? "true" : "false"}
                    aria-disabled={option.disabled || undefined}
                    data-active={active ? "true" : undefined}
                    onPointerEnter={() => {
                      if (!option.disabled) onHoverAt(depth, option)
                    }}
                    onClick={() => {
                      if (!option.disabled) onSelectAt(depth, option)
                    }}
                    className={cn(
                      "dr-cascade-item",
                      option.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span className="flex-1">{option.label}</span>
                    {option.children?.length ? (
                      <ChevronRight className="h-4 w-4 opacity-60" />
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { CascadeSelect }
