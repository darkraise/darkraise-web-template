import { beforeEach, describe, expect, it } from "vitest"
import type { ThemeConfig } from "@theme/themeConfig"
import { LEGACY_MARKER_KEY, LEGACY_REVISION } from "./legacy"
import { buildPrerenderScript } from "./prerender"

const root = document.documentElement

// Typed as the full config: the script reads its fonts like the provider.
const config: ThemeConfig = {
  defaults: {},
  switcher: { enabled: true },
  fonts: {
    newsreader: {
      label: "Newsreader",
      family: "'Newsreader', serif",
      role: "serif",
    },
  },
}

function run(given: ThemeConfig = config) {
  new Function(buildPrerenderScript(given))()
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(LEGACY_MARKER_KEY, String(LEGACY_REVISION))
  for (const name of root.getAttributeNames()) root.removeAttribute(name)
})

describe("pre-render script fonts", () => {
  it("paints the body heading font when none is stored", () => {
    run()
    expect(root.getAttribute("data-heading-font")).toBe("body")
    expect(root.getAttribute("data-font")).toBe("inter")
  })

  it("restores a stored config font for the body and the headings", () => {
    localStorage.setItem("theme-font", "newsreader")
    localStorage.setItem("theme-heading-font", "newsreader")
    run()
    expect(root.getAttribute("data-font")).toBe("newsreader")
    expect(root.getAttribute("data-heading-font")).toBe("newsreader")
  })

  it("drops a stored font the config does not register", () => {
    localStorage.setItem("theme-heading-font", "newsreader")
    run({ ...config, fonts: {} })
    expect(root.getAttribute("data-heading-font")).toBe("body")
  })

  it("takes a config font as the default heading font", () => {
    run({ ...config, defaults: { headingFont: "newsreader" } })
    expect(root.getAttribute("data-heading-font")).toBe("newsreader")
  })
})
