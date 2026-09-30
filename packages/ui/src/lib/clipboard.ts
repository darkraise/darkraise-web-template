/**
 * Copies text, falling back to a selection copy where the async Clipboard API
 * is missing or refuses. The API only exists in secure contexts, so a dev
 * server opened over plain HTTP on a LAN address has no `navigator.clipboard`
 * at all. Rejects with the API's own error when both paths fail.
 */
export async function writeClipboardText(text: string): Promise<void> {
  let apiError: unknown
  // Typed as always present, but absent outside secure contexts.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch (error) {
      apiError = error
    }
  }
  if (copyViaSelection(text)) return
  throw apiError instanceof Error
    ? apiError
    : new Error("Clipboard is unavailable")
}

/* Selects a detached span rather than focusing a textarea: a modal's focus
   trap pulls focus straight back out of anything appended to <body>, which
   drops a textarea's selection before the copy runs. */
function copyViaSelection(text: string): boolean {
  const selection = document.getSelection()
  if (!selection) return false
  const saved = Array.from({ length: selection.rangeCount }, (_, i) =>
    selection.getRangeAt(i),
  )

  const span = document.createElement("span")
  span.textContent = text
  span.style.cssText =
    "position:fixed;top:0;left:0;white-space:pre;user-select:text;-webkit-user-select:text;opacity:0;pointer-events:none"
  document.body.appendChild(span)

  let copied: boolean
  try {
    const range = document.createRange()
    range.selectNodeContents(span)
    selection.removeAllRanges()
    selection.addRange(range)
    // The only copy path left once the Clipboard API is unavailable.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    copied = document.execCommand("copy")
  } catch {
    copied = false
  } finally {
    span.remove()
    selection.removeAllRanges()
    for (const range of saved) selection.addRange(range)
  }
  return copied
}
