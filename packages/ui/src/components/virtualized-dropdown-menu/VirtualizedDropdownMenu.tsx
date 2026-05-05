"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { useVirtualizer } from "@tanstack/react-virtual"

import { cn } from "../../lib/utils"
import "./virtualized-dropdown-menu.css"

const VirtualizedDropdownMenu = PopoverPrimitive.Root

const VirtualizedDropdownMenuTrigger = PopoverPrimitive.Trigger

interface VirtualizedDropdownMenuContentProps<T> {
  items: T[]
  estimateSize?: number
  overscan?: number
  maxHeight?: number
  children: (
    item: T,
    opts: { index: number; isActive: boolean },
  ) => React.ReactNode
  onItemSelect?: (item: T, index: number) => void
  className?: string
  sideOffset?: number
  align?: PopoverPrimitive.PopoverContentProps["align"]
}

function VirtualizedDropdownMenuContent<T>({
  items,
  estimateSize = 32,
  overscan = 5,
  maxHeight = 300,
  children: renderItem,
  onItemSelect,
  className,
  sideOffset = 4,
  align,
}: VirtualizedDropdownMenuContentProps<T>) {
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => estimateSize,
    overscan,
  })

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
          break
        case "ArrowUp":
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
          break
        case "Enter":
          e.preventDefault()
          {
            const item = items[activeIndex]
            if (activeIndex >= 0 && item !== undefined) {
              onItemSelect?.(item, activeIndex)
            }
          }
          break
        case "Home":
          e.preventDefault()
          setActiveIndex(0)
          break
        case "End":
          e.preventDefault()
          setActiveIndex(items.length - 1)
          break
      }
    },
    [activeIndex, items, onItemSelect],
  )

  React.useEffect(() => {
    if (activeIndex >= 0) {
      virtualizer.scrollToIndex(activeIndex, { align: "auto" })
    }
  }, [activeIndex, virtualizer])

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={contentRef}
        role="menu"
        tabIndex={-1}
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
            maxHeight,
            overflowY: "auto",
            overflowX: "hidden",
          }}
          onMouseLeave={() => setActiveIndex(-1)}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index] as T
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onMouseEnter={() => setActiveIndex(virtualRow.index)}
                  onClick={() => onItemSelect?.(item, virtualRow.index)}
                >
                  {renderItem(item, {
                    index: virtualRow.index,
                    isActive: virtualRow.index === activeIndex,
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
}

function VirtualizedDropdownMenuItem({
  className,
  isActive,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { isActive?: boolean }) {
  return (
    <div
      role="menuitem"
      data-active={isActive || undefined}
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
