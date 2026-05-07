const TABBABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable=false])",
  "[tabindex]",
].join(",")

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute("hidden")) return false
  // jsdom does not implement getComputedStyle reliably; lean on the attribute and inline style only.
  if (el.style?.display === "none" || el.style?.visibility === "hidden")
    return false
  return true
}

function getEffectiveTabIndex(el: HTMLElement): number {
  const raw = el.getAttribute("tabindex")
  if (raw === null) {
    return el.matches(
      "a[href], area[href], input:not([type=hidden]), select, textarea, button, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable=false])",
    )
      ? 0
      : -1
  }
  const n = Number.parseInt(raw, 10)
  return Number.isNaN(n) ? -1 : n
}

export function getTabbables(root: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
  )
  return candidates.filter((el) => {
    if (!isVisible(el)) return false
    if (getEffectiveTabIndex(el) < 0) return false
    return true
  })
}
