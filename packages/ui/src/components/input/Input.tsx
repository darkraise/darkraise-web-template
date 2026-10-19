import * as React from "react"

import { cn } from "@lib/utils"
import "./input.css"

export interface InputProps extends Omit<
  React.ComponentProps<"input">,
  "prefix"
> {
  /** Static content rendered to the left of the input. Renders in a
   *  muted slot with a divider against the input — use for units,
   *  currency symbols, protocols. Pass a string or any ReactNode.
   *
   *  Any slot (`prefix`, `suffix`, `leadingAction`, `trailingAction`) set
   *  to a value other than `undefined` renders the wrapping group; `null`
   *  and `false` keep the group with that slot empty. When a slot is
   *  conditional, pass `null`, not `undefined`, so the input keeps its
   *  node, focus and selection when the slot content appears or
   *  disappears. */
  prefix?: React.ReactNode
  /** Static content rendered to the right of the input. Pass `null`,
   *  not `undefined`, when it is conditional (see `prefix`). */
  suffix?: React.ReactNode
  /** Action button rendered on the leading edge inside the input's
   *  border. Transparent slot with no divider — pass a clickable
   *  element (e.g. `<Button variant="ghost" size="icon">`). Use this
   *  instead of `prefix` for interactive elements so the visual
   *  treatment matches (ghost button vs muted addon). Pass `null`, not
   *  `undefined`, when it is conditional (see `prefix`). */
  leadingAction?: React.ReactNode
  /** Action button rendered on the trailing edge inside the input's
   *  border. Common uses: clear, password toggle, copy. Pass `null`, not
   *  `undefined`, when it is conditional (see `prefix`). */
  trailingAction?: React.ReactNode
  /** Class applied to the wrapping group when any of `prefix`, `suffix`,
   *  `leadingAction`, or `trailingAction` is not `undefined`. */
  groupClassName?: string
}

function hasContent(slot: React.ReactNode) {
  return slot != null && slot !== false
}

function Input({
  className,
  type,
  prefix,
  suffix,
  leadingAction,
  trailingAction,
  groupClassName,
  ref,
  ...props
}: InputProps) {
  const hasAddon = [prefix, suffix, leadingAction, trailingAction].some(
    (slot) => slot !== undefined,
  )

  // Bare input — preserves the original element shape for consumers who
  // don't use any addon slot, including those that target the input
  // element via className.
  if (!hasAddon) {
    return (
      <input
        type={type}
        className={cn("dr-input", className)}
        ref={ref}
        {...props}
      />
    )
  }
  // Grouped form — the wrapper owns the border and focus ring; the input
  // is inset and transparent. Slot order matches reading order:
  // prefix → leadingAction → input → trailingAction → suffix.
  return (
    <div className={cn("dr-input-group", groupClassName)}>
      {hasContent(prefix) && (
        <span className="dr-input-addon" data-side="prefix">
          {prefix}
        </span>
      )}
      {hasContent(leadingAction) && (
        <span className="dr-input-action" data-side="leading">
          {leadingAction}
        </span>
      )}
      <input
        type={type}
        className={cn("dr-input", "dr-input-grouped", className)}
        ref={ref}
        {...props}
      />
      {hasContent(trailingAction) && (
        <span className="dr-input-action" data-side="trailing">
          {trailingAction}
        </span>
      )}
      {hasContent(suffix) && (
        <span className="dr-input-addon" data-side="suffix">
          {suffix}
        </span>
      )}
    </div>
  )
}

export { Input }
