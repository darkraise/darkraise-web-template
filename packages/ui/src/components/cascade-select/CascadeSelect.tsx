import { useUiText } from "../../i18n/useUiText"
import * as React from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@lib/utils"
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

function firstEnabled(items: CascadeOption[]): CascadeOption | undefined {
  return items.find((option) => !option.disabled)
}

/**
 * The path to open on: a selected path whose last item is disabled ends on
 * its column's first enabled item instead, so focus never lands on an item
 * the keyboard cannot reach.
 */
function openablePath(options: CascadeOption[], path: string[]): string[] {
  let column = options
  for (const value of path.slice(0, -1)) {
    column = column.find((o) => o.value === value)?.children ?? []
  }
  const last = column.find((o) => o.value === path[path.length - 1])
  if (!last?.disabled) return path
  const first = firstEnabled(column)
  return first ? [...path.slice(0, -1), first.value] : path.slice(0, -1)
}

/**
 * Focuses the item the open path ends on, if it is mounted, and scrolls only
 * its own column to it: scrollIntoView would also scroll the page. A hovered
 * item is left where it is, so the list never moves under the pointer.
 */
function focusItem(items: Map<string, HTMLLIElement>, target: string[]) {
  const depth = target.length - 1
  const item = items.get(`${depth}:${target[depth]}`)
  if (!item) return
  item.focus({ preventScroll: true })
  const column = item.parentElement
  if (!column || item.matches(":hover")) return
  const box = item.getBoundingClientRect()
  const view = column.getBoundingClientRect()
  if (box.top < view.top) column.scrollTop -= view.top - box.top
  else if (box.bottom > view.bottom)
    column.scrollTop += box.bottom - view.bottom
}

function CascadeSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder: placeholderLocaleProp,
  disabled,
  className,
}: CascadeSelectProps) {
  const uiText = useUiText()
  const placeholder = placeholderLocaleProp ?? uiText("Select…")

  const [path, setPath] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  })
  const [open, setOpen] = React.useState(false)
  // The open path. Its last value is the focused item, so the keyboard and
  // the pointer move one cursor.
  const [hoverPath, setHoverPath] = React.useState<string[]>([])
  const itemRefs = React.useRef(new Map<string, HTMLLIElement>())

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

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setHoverPath([])
      return
    }
    if (path.length > 0 && findLabelByPath(options, path) !== null) {
      setHoverPath(openablePath(options, path))
      return
    }
    const first = firstEnabled(options)
    setHoverPath(first ? [first.value] : [])
  }

  // Moves after opening. The first focus happens in onOpenAutoFocus below:
  // the popover mounts its content a commit after `open`, so on that commit
  // this effect finds no item.
  React.useEffect(() => {
    if (open) focusItem(itemRefs.current, hoverPath)
  }, [open, hoverPath])

  const onSelectAt = (depth: number, option: CascadeOption) => {
    const next = [...hoverPath.slice(0, depth), option.value]
    if (option.children?.length) {
      setHoverPath(next)
      return
    }
    setPath(next)
    onOpenChange(false)
  }

  const onHoverAt = (depth: number, option: CascadeOption) => {
    setHoverPath([...hoverPath.slice(0, depth), option.value])
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const depth = hoverPath.length - 1
    const column = columns[depth]
    if (!column) return
    const enabled = column.items.filter((o) => !o.disabled)
    const index = enabled.findIndex((o) => o.value === hoverPath[depth])
    const current = enabled[index]
    const moveTo = (option: CascadeOption | undefined) => {
      if (option) setHoverPath([...hoverPath.slice(0, depth), option.value])
    }
    const openChild = () => {
      const child = current?.children
        ? firstEnabled(current.children)
        : undefined
      if (child) setHoverPath([...hoverPath, child.value])
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        moveTo(enabled[index + 1])
        break
      case "ArrowUp":
        event.preventDefault()
        moveTo(index > 0 ? enabled[index - 1] : undefined)
        break
      case "Home":
        event.preventDefault()
        moveTo(enabled[0])
        break
      case "End":
        event.preventDefault()
        moveTo(enabled[enabled.length - 1])
        break
      case "ArrowRight":
        event.preventDefault()
        openChild()
        break
      case "ArrowLeft":
        event.preventDefault()
        if (depth > 0) setHoverPath(hoverPath.slice(0, -1))
        break
      case "Enter":
      case " ":
        event.preventDefault()
        if (!current) break
        if (current.children?.length) openChild()
        else onSelectAt(depth, current)
        break
    }
  }

  const chosen = path.length > 0 ? findLabelByPath(options, path) : null

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-placeholder={chosen ? undefined : ""}
          className={cn("dr-cascade-trigger", className)}
        >
          <span>{chosen || placeholder}</span>
          <ChevronDown
            className="size-[var(--icon-size)] opacity-60"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="dr-cascade-popover"
        align="start"
        sideOffset={4}
        // Runs once the items are mounted and after the popover has recorded
        // the trigger to give focus back to, so focusing an item here does
        // not change what closing restores.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          focusItem(itemRefs.current, hoverPath)
        }}
      >
        <div className="dr-cascade-grid" onKeyDown={onKeyDown}>
          {columns.map((col, depth) => (
            <ul key={depth} role="listbox" className="dr-cascade-column">
              {col.items.map((option) => {
                const active = col.activeValue === option.value
                const focused = active && depth === hoverPath.length - 1
                return (
                  <li
                    key={option.value}
                    ref={(node) => {
                      const key = `${depth}:${option.value}`
                      if (node) itemRefs.current.set(key, node)
                      else itemRefs.current.delete(key)
                    }}
                    role="option"
                    tabIndex={focused ? 0 : -1}
                    // The open item at each depth is that column's selection.
                    aria-selected={active ? "true" : "false"}
                    aria-disabled={option.disabled || undefined}
                    data-active={active ? "true" : undefined}
                    // Move, not enter: a column the keyboard scrolls slides
                    // items under a resting pointer, and Chromium fires
                    // pointerenter for them, pulling focus off the keyboard
                    // row.
                    onPointerMove={() => {
                      if (option.disabled || focused) return
                      onHoverAt(depth, option)
                    }}
                    onClick={() => {
                      if (!option.disabled) onSelectAt(depth, option)
                    }}
                    className="dr-cascade-item"
                  >
                    <span className="flex-1">{option.label}</span>
                    {option.children?.length ? (
                      <ChevronRight
                        className="size-[var(--icon-size)] opacity-60"
                        aria-hidden="true"
                      />
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
