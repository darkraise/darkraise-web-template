import { renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { lockScroll, unlockScroll } from "@components/dialog/scrollLock"
import { useScrollLock } from "./useScrollLock"

describe("useScrollLock", () => {
  afterEach(() => {
    document.body.removeAttribute("style")
  })

  it("keeps the page locked while a dialog still holds the lock", () => {
    const hook = renderHook(() => useScrollLock(true))
    const dialog = lockScroll()
    hook.unmount()
    expect(document.body.style.overflow).toBe("hidden")
    unlockScroll(dialog)
    expect(document.body.style.overflow).toBe("")
  })
})
