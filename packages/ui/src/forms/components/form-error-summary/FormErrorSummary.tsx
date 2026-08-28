import { useEffect, useRef } from "react"

import { useId } from "@primitives/state"

import { cn } from "@lib/utils"
import "./form-error-summary.css"

export interface FormErrorSummaryEntry {
  /** The `name` of the field this error belongs to, used to link to it. */
  name: string
  message: string
}

export interface FormErrorSummaryProps {
  errors: FormErrorSummaryEntry[]
  /** Heading above the list. */
  title?: string
  /**
   * Bumping this focuses the summary again. Pass a submit counter so a second
   * failed submit re-announces the same errors instead of sitting silent.
   */
  submitCount?: number
  className?: string
}

/**
 * The post-submit error summary: a focusable region listing every invalid
 * field, each entry linking to the field itself.
 *
 * Inline field errors stay where they are — this sits above them, because a
 * long form can push the first error far below the fold and a per-field
 * `role="alert"` announces only whichever error happens to change last.
 *
 * Focus moves here after a failed submit. That is the part which does the work
 * for a keyboard or screen reader user: it puts them at the top of the list of
 * what went wrong, with a route to each field, rather than leaving them
 * wherever the submit button was.
 */
export function FormErrorSummary({
  errors,
  title = "There is a problem",
  submitCount,
  className,
}: FormErrorSummaryProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (errors.length === 0) return
    ref.current?.focus()
    // `submitCount` is in the deps so a repeat submit with an unchanged error
    // list still moves focus; without it the effect would not re-run.
  }, [errors.length, submitCount])

  if (errors.length === 0) return null

  return (
    <div
      ref={ref}
      // -1 rather than 0: this is a focus destination, not a tab stop. Leaving
      // it in the tab order would make every keyboard user pass through a
      // region that is empty most of the time.
      tabIndex={-1}
      role="alert"
      aria-labelledby={titleId}
      className={cn("dr-form-error-summary", className)}
    >
      <h2 id={titleId} className="dr-form-error-summary-title">
        {title}
      </h2>
      <ul className="dr-form-error-summary-list">
        {errors.map((error) => (
          <li key={error.name}>
            <a
              href={`#${error.name}`}
              onClick={(event) => {
                // The anchor is the no-JS path and the accessible affordance;
                // this makes it actually land focus on the control, which a
                // hash jump alone does not do for every element type.
                const field = document.getElementById(error.name)
                if (!field) return
                event.preventDefault()
                field.focus()
                // Optional call, matching Tour: jsdom implements no
                // scrollIntoView, and neither do all embedded engines.
                field.scrollIntoView?.({ block: "center", behavior: "auto" })
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
