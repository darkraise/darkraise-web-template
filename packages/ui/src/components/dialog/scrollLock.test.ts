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

function giveScrollbar(width: number, side: "left" | "right") {
  vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
    window.innerWidth - width,
  )
  placeScrollbar(side === "left" ? width : 0)
}

describe("scroll lock", () => {
  // A test that fails while holding a lock would leave it held for the next.
  const held: ReturnType<typeof lockScroll>[] = []
  const lock = () => {
    const token = lockScroll()
    held.push(token)
    return token
  }

  afterEach(() => {
    for (const token of held.splice(0)) unlockScroll(token)
    vi.restoreAllMocks()
    document.body.removeAttribute("style")
  })

  it("pads the right beside a right-side scrollbar, then restores it", () => {
    giveScrollbar(15, "right")
    document.body.style.paddingRight = "4px"
    const token = lock()
    expect(document.body.style.paddingRight).toBe("19px")
    expect(document.body.style.paddingLeft).toBe("")
    unlockScroll(token)
    expect(document.body.style.paddingRight).toBe("4px")
  })

  it("pads the left beside a left-side scrollbar, then restores it", () => {
    giveScrollbar(12, "left")
    document.body.style.paddingLeft = "4px"
    const token = lock()
    expect(document.body.style.paddingLeft).toBe("16px")
    expect(document.body.style.paddingRight).toBe("")
    unlockScroll(token)
    expect(document.body.style.paddingLeft).toBe("4px")
  })

  it("writes no padding when the page has no scrollbar", () => {
    giveScrollbar(0, "right")
    const token = lock()
    expect(document.body.style.overflow).toBe("hidden")
    expect(document.body.style.paddingLeft).toBe("")
    expect(document.body.style.paddingRight).toBe("")
    unlockScroll(token)
  })

  it("restores the page once the last lock is released, in any order", () => {
    document.body.style.overflow = "scroll"
    const outer = lock()
    const inner = lock()
    unlockScroll(outer)
    expect(document.body.style.overflow).toBe("hidden")
    unlockScroll(inner)
    expect(document.body.style.overflow).toBe("scroll")
  })
})
