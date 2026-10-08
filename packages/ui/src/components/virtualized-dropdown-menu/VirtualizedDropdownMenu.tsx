import * as React from "react"

import { cn } from "@lib/utils"
import { useId } from "@primitives/state"
import { useVirtualizer } from "@primitives/virtualizer"
import {
  Popover as PopoverPrimitiveRoot,
  PopoverTrigger as PopoverPrimitiveTrigger,
  PopoverPortal as PopoverPrimitivePortal,
  PopoverContent as PopoverPrimitiveContent,
  usePopoverContext,
} from "@components/popover"
import "./virtualized-dropdown-menu.css"

const VirtualizedDropdownMenu = PopoverPrimitiveRoot

const VirtualizedDropdownMenuTrigger = PopoverPrimitiveTrigger

interface VirtualizedDropdownMenuContentProps<T> {
  items: T[]
  estimateSize?: number
  overscan?: number
  maxHeight?: number
  children: (
    item: T,
    opts: { index: number; isActive: boolean; disabled: boolean },
  ) => React.ReactNode
  onItemSelect?: (item: T, index: number) => void
  /** A disabled row is skipped by the arrow keys, Home and End, and ignores
   *  clicks, Enter and the pointer. */
  isItemDisabled?: (item: T, index: number) => boolean
  className?: string
  sideOffset?: number
  align?: React.ComponentProps<typeof PopoverPrimitiveContent>["align"]
}

function VirtualizedDropdownMenuContent<T>({
  items,
  estimateSize = 32,
  overscan = 5,
  maxHeight = 300,
  children: renderItem,
  onItemSelect,
  isItemDisabled,
  className,
  sideOffset = 4,
  align,
}: VirtualizedDropdownMenuContentProps<T>) {
  const popover = usePopoverContext("VirtualizedDropdownMenuContent")
  const rowIdPrefix = useId()
  const rowId = (index: number) => `${rowIdPrefix}-row-${index}`
  const [activeIndex, setActiveIndex] = React.useState(-1)
  // Mirror activeIndex in a ref so the Enter handler reads the freshest
  // index even when several arrow-key dispatches arrive before React has
  // committed the queued state updates.
  const activeIndexRef = React.useRef(activeIndex)
  React.useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)

  const selectItem = React.useCallback(
    (item: T, index: number) => {
      onItemSelect?.(item, index)
      popover.setOpen(false)
    },
    [onItemSelect, popover],
  )

  const isDisabled = React.useCallback(
    (index: number) => {
      const item = items[index]
      return item === undefined || (isItemDisabled?.(item, index) ?? false)
    },
    [items, isItemDisabled],
  )

  // The next enabled row from `from` in `direction`, wrapping; -1 when every
  // row is disabled. `from` may sit one past either end.
  const nextEnabled = React.useCallback(
    (from: number, direction: 1 | -1) => {
      const count = items.length
      for (let step = 1; step <= count; step += 1) {
        const index = (((from + direction * step) % count) + count) % count
        if (!isDisabled(index)) return index
      }
      return -1
    },
    [items.length, isDisabled],
  )

  const virtualizer = useVirtualizer({
    count: items.length,
    itemHeight: estimateSize,
    getScrollElement: () => scrollElement,
    overscan,
  })

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setActiveIndex((prev) => nextEnabled(prev, 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setActiveIndex((prev) =>
            nextEnabled(prev < 0 ? items.length : prev, -1),
          )
          break
        case "Enter":
          e.preventDefault()
          {
            const idx = activeIndexRef.current
            const item = items[idx]
            if (idx >= 0 && item !== undefined && !isDisabled(idx)) {
              selectItem(item, idx)
            }
          }
          break
        case "Home":
          e.preventDefault()
          setActiveIndex(nextEnabled(-1, 1))
          break
        case "End":
          e.preventDefault()
          setActiveIndex(nextEnabled(items.length, -1))
          break
      }
    },
    [items, isDisabled, nextEnabled, selectItem],
  )

  React.useEffect(() => {
    if (activeIndex >= 0) {
      virtualizer.scrollToIndex(activeIndex, { align: "auto" })
    }
  }, [activeIndex, virtualizer])

  // Home or End can name a row the virtualizer renders only after the
  // scroll that follows, and an id with no element is a broken reference.
  const activeRendered = virtualizer.virtualItems.some(
    (virtualRow) => virtualRow.index === activeIndex,
  )

  return (
    <PopoverPrimitivePortal>
      <PopoverPrimitiveContent
        ref={contentRef}
        role="menu"
        tabIndex={-1}
        aria-activedescendant={activeRendered ? rowId(activeIndex) : undefined}
        sideOffset={sideOffset}
        align={align}
        className={cn("dr-vdm-content", className)}
        onKeyDown={handleKeyDown}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          contentRef.current?.focus()
        }}
      >
        <div
          ref={setScrollElement}
          style={{
            // The content caps itself to the room left on its side; this
            // list shrinks inside it, so the padding and border fit too.
            maxHeight,
            overflowY: "auto",
            overflowX: "hidden",
          }}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          <div
            style={{
              height: virtualizer.totalSize,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.virtualItems.map((virtualRow) => {
              const item = items[virtualRow.index] as T
              const disabled = isDisabled(virtualRow.index)
              return (
                <div
                  key={virtualRow.key}
                  id={rowId(virtualRow.index)}
                  role="menuitem"
                  aria-disabled={disabled || undefined}
                  data-disabled={disabled || undefined}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onMouseEnter={() => {
                    if (!disabled) setActiveIndex(virtualRow.index)
                  }}
                  onClick={() => {
                    if (!disabled) selectItem(item, virtualRow.index)
                  }}
                >
                  {renderItem(item, {
                    index: virtualRow.index,
                    isActive: virtualRow.index === activeIndex,
                    disabled,
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </PopoverPrimitiveContent>
    </PopoverPrimitivePortal>
  )
}

/** The content of a row. The row around it is the menu item: it carries the
 *  role, the id the menu points `aria-activedescendant` at, and the clicks. */
function VirtualizedDropdownMenuItem({
  className,
  isActive,
  disabled,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  isActive?: boolean
  disabled?: boolean
}) {
  return (
    <div
      data-active={isActive || undefined}
      data-disabled={disabled || undefined}
      className={cn("dr-vdm-item", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  VirtualizedDropdownMenu,
  VirtualizedDropdownMenuTrigger,
  VirtualizedDropdownMenuContent,
  VirtualizedDropdownMenuItem,
}

export type { VirtualizedDropdownMenuContentProps }
