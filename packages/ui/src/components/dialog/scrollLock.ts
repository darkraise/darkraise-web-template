// Token-stack scroll lock. Each `lockScroll()` call returns an opaque token
// that snapshots the body's pre-lock overflow/paddingRight. Calling
// `unlockScroll(token)` pops that snapshot from the stack; the body is only
// restored when the stack is empty, and it is restored to the snapshot
// captured by the *first* lock — not whatever the body currently looks like.
// This keeps stacked dialogs and React 19 StrictMode's setup → cleanup →
// setup double-invoke safe: the cleanup's restore won't clobber a still-open
// outer dialog, and the second setup won't snapshot the just-restored
// (empty) values as the "original".
type LockToken = {
  overflow: string
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
 */
export function isScrollbarOnLeft(): boolean {
  const probe = document.createElement("div")
  probe.style.cssText =
    "position: fixed; left: 0; top: 0; width: 0; height: 0; visibility: hidden"
  document.body.appendChild(probe)
  const onLeft = probe.getBoundingClientRect().left > 0
  probe.remove()
  return onLeft
}

export function lockScroll(): LockToken | null {
  if (typeof document === "undefined") return null
  const body = document.body
  const token: LockToken = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  }
  if (lockStack.length === 0) {
    original = token
    const docEl = document.documentElement
    const scrollbarWidth = window.innerWidth - docEl.clientWidth
    body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      const current =
        parseFloat(window.getComputedStyle(body).paddingRight) || 0
      body.style.paddingRight = `${current + scrollbarWidth}px`
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
    body.style.paddingRight = original.paddingRight
    original = null
  }
}
