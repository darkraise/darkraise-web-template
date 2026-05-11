import * as React from "react"

import { cn } from "@lib/utils"
import "./textarea.css"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** Action button rendered in the top-right corner of the textarea.
   *  Transparent slot — pass a `<Button variant="ghost" size="icon">` or
   *  any clickable element. Common uses: clear, copy, expand. */
  trailingAction?: React.ReactNode
  /** Class applied to the wrapping group when `trailingAction` is set. */
  groupClassName?: string
}

function Textarea({
  className,
  trailingAction,
  groupClassName,
  ref,
  ...props
}: TextareaProps) {
  // Bare textarea — keep the original element shape when no action is
  // requested. Consumers that rely on className flowing onto <textarea>
  // continue to work.
  if (trailingAction == null) {
    return (
      <textarea className={cn("dr-textarea", className)} ref={ref} {...props} />
    )
  }
  // Wrapped form — relative wrapper hosts the absolute action; the
  // textarea picks up extra right padding so wrapped text doesn't run
  // under the action button.
  return (
    <div className={cn("dr-textarea-group", groupClassName)}>
      <textarea
        className={cn("dr-textarea", "dr-textarea-grouped", className)}
        ref={ref}
        {...props}
      />
      <span className="dr-textarea-action">{trailingAction}</span>
    </div>
  )
}

export { Textarea }
