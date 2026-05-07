import { describe, expect, it, beforeEach, afterEach } from "vitest"
import { announce } from "./announcer"

describe("announce", () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  afterEach(() => {
    document.body.replaceChildren()
  })

  it("creates a polite live region on first call", () => {
    announce("hello", "polite")
    const region = document.querySelector(
      '[aria-live="polite"]',
    ) as HTMLElement | null
    expect(region).not.toBeNull()
    expect(region?.textContent).toBe("hello")
  })

  it("creates an assertive live region for assertive priority", () => {
    announce("urgent", "assertive")
    const region = document.querySelector(
      '[aria-live="assertive"]',
    ) as HTMLElement | null
    expect(region).not.toBeNull()
    expect(region?.textContent).toBe("urgent")
  })

  it("reuses the same region across calls of the same priority", () => {
    announce("a", "polite")
    const first = document.querySelector('[aria-live="polite"]')
    announce("b", "polite")
    const second = document.querySelector('[aria-live="polite"]')
    expect(first).toBe(second)
    expect((second as HTMLElement)?.textContent).toBe("b")
  })

  it("defaults to polite when priority is omitted", () => {
    announce("default")
    const polite = document.querySelector('[aria-live="polite"]')
    expect(polite).not.toBeNull()
  })
})
