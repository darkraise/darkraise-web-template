import { test, expect, type Page } from "@playwright/test"
import { gotoApp, readThemeAttrs, seedApp } from "./helpers/app"
import { alphaOf, computed, settle } from "./helpers/measure"

/**
 * Glass is glass where content passes under it: translucent, frosted cards,
 * dialogs and menus over a frosting scrim, a solid rail and a veiled bar.
 * Each value is read through computed style in Chromium, against a
 * throwaway element styled with the value Glass should resolve to, at the
 * default radius (rounded), Transparency and Blur (medium). The exact alphas
 * of every glass look at every step are 59-glass-transparency's.
 */

const MODES = ["light", "dark"] as const
const OVERLAYS = "/e2e/fixtures/baseline-overlays.html"

/** Computed values of a throwaway element styled with `css`. */
function probe(page: Page, css: string, properties: string[]) {
  return page.evaluate(
    ([text, names]) => {
      const el = document.createElement("div")
      el.setAttribute("style", text)
      document.body.append(el)
      const style = getComputedStyle(el)
      const out = names.map((name) => style.getPropertyValue(name))
      el.remove()
      return out
    },
    [css, properties] as const,
  )
}

for (const mode of MODES) {
  test(`glass ${mode} stamps the veil, the blob canvas and its looks`, async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode })
    await gotoApp(page, "/")
    const attrs = await readThemeAttrs(page)
    expect(attrs["data-bar-edge"]).toBe("veil")
    expect(attrs["data-gradient-pattern"]).toBe("blobs")
    expect(attrs["data-menu-highlight"]).toBe("tint")
    expect(attrs["data-tooltip-tone"]).toBe("inverse")
    expect(attrs["data-banner-mark"]).toBe("icon")
    expect(attrs["data-field-fill"]).toBe("surface")
    expect(attrs["data-table-head"]).toBe("plain")
    await expect(page.locator(".dr-sidebar-nav").first()).toHaveAttribute(
      "data-sidebar-selection",
      "chip",
    )
  })

  test(`a glass ${mode} dialog is translucent and frosted over a frosting scrim`, async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode })
    await page.goto(`${OVERLAYS}?show=dialog`)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await settle(page)
    const [fill, radius] = await probe(
      page,
      "background-color: hsl(var(--popover) / var(--overlay-alpha)); border-radius: 14px",
      ["background-color", "border-top-left-radius"],
    )
    expect(await computed(dialog, "background-color")).toBe(fill)
    expect(alphaOf(fill ?? "")).toBeLessThan(1)
    expect(await computed(dialog, "background-image")).toBe("none")
    expect(await computed(dialog, "border-top-left-radius")).toBe(radius)
    expect(await computed(dialog, "backdrop-filter")).toBe(
      "blur(8px) saturate(1.8)",
    )

    const backdrop = page.locator(".dr-overlay-backdrop")
    const [scrim] = await probe(
      page,
      mode === "light"
        ? "background-color: hsl(var(--foreground) / 0.3)"
        : "background-color: rgb(0 0 0 / 0.5)",
      ["background-color"],
    )
    expect(await computed(backdrop, "background-color")).toBe(scrim)
    expect(await computed(backdrop, "backdrop-filter")).toBe("blur(2px)")
  })

  test(`a glass ${mode} menu is translucent, frosted and tints its row`, async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode })
    await page.goto(`${OVERLAYS}?show=menu`)
    const menu = page.getByRole("menu")
    await expect(menu).toBeVisible()
    await settle(page)
    const [face, radius] = await probe(
      page,
      "background-color: hsl(var(--popover) / var(--overlay-alpha)); border-radius: 10px",
      ["background-color", "border-top-left-radius"],
    )
    expect(await computed(menu, "background-color")).toBe(face)
    expect(alphaOf(face ?? "")).toBeLessThan(1)
    expect(await computed(menu, "backdrop-filter")).toBe(
      "blur(8px) saturate(1.8)",
    )
    expect(await computed(menu, "border-top-left-radius")).toBe(radius)

    const item = menu.getByRole("menuitem", { name: /Profile/ })
    await item.focus()
    await expect(item).toBeFocused()
    await settle(page)
    const [tint] = await probe(
      page,
      "background-color: hsl(var(--primary) / 0.12)",
      ["background-color"],
    )
    expect(await computed(item, "background-color")).toBe(tint)
  })

  test(`a glass ${mode} card is translucent, frosted and rounder than its controls`, async ({
    page,
  }) => {
    await seedApp(page, { style: "glass", mode })
    await gotoApp(page, "/components/cards")
    await settle(page)
    const card = page.locator("main .dr-card").first()
    const [fill, edge, radius] = await probe(
      page,
      `background-color: hsl(var(--card) / var(--surface-alpha)); border: 1px solid ${
        mode === "light" ? "hsl(var(--border))" : "hsl(var(--border-subtle))"
      }; border-radius: 12px`,
      ["background-color", "border-top-color", "border-top-left-radius"],
    )
    expect(await computed(card, "background-color")).toBe(fill)
    expect(alphaOf(fill ?? "")).toBeLessThan(1)
    expect(await computed(card, "border-top-color")).toBe(edge)
    expect(await computed(card, "border-top-left-radius")).toBe(radius)
    expect(await computed(card, "backdrop-filter")).toBe(
      "blur(8px) saturate(1.8)",
    )
  })
}
