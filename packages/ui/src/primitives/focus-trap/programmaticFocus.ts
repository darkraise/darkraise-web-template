let depth = 0

/**
 * Moves focus on the user's behalf, as an overlay does when it opens onto its
 * first control or hands focus back to its trigger on close. Browsers treat
 * such a move as keyboard focus when the last input was a key (the Escape that
 * closed the overlay, say), so without this mark a tooltip or hover card on
 * the target would open by itself and take the next Escape.
 *
 * The mark lasts only for the synchronous `focus()` call, which is when the
 * focus events fire.
 */
export function focusProgrammatically(
  element: HTMLElement | null | undefined,
  options?: FocusOptions,
): void {
  if (!element) return
  depth += 1
  try {
    element.focus(options)
  } finally {
    depth -= 1
  }
}

/** True while `focusProgrammatically` is moving focus. */
export function isProgrammaticFocus(): boolean {
  return depth > 0
}
