import { test, expect, type Page } from "@playwright/test"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import { gotoApp, seedApp } from "./helpers/app"
import { settle } from "./helpers/measure"

/**
 * Showcase pages at full height. The sweep applies three geometry rules to
 * every demo through the showcase hooks (data-showcase-preview on each demo
 * card, data-showcase-matrix on each VariantMatrix wrapper), so content below
 * the fold is covered without a screenshot. Pages that still fail are listed
 * in SWEEP_PENDING and run as expected failures until their fix lands.
 */

const DESKTOP = { width: 1440, height: 900 }
const MAX_HEIGHT = 4000

/** Pages whose skeletons are the demo, so they never go away. */
const SKELETON_DEMOS = new Set([
  "/components/skeleton",
  "/components/charts",
  "/components/cards",
])

async function openShowcase(
  page: Page,
  path: string,
  options: { mode?: "light" | "dark"; rtl?: boolean } = {},
): Promise<void> {
  await seedApp(page, { style: "quiet", mode: options.mode ?? "light" })
  await page.setViewportSize(DESKTOP)
  await gotoApp(page, path)
  if (!SKELETON_DEMOS.has(path)) {
    await expect(page.locator(".dr-skeleton")).toHaveCount(0)
  }
  if (options.rtl) {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl"
    })
  }
  await page.mouse.move(0, 0)
  const overflow = await page
    .locator("#main-content")
    .evaluate((main) => main.scrollHeight - main.clientHeight)
  if (overflow > 0) {
    await page.setViewportSize({
      width: DESKTOP.width,
      height: Math.min(DESKTOP.height + overflow, MAX_HEIGHT),
    })
  }
  await settle(page)
}

const SWEEP_PENDING: Record<string, string> = {
  "/components/badges":
    "row 237: the anchor-position matrix wrapper clips the top-left and bottom-end indicators by 2px",
  "/components/carousel":
    "row 60: carousel arrows sit outside the card; the vertical demo hides its next arrow",
  "/components/scroll-area":
    "row 68: the orientation matrix wrapper scrolls because the ScrollArea widens its cell",
}

