import * as React from "react"

export interface UseLabelOptions {
  onMouseDown?: React.MouseEventHandler<HTMLLabelElement>
}

export interface UseLabelReturn {
  onMouseDown: React.MouseEventHandler<HTMLLabelElement>
}

export function useLabel(options: UseLabelOptions = {}): UseLabelReturn {
  const { onMouseDown } = options

  const handleMouseDown: React.MouseEventHandler<HTMLLabelElement> =
    React.useCallback(
      (event) => {
        const target = event.target as HTMLElement
        if (target.closest("button, input, select, textarea")) return
        onMouseDown?.(event)
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault()
        }
      },
      [onMouseDown],
    )

  return { onMouseDown: handleMouseDown }
}
