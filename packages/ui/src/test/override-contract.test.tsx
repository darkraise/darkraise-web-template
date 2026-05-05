// Verifies three aspects of the override contract:
// 1. Components forward consumer className alongside their own dr-* class.
// 2. Components write data-variant / data-size attributes (used by CSS selectors).
// 3. theme.css declares the cascade layer order with utilities after components,
//    so Tailwind utility classes passed by consumers can always win over component defaults.
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "../components/button"

const thisDir = dirname(fileURLToPath(import.meta.url))
const themeCssPath = resolve(thisDir, "../styles/theme.css")

describe("override contract", () => {
  it("Button renders with dr-btn plus consumer utilities", () => {
    const { getByRole } = render(
      <Button className="rounded-full bg-emerald-500 hover:bg-emerald-600">
        click
      </Button>,
    )
    const btn = getByRole("button")
    expect(btn.className).toContain("dr-btn")
    expect(btn.className).toContain("bg-emerald-500")
    expect(btn.className).toContain("hover:bg-emerald-600")
    expect(btn.className).toContain("rounded-full")
  })

  it("Button renders data-variant and data-size attributes", () => {
    const { getByRole } = render(
      <Button variant="destructive" size="lg">
        delete
      </Button>,
    )
    const btn = getByRole("button")
    expect(btn.getAttribute("data-variant")).toBe("destructive")
    expect(btn.getAttribute("data-size")).toBe("lg")
  })

  it("theme.css declares cascade layer order with utilities after components", () => {
    const themeCss = readFileSync(themeCssPath, "utf8")
    const layerDeclMatch = themeCss.match(/@layer\s+([^;]+);/)
    expect(layerDeclMatch).not.toBeNull()
    if (!layerDeclMatch) return
    const layers = layerDeclMatch[1].split(",").map((s) => s.trim())
    const componentsIdx = layers.indexOf("components")
    const utilitiesIdx = layers.indexOf("utilities")
    expect(componentsIdx).toBeGreaterThanOrEqual(0)
    expect(utilitiesIdx).toBeGreaterThan(componentsIdx)
  })
})
