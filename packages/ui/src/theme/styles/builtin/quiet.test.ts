import { describe, expect, it } from "vitest"
import { resolveRegistry } from "@theme/config/registry"
import { SIGNATURES } from "@theme/config/signatures"

describe("quiet, the Ledger base", () => {
  const registry = resolveRegistry()
  const quiet = registry.styles.quiet
  const tokens = quiet?.tokens ?? { shared: {}, light: {}, dark: {} }

  it("resolves without issues", () => {
    expect(registry.issues).toEqual([])
    expect(quiet).toBeDefined()
  })

  it("draws its structure from tint steps and rules", () => {
    const signatures = registry.signaturesFor("quiet", "base")
    expect({
      navSelection: signatures.navSelection,
      railTone: signatures.railTone,
      barTone: signatures.barTone,
      dialogHeader: signatures.dialogHeader,
      tableHead: signatures.tableHead,
      avatarShape: signatures.avatarShape,
      bannerMark: signatures.bannerMark,
    }).toEqual({
      navSelection: "tint",
      railTone: "raised",
      barTone: "raised",
      dialogHeader: "band",
      tableHead: "plain",
      avatarShape: "square",
      bannerMark: "icon",
    })
  })

  it("keeps every other signature at the kit default", () => {
    const signatures = registry.signaturesFor("quiet", "base")
    const set = new Set([
      "navSelection",
      "railTone",
      "barTone",
      "dialogHeader",
      "tableHead",
      "avatarShape",
      "bannerMark",
    ])
    for (const [key, spec] of Object.entries(SIGNATURES)) {
      if (set.has(key)) continue
      expect([key, signatures[key as keyof typeof signatures]]).toEqual([
        key,
        spec.default,
      ])
    }
  })

  it("casts no shadow on buttons, fields or cards", () => {
    const { shared } = tokens
    for (const token of [
      "buttonEdge",
      "buttonShadow",
      "buttonDangerShadow",
      "buttonNeutralEdge",
      "buttonNeutralShadow",
      "fieldShadow",
    ] as const) {
      expect([token, shared[token]]).toEqual([token, "0 0 transparent"])
    }
    expect(shared.buttonSheen).toBe("none")
    expect(shared.buttonNeutralSheen).toBe("none")
    expect(shared.cardEdge).toBeUndefined()
  })

  it("rings dialogs instead of bordering them, in both modes", () => {
    const { shared, dark } = tokens
    expect(shared.dialogBorder).toBe("transparent")
    for (const value of [shared.modalShadow, dark.modalShadow]) {
      expect(value).toMatch(/^0 0 0 1px var\(--quiet-ring\), /)
    }
  })

  // A popover's arrow copies the popup's border, and the overlay shadow
  // carries the elevation lift and the glow axes around the dropdown shadow.
  it("borders popovers and leaves the overlay shadow composed", () => {
    const { shared, dark } = tokens
    expect(shared.overlayBorder).toBe("var(--quiet-ring)")
    expect(shared.overlayShadow).toBeUndefined()
    expect(dark.overlayShadow).toBeUndefined()
    expect(shared.dropdownShadow).not.toMatch(/var\(--quiet-ring\)/)
    expect(dark.dropdownShadow).toBeDefined()
  })

  // The nav looks keep their own fills, and the outline button keeps the
  // kit's 3:1 edge: both fall below the kit's floors on a card-tone rail.
  it("leaves the nav selection fill and the outline edge to the kit", () => {
    expect(tokens.shared.navSelectionFill).toBeUndefined()
    expect(tokens.shared.buttonNeutralBorder).toBeUndefined()
  })

  it("sets light figures and page titles", () => {
    const { shared } = tokens
    expect(shared.figureWeight).toBe("300")
    expect(shared.pageTitleWeight).toBe("300")
    expect(shared.pageTitleTracking).toBe("-0.02em")
  })

  it("sets no brand-layer axis", () => {
    expect(quiet?.defaults).toEqual({})
  })
})