test.describe("showcase sweep", () => {
  const routes = [
    ...COMPONENT_ROUTES.map((route) => route.path),
    "/components/image-editor-playground",
  ]

  /** Controls inside these are exempt from rule B. */
  const ALLOWLIST: { selector: string; reason: string }[] = [
    {
      selector: ".dr-marquee-track",
      reason: "marquee copies scroll out of the container by design",
    },
    {
      selector: ".dr-carousel-content",
      reason: "off-screen slides sit outside the carousel viewport by design",
    },
    {
      selector: "iframe",
      reason: "a frame holds its own document, laid out against its own box",
    },
  ]

  async function sweep(page: Page): Promise<string[]> {
    return page.evaluate(
      (allowed) => {
        const CONTROLS =
          "button, a[href], input, select, textarea, [role=slider], [role=tab], [role=checkbox], [role=radio], [role=switch], [role=combobox]"
        const violations: string[] = []

        interface Bound {
          left: number
          top: number
          right: number
          bottom: number
        }

        const fmt = (b: Bound) =>
          `(${Math.round(b.left)},${Math.round(b.top)})-(${Math.round(b.right)},${Math.round(b.bottom)})`

        const describe = (el: Element, withText = true) => {
          const classes = [...el.classList].slice(0, 3).join(".")
          const label =
            el.getAttribute("aria-label") ??
            (withText
              ? (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40)
              : "")
          const example = el
            .closest("[data-showcase-example]")
            ?.querySelector("p")
            ?.textContent?.trim()
          return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${label ? ` "${label}"` : ""}${example ? ` in example "${example}"` : ""}`
        }

        const inside = (inner: Bound, outer: Bound) =>
          inner.left >= outer.left - 1 &&
          inner.top >= outer.top - 1 &&
          inner.right <= outer.right + 1 &&
          inner.bottom <= outer.bottom + 1

        const scrolls = (overflow: string) =>
          overflow === "auto" || overflow === "scroll"

        const paddingBox = (el: Element): Bound => {
          const rect = el.getBoundingClientRect()
          const left = rect.left + el.clientLeft
          const top = rect.top + el.clientTop
          return {
            left,
            top,
            right: left + el.clientWidth,
            bottom: top + el.clientHeight,
          }
        }

        const scrollExtent = (el: Element): Bound => {
          const pad = paddingBox(el)
          const rtl = getComputedStyle(el).direction === "rtl"
          const left =
            pad.left -
            el.scrollLeft -
            (rtl ? el.scrollWidth - el.clientWidth : 0)
          const top = pad.top - el.scrollTop
          return {
            left,
            top,
            right: left + el.scrollWidth,
            bottom: top + el.scrollHeight,
          }
        }

        /** Rule B clip bound of one ancestor, per axis; null when it does not clip. */
        const clipOf = (el: Element): Bound | null => {
          const style = getComputedStyle(el)
          const axes = [style.overflowX, style.overflowY]
          if (axes.every((value) => value === "visible")) return null
          const pad = paddingBox(el)
          const extent = scrollExtent(el)
          const pick = (value: string, clipped: number, scrolled: number) =>
            value === "hidden" || value === "clip"
              ? clipped
              : scrolls(value)
                ? scrolled
                : null
          return {
            left: pick(style.overflowX, pad.left, extent.left) ?? -Infinity,
            right: pick(style.overflowX, pad.right, extent.right) ?? Infinity,
            top: pick(style.overflowY, pad.top, extent.top) ?? -Infinity,
            bottom:
              pick(style.overflowY, pad.bottom, extent.bottom) ?? Infinity,
          }
        }

        const fixedWithin = (el: Element, stop: Element) => {
          for (
            let node: Element | null = el;
            node && node !== stop;
            node = node.parentElement
          ) {
            if (getComputedStyle(node).position === "fixed") return true
          }
          return false
        }

        for (const preview of document.querySelectorAll(
          "[data-showcase-preview], [data-showcase-matrix]",
        )) {
          if (preview.scrollWidth > preview.clientWidth + 1) {
            violations.push(
              `rule A: ${preview.hasAttribute("data-showcase-matrix") ? "matrix wrapper" : "preview"} ${describe(preview, false)} scrolls: scrollWidth ${preview.scrollWidth} > clientWidth ${preview.clientWidth}`,
            )
          }
        }

        // overflow-x: auto computes overflow-y to auto as well, so a matrix
        // wrapper also scrolls vertically when a cell overflows its bottom.
        for (const matrix of document.querySelectorAll(
          "[data-showcase-matrix]",
        )) {
          if (matrix.scrollHeight > matrix.clientHeight + 1) {
            violations.push(
              `rule A: matrix wrapper ${describe(matrix, false)} scrolls: scrollHeight ${matrix.scrollHeight} > clientHeight ${matrix.clientHeight}`,
            )
          }
        }

        for (const preview of document.querySelectorAll(
          "[data-showcase-preview]",
        )) {
          const bound = preview.getBoundingClientRect()
          for (const control of preview.querySelectorAll(CONTROLS)) {
            if (control.closest(allowed)) continue
            if (
              !control.checkVisibility({
                visibilityProperty: true,
                opacityProperty: true,
              })
            ) {
              continue
            }
            const rect = control.getBoundingClientRect()
            if (rect.width <= 1 || rect.height <= 1) continue
            if (fixedWithin(control, preview)) continue
            let subject: Bound = {
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
            }
            let scroller: Element | null = null
            let clipped = false
            for (
              let ancestor = control.parentElement;
              ancestor && ancestor !== preview;
              ancestor = ancestor.parentElement
            ) {
              const clip = clipOf(ancestor)
              if (clip && !inside(subject, clip)) {
                violations.push(
                  `rule B: ${describe(control)} at ${fmt(rect)} is clipped by ${describe(ancestor, false)} to ${fmt(clip)}`,
                )
                clipped = true
                break
              }
              // Content that fits a scroll container is reachable by
              // scrolling, so the container stands in for it from here on.
              const style = getComputedStyle(ancestor)
              const box = ancestor.getBoundingClientRect()
              if (scrolls(style.overflowX)) {
                subject = { ...subject, left: box.left, right: box.right }
                scroller = ancestor
              }
              if (scrolls(style.overflowY)) {
                subject = { ...subject, top: box.top, bottom: box.bottom }
                scroller = ancestor
              }
            }
            if (!clipped && !inside(subject, bound)) {
              violations.push(
                `rule B: ${describe(control)} at ${fmt(rect)}${scroller ? ` (scroll container ${describe(scroller, false)} at ${fmt(subject)})` : ""} lies outside its preview ${fmt(bound)}`,
              )
            }
          }
        }

        for (const matrix of document.querySelectorAll(
          "[data-showcase-matrix]",
        )) {
          for (const cell of matrix.querySelectorAll(
            ":scope > table > * > tr > td",
          )) {
            if (cell.scrollWidth > cell.clientWidth + 1) {
              violations.push(
                `rule C: matrix cell ${describe(cell)} spills: scrollWidth ${cell.scrollWidth} > clientWidth ${cell.clientWidth}`,
              )
            }
          }
        }

        return violations
      },
      ALLOWLIST.map((entry) => entry.selector).join(", "),
    )
  }

  for (const path of routes) {
    test(path, async ({ page }) => {
      const pending = SWEEP_PENDING[path]
      test.fail(pending !== undefined, pending)
      await openShowcase(page, path)
      const violations = await sweep(page)
      expect(
        violations,
        `${path}: ${violations.length} sweep violations\n${violations.join("\n")}`,
      ).toEqual([])
    })
  }
})
