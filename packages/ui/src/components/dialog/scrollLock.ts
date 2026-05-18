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

export function lockScroll(): LockToken | null {
  if (typeof document === "undefined") return null
  const body = document.body
  const token: LockToken = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  }
  if (lockStack.length === 0) {
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
  if (lockStack.length === 0) {
    const body = document.body
    body.style.overflow = token.overflow
    body.style.paddingRight = token.paddingRight
  }
}
