"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@lib/utils"
import { useEvent } from "@primitives/state"
import "./resizable.css"

export type ResizableOrientation = "horizontal" | "vertical"

interface PanelDescriptor {
  id: string
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

interface PanelGroupContextValue {
  orientation: ResizableOrientation
  registerPanel: (descriptor: PanelDescriptor) => () => void
  panelOrder: string[]
  sizes: Record<string, number>
  startResize: (
    handleIndex: number,
    pointer: { x: number; y: number; pointerId: number },
    rootEl: HTMLElement,
  ) => void
  nudgeHandle: (handleIndex: number, deltaPercent: number) => void
  registerHandleIndex: (id: string) => number
}

const PanelGroupContext = React.createContext<PanelGroupContextValue | null>(
  null,
)

function usePanelGroup(consumer: string): PanelGroupContextValue {
  const ctx = React.useContext(PanelGroupContext)
  if (!ctx)
    throw new Error(`${consumer} must be used inside ResizablePanelGroup`)
  return ctx
}

const DEFAULT_KEYBOARD_STEP_PERCENT = 5

interface PanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: ResizableOrientation
  /** vaul-style direction prop unused here; we follow rrp `orientation`. */
  onLayoutChange?: (sizes: number[]) => void
}

function ResizablePanelGroup({
  className,
  orientation = "horizontal",
  onLayoutChange,
  children,
  ref,
  ...props
}: PanelGroupProps & { ref?: React.Ref<HTMLDivElement> }) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const setRoot = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [ref],
  )

  const [panels, setPanels] = React.useState<PanelDescriptor[]>([])
  const [sizes, setSizes] = React.useState<Record<string, number>>({})

  const handleIdsRef = React.useRef<string[]>([])

  const onLayoutChangeRef = React.useRef(onLayoutChange)
  React.useEffect(() => {
    onLayoutChangeRef.current = onLayoutChange
  }, [onLayoutChange])

  React.useEffect(() => {
    onLayoutChangeRef.current?.(panels.map((p) => sizes[p.id] ?? 0))
  }, [panels, sizes])

  const registerPanel = useEvent((descriptor: PanelDescriptor) => {
    setPanels((prev) => {
      if (prev.some((p) => p.id === descriptor.id)) return prev
      return [...prev, descriptor]
    })
    return () => {
      setPanels((prev) => prev.filter((p) => p.id !== descriptor.id))
      setSizes((prev) => {
        const { [descriptor.id]: _omit, ...rest } = prev
        void _omit
        return rest
      })
    }
  })

  // Initialize / re-balance sizes whenever panel set changes.
  React.useEffect(() => {
    setSizes((prev) => {
      const next: Record<string, number> = {}
      let total = 0
      let unsetCount = 0
      for (const p of panels) {
        if (prev[p.id] !== undefined) {
          next[p.id] = prev[p.id] as number
          total += prev[p.id] as number
        } else if (p.defaultSize !== undefined) {
          next[p.id] = p.defaultSize
          total += p.defaultSize
        } else {
          unsetCount += 1
        }
      }
      if (unsetCount > 0) {
        const remainder = Math.max(0, 100 - total)
        const each = remainder / unsetCount
        for (const p of panels) {
          if (next[p.id] === undefined) {
            next[p.id] = each
          }
        }
        total += remainder
      }
      // normalise to 100
      if (total > 0 && Math.abs(total - 100) > 0.01) {
        const factor = 100 / total
        for (const id of Object.keys(next)) {
          next[id] = (next[id] as number) * factor
        }
      }
      return next
    })
  }, [panels])

  const clamp = useEvent((id: string, value: number) => {
    const panel = panels.find((p) => p.id === id)
    let next = value
    if (panel?.minSize !== undefined) next = Math.max(panel.minSize, next)
    if (panel?.maxSize !== undefined) next = Math.min(panel.maxSize, next)
    return Math.max(0, Math.min(100, next))
  })

  const applyDelta = useEvent((handleIndex: number, deltaPercent: number) => {
    if (panels.length < 2) return
    const leftId = panels[handleIndex]?.id
    const rightId = panels[handleIndex + 1]?.id
    if (!leftId || !rightId) return
    setSizes((prev) => {
      const leftCurrent = prev[leftId] ?? 0
      const rightCurrent = prev[rightId] ?? 0
      const desiredLeft = leftCurrent + deltaPercent
      const nextLeft = clamp(leftId, desiredLeft)
      const actualDelta = nextLeft - leftCurrent
      const nextRight = clamp(rightId, rightCurrent - actualDelta)
      const finalDelta = rightCurrent - nextRight
      const adjustedLeft = leftCurrent + finalDelta
      return {
        ...prev,
        [leftId]: adjustedLeft,
        [rightId]: nextRight,
      }
    })
  })

  const startResize = useEvent(
    (
      handleIndex: number,
      pointer: { x: number; y: number; pointerId: number },
      rootEl: HTMLElement,
    ) => {
      const rect = rootEl.getBoundingClientRect()
      const totalSize = orientation === "horizontal" ? rect.width : rect.height
      if (totalSize <= 0) return
      const startCoord = orientation === "horizontal" ? pointer.x : pointer.y
      let lastCoord = startCoord
      const move = (event: PointerEvent) => {
        if (event.pointerId !== pointer.pointerId) return
        const coord =
          orientation === "horizontal" ? event.clientX : event.clientY
        const deltaPx = coord - lastCoord
        lastCoord = coord
        const deltaPercent = (deltaPx / totalSize) * 100
        applyDelta(handleIndex, deltaPercent)
      }
      const up = (event: PointerEvent) => {
        if (event.pointerId !== pointer.pointerId) return
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        window.removeEventListener("pointercancel", up)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      window.addEventListener("pointercancel", up)
    },
  )

  const nudgeHandle = useEvent((handleIndex: number, deltaPercent: number) => {
    applyDelta(handleIndex, deltaPercent)
  })

  // Track the order of registered handles so each handle can ask for its own
  // index without consumers wiring the index by hand.
  const registerHandleIndex = useEvent((id: string) => {
    let idx = handleIdsRef.current.indexOf(id)
    if (idx === -1) {
      handleIdsRef.current.push(id)
      idx = handleIdsRef.current.length - 1
    }
    return idx
  })

  const panelOrder = React.useMemo(() => panels.map((p) => p.id), [panels])

  const ctx = React.useMemo<PanelGroupContextValue>(
    () => ({
      orientation,
      registerPanel,
      panelOrder,
      sizes,
      startResize,
      nudgeHandle,
      registerHandleIndex,
    }),
    [
      orientation,
      registerPanel,
      panelOrder,
      sizes,
      startResize,
      nudgeHandle,
      registerHandleIndex,
    ],
  )

  return (
    <PanelGroupContext.Provider value={ctx}>
      <div
        ref={setRoot}
        data-panel-group-direction={orientation}
        className={cn("dr-resizable-panel-group", className)}
        style={{
          display: "flex",
          flexDirection: orientation === "horizontal" ? "row" : "column",
          height: "100%",
          width: "100%",
        }}
        {...props}
      >
        {children}
      </div>
    </PanelGroupContext.Provider>
  )
}

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  id?: string
}

