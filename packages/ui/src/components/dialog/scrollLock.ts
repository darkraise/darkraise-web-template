// Token-stack scroll lock. Each `lockScroll()` call returns an opaque token
// that snapshots the body's pre-lock overflow and inline paddings. Calling
// `unlockScroll(token)` pops that snapshot from the stack; the body is only
// restored when the stack is empty, and it is restored to the snapshot
// captured by the *first* lock — not whatever the body currently looks like.
// This keeps stacked dialogs and React 19 StrictMode's setup → cleanup →
// setup double-invoke safe: the cleanup's restore won't clobber a still-open
// outer dialog, and the second setup won't snapshot the just-restored
// (empty) values as the "original".
type LockToken = {
  overflow: string
  paddingLeft: string
  paddingRight: string
}

const lockStack: LockToken[] = []
// The snapshot taken by the first lock, which the last unlock restores
// whichever order the locks are released in.
let original: LockToken | null = null

/**
 * Whether the root scrollbar sits on the left edge of the viewport. Browsers
 * disagree on its side under a right-to-left page (Chromium keeps it on the
 * right; Firefox can follow the page direction), so it is measured: a fixed
 * box pinned to the left edge starts after a left-side scrollbar. Read it
 * before the page's overflow is hidden, since the probe reads 0 once the
 * scrollbar is gone.
 *
 * A transform, filter or contain on html or body makes that element the
 * containing block of its fixed descendants, so a probe placed under it
 * reads that box's offset as a scrollbar. The probe is therefore shown as a
 * popover: the top layer always takes the viewport as its containing block.
 * Without the popover API it falls back to a body child, which those
 * properties can still skew.
 */
export function isScrollbarOnLeft(): boolean {
  const probe = document.createElement("div")
  probe.style.cssText =
    "position: fixed; left: 0; top: 0; right: auto; bottom: auto; width: 0; height: 0; margin: 0; padding: 0; border: 0; visibility: hidden"
  document.body.appendChild(probe)
  const topLayer = typeof probe.showPopover === "function"
  if (topLayer) {
    probe.popover = "manual"
    probe.showPopover()
  }
  const onLeft = probe.getBoundingClientRect().left > 0
  if (topLayer) probe.hidePopover()
  probe.remove()
  return onLeft
}

export function lockScroll(): LockToken | null {
  if (typeof document === "undefined") return null
  const body = document.body
  const token: LockToken = {
    overflow: body.style.overflow,
    paddingLeft: body.style.paddingLeft,
    paddingRight: body.style.paddingRight,
  }
  if (lockStack.length === 0) {
    original = token
    const docEl = document.documentElement
    const scrollbarWidth = window.innerWidth - docEl.clientWidth
    const padding =
      scrollbarWidth > 0 && isScrollbarOnLeft() ? "paddingLeft" : "paddingRight"
    body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      const current = parseFloat(window.getComputedStyle(body)[padding]) || 0
      body.style[padding] = `${current + scrollbarWidth}px`
    }
  }
  lockStack.push(token)
  return token
}

export function unlockScroll(token: LockToken | null): void {
  if (!token || typeof document === "undefined") return
  const index = lockStack.lastIndexOf(token)
  if (index === -1) return
  lockStack.splice(index, 1)
  if (lockStack.length === 0 && original) {
    const body = document.body
    body.style.overflow = original.overflow
    body.style.paddingLeft = original.paddingLeft
    body.style.paddingRight = original.paddingRight
    original = null
  }
}
