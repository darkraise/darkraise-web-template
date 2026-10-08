import { afterEach, describe, expect, it, vi } from "vitest"
import { isScrollbarOnLeft, lockScroll, unlockScroll } from "./scrollLock"

// jsdom lays nothing out, so a fixed element pinned to the left edge reports
// the offset a left-side scrollbar would push it by, and anything else 0.
function placeScrollbar(offset: number) {
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const { position, left } = (this as HTMLElement).style
      const x = position === "fixed" && left === "0px" ? offset : 0
      return new DOMRect(x, 0, 0, 0)
    },
  )
}

describe("scrollbar side", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("reports a scrollbar that pushes a fixed left-edge probe inwards", () => {
    placeScrollbar(12)
    expect(isScrollbarOnLeft()).toBe(true)
  })

  it("reports a right-side or absent scrollbar as not on the left", () => {
    placeScrollbar(0)
    expect(isScrollbarOnLeft()).toBe(false)
  })

  it("leaves no probe behind", () => {
    placeScrollbar(12)
    const before = document.body.childElementCount
    isScrollbarOnLeft()
    expect(document.body.childElementCount).toBe(before)
  })
})

describe("scroll lock", () => {
  afterEach(() => {
    document.body.removeAttribute("style")
  })

  it("restores the page once the last lock is released, in any order", () => {
    document.body.style.overflow = "scroll"
    const outer = lockScroll()
    const inner = lockScroll()
    unlockScroll(outer)
    expect(document.body.style.overflow).toBe("hidden")
    unlockScroll(inner)
    expect(document.body.style.overflow).toBe("scroll")
  })
})
