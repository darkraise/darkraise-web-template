import { afterEach, describe, expect, it } from "vitest"
import { applyStoryTheme } from "../../.storybook/storyTheme"

const root = document.documentElement

afterEach(() => {
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
  root.style.cssText = ""
})

describe("Storybook theme decorator", () => {
  it("paints Glass through its attributes, with no inline fog", () => {
    applyStoryTheme({ accentColor: "blue", style: "glass", mode: "dark" })
    expect(root.getAttribute("data-mode")).toBe("dark")
    expect(root.getAttribute("data-style")).toBe("glass")
    expect(root.getAttribute("data-glass-opacity")).toBe("medium")
    expect(root.getAttribute("data-glass-blur")).toBe("medium")
    expect(root.getAttribute("data-background-style")).toBe("gradient")
    expect(root.hasAttribute("data-preset")).toBe(false)
    expect(root.style.getPropertyValue("--fog-05")).toBe("")
    expect(root.style.getPropertyValue("--glass-fog-1")).toBe("")
    expect(root.style.getPropertyValue("--primary")).not.toBe("")
  })

  it("applies the next style's defaults and drops glass's tokens", () => {
    applyStoryTheme({ accentColor: "blue", style: "glass", mode: "dark" })
    applyStoryTheme({ accentColor: "rose", style: "flat", mode: "light" })
    expect(root.getAttribute("data-style")).toBe("flat")
    expect(root.getAttribute("data-elevation")).toBe("flat")
    expect(root.getAttribute("data-background-style")).toBe("solid")
    expect(root.getAttribute("data-accent")).toBe("rose")
    expect(root.style.getPropertyValue("--fog-05")).toBe("")
    expect(root.style.getPropertyValue("--primary")).not.toBe("")
  })
})
