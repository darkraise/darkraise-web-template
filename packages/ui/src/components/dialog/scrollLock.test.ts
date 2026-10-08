import { afterEach, describe, expect, it } from "vitest"
import { lockScroll, unlockScroll } from "./scrollLock"

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