function ResizablePanel({
  className,
  defaultSize,
  minSize,
  maxSize,
  id: idProp,
  children,
  style,
  ref,
  ...props
}: PanelProps & { ref?: React.Ref<HTMLDivElement> }) {
  const ctx = usePanelGroup("ResizablePanel")
  const reactId = React.useId()
  const id = idProp ?? reactId

  const registerPanel = ctx.registerPanel
  React.useEffect(() => {
    return registerPanel({ id, defaultSize, minSize, maxSize })
  }, [id, defaultSize, minSize, maxSize, registerPanel])

  const size = ctx.sizes[id] ?? defaultSize ?? 0

  const flexBasis = ctx.orientation === "horizontal" ? "auto" : "auto"
  const dim = ctx.orientation === "horizontal" ? "width" : "height"

  return (
    <div
      ref={ref}
      data-panel
      data-panel-id={id}
      data-panel-group-direction={ctx.orientation}
      className={className}
      style={{
        flexGrow: 0,
        flexShrink: 0,
        flexBasis,
        [dim]: `${size}%`,
        overflow: "hidden",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}

interface HandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
  step?: number
  disabled?: boolean
  ref?: React.Ref<HTMLDivElement>
}

function ResizableHandle({
  withHandle,
  className,
  step = DEFAULT_KEYBOARD_STEP_PERCENT,
  disabled,
  onPointerDown,
  onKeyDown,
  ref,
  ...props
}: HandleProps) {
  const ctx = usePanelGroup("ResizableHandle")
  const id = React.useId()
  const handleIndex = ctx.registerHandleIndex(id)
  const ariaOrientation =
    ctx.orientation === "horizontal" ? "vertical" : "horizontal"

  const valueNow = React.useMemo(() => {
    const left = ctx.panelOrder[handleIndex]
    if (!left) return undefined
    const v = ctx.sizes[left]
    return v !== undefined ? Math.round(v) : undefined
  }, [ctx.panelOrder, ctx.sizes, handleIndex])

  return (
    <div
      ref={ref}
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-orientation={ariaOrientation}
      aria-valuenow={valueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      data-panel-group-direction={ctx.orientation}
      data-disabled={disabled ? "" : undefined}
      className={cn("dr-resizable-handle", className)}
      style={{
        cursor: disabled
          ? "default"
          : ctx.orientation === "horizontal"
            ? "col-resize"
            : "row-resize",
        touchAction: "none",
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        const root = (event.currentTarget as HTMLElement).closest(
          "[data-panel-group-direction]",
        ) as HTMLElement | null
        if (!root) return
        ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
        ctx.startResize(
          handleIndex,
          {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
          },
          root,
        )
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        if (ctx.orientation === "horizontal") {
          if (event.key === "ArrowLeft") {
            event.preventDefault()
            ctx.nudgeHandle(handleIndex, -step)
          } else if (event.key === "ArrowRight") {
            event.preventDefault()
            ctx.nudgeHandle(handleIndex, step)
          }
        } else {
          if (event.key === "ArrowUp") {
            event.preventDefault()
            ctx.nudgeHandle(handleIndex, -step)
          } else if (event.key === "ArrowDown") {
            event.preventDefault()
            ctx.nudgeHandle(handleIndex, step)
          }
        }
      }}
      {...props}
    >
      {withHandle && (
        <div className="dr-resizable-handle-grip">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
