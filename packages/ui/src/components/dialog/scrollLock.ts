let activeCount = 0
let originalOverflow: string | null = null
let originalPaddingRight: string | null = null

export function lockScroll(): void {
  activeCount += 1
  if (activeCount > 1) return
  if (typeof document === "undefined") return
  const body = document.body
  const docEl = document.documentElement
  const scrollbarWidth = window.innerWidth - docEl.clientWidth
  originalOverflow = body.style.overflow
  originalPaddingRight = body.style.paddingRight
  body.style.overflow = "hidden"
  if (scrollbarWidth > 0) {
    const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${current + scrollbarWidth}px`
  }
}

export function unlockScroll(): void {
  if (activeCount === 0) return
  activeCount -= 1
  if (activeCount > 0) return
  if (typeof document === "undefined") return
  const body = document.body
  body.style.overflow = originalOverflow ?? ""
  body.style.paddingRight = originalPaddingRight ?? ""
  originalOverflow = null
  originalPaddingRight = null
}
