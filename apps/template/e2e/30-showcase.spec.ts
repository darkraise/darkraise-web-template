import { test, expect, type Page } from "@playwright/test"
import { COMPONENT_ROUTES } from "./fixtures/component-routes"
import { boxOf, gotoApp, seedApp } from "./helpers/app"
import {
  alphaOf,
  contrast,
  pixel,
  rgbOf,
  settle,
  textContrast,
  type Rgb,
} from "./helpers/measure"

/**
 * Showcase pages at full height. The sweep applies three geometry rules to
 * every demo through the showcase hooks (data-showcase-preview on each demo
 * card, data-showcase-matrix on each VariantMatrix wrapper), so content below
 * the fold is covered without a screenshot.
 */

const DESKTOP = { width: 1440, height: 900 }
/** The largest screenshot dimension in Chromium. */
const MAX_HEIGHT = 16384

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
    const height = DESKTOP.height + overflow
    if (height > MAX_HEIGHT) {
      throw new Error(
        `${path} is ${height}px tall, above the ${MAX_HEIGHT}px capture cap`,
      )
    }
    await page.setViewportSize({ width: DESKTOP.width, height })
  }
  await settle(page)
}

test.describe("showcase sweep", () => {
  const routes = COMPONENT_ROUTES.map((route) => route.path)

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

        // Any overflow other than visible clips both axes: overflow-x auto
        // makes overflow-y compute to auto, so content that overhangs a cell
        // bottom, such as an anchored badge, would be cut.
        for (const matrix of document.querySelectorAll(
          "[data-showcase-matrix]",
        )) {
          if (
            getComputedStyle(matrix).overflowY !== "visible" &&
            matrix.scrollHeight > matrix.clientHeight + 1
          ) {
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
      await openShowcase(page, path)
      const violations = await sweep(page)
      expect(
        violations,
        `${path}: ${violations.length} sweep violations\n${violations.join("\n")}`,
      ).toEqual([])
    })
  }
})

test.describe("matrix columns fit their content", () => {
  const PAGES = [
    "/components/scroll-area",
    "/components/slider",
    "/components/checkbox",
  ]

  for (const path of PAGES) {
    test(path, async ({ page }) => {
      await openShowcase(page, path)
      const problems = await page
        .locator("[data-showcase-matrix]")
        .evaluateAll((wrappers) =>
          wrappers.flatMap((wrapper, index) => {
            const found: string[] = []
            const name = `matrix ${index + 1}`
            if (wrapper.scrollWidth > wrapper.clientWidth + 1) {
              found.push(
                `${name} scrolls: scrollWidth ${wrapper.scrollWidth} > clientWidth ${wrapper.clientWidth}`,
              )
            }
            if (
              getComputedStyle(wrapper).overflowY !== "visible" &&
              wrapper.scrollHeight > wrapper.clientHeight + 1
            ) {
              found.push(
                `${name} scrolls: scrollHeight ${wrapper.scrollHeight} > clientHeight ${wrapper.clientHeight}`,
              )
            }
            const headers = [
              ...wrapper.querySelectorAll(
                ":scope > table > * > tr > th:first-child",
              ),
            ]
            const range = document.createRange()
            const widest = Math.max(
              ...headers.map((header) => {
                range.selectNodeContents(header)
                return range.getBoundingClientRect().width
              }),
            )
            const [first] = headers
            if (!first) return [...found, `${name} has no header column`]
            const style = getComputedStyle(first)
            const padding =
              parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
            const column = first.getBoundingClientRect().width
            if (column > widest + padding + 1) {
              found.push(
                `${name} header column is ${Math.round(column)}px for a ${Math.round(widest)}px label and ${padding}px padding`,
              )
            }
            return found
          }),
        )
      expect(problems, problems.join("\n")).toEqual([])
    })
  }
})

test.describe("tags input clear trigger fits its label", () => {
  test("the clear label sits on one line inside its trigger", async ({
    page,
  }) => {
    await openShowcase(page, "/components/tags-input")
    const trigger = page.getByRole("button", { name: "Clear all tags" })
    await expect(trigger).toHaveCount(1)
    const { lines, box } = await trigger.evaluate((button) => {
      const plain = (r: DOMRect) => ({
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
      })
      const text = [...button.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
      )
      const range = document.createRange()
      if (text) range.selectNodeContents(text)
      return {
        lines: text ? [...range.getClientRects()].map(plain) : [],
        box: plain(button.getBoundingClientRect()),
      }
    })
    expect(lines, "the label lies on exactly one line").toHaveLength(1)
    for (const line of lines) {
      expect(line.left).toBeGreaterThanOrEqual(box.left - 0.5)
      expect(line.top).toBeGreaterThanOrEqual(box.top - 0.5)
      expect(line.right).toBeLessThanOrEqual(box.right + 0.5)
      expect(line.bottom).toBeLessThanOrEqual(box.bottom + 0.5)
    }
  })
})

test.describe("marquee copies cover the container", () => {
  const PROGRESS = [0, 0.5, 0.99]

  /** Pauses every marquee at each progress and reports what is left bare. */
  async function gaps(page: Page): Promise<string[]> {
    return page.evaluate((progress) => {
      const failures: string[] = []
      const marquees = [
        ...document.querySelectorAll<HTMLElement>("#main-content .dr-marquee"),
      ]
      marquees.forEach((marquee, index) => {
        const track = marquee.querySelector<HTMLElement>(".dr-marquee-track")
        const animation = track?.getAnimations()[0]
        if (!track || !animation) {
          failures.push(`marquee ${index}: no running track animation`)
          return
        }
        const duration = Number(
          animation.effect?.getComputedTiming().duration ?? 0,
        )
        const label = `marquee ${index}${marquee.dataset.reverse ? " (reversed)" : ""}`
        animation.pause()
        const starts: number[] = []
        for (const p of progress) {
          animation.currentTime = p * duration
          const box = marquee.getBoundingClientRect()
          const copies = [
            ...track.querySelectorAll(":scope > .dr-marquee-group"),
          ].map((group) => group.getBoundingClientRect())
          const left = Math.min(...copies.map((rect) => rect.left))
          const right = Math.max(...copies.map((rect) => rect.right))
          if (left > box.left + 1 || right < box.right - 1) {
            failures.push(
              `${label} at ${p}: copies span ${Math.round(left)}-${Math.round(right)}, container ${Math.round(box.left)}-${Math.round(box.right)}`,
            )
          }
          starts.push(copies[0]?.left ?? 0)
        }
        // One loop moves the track by exactly one copy and its gap, so the
        // restart is seamless.
        const [first, second] = [
          ...track.querySelectorAll(":scope > .dr-marquee-group"),
        ].map((group) => group.getBoundingClientRect().left)
        const step = Math.abs((second ?? 0) - (first ?? 0))
        progress.forEach((p, i) => {
          const moved = Math.abs((starts[i] ?? 0) - (starts[0] ?? 0))
          const expected = (p - (progress[0] ?? 0)) * step
          if (Math.abs(moved - expected) > 1) {
            failures.push(
              `${label} at ${p}: moved ${moved.toFixed(1)}px, expected ${expected.toFixed(1)}px of a ${step.toFixed(1)}px step`,
            )
          }
        })
        animation.play()
      })
      return failures
    }, PROGRESS)
  }

  for (const rtl of [false, true]) {
    test(`forwards and reversed marquees stay covered${rtl ? " under right-to-left" : ""}`, async ({
      page,
    }) => {
      await openShowcase(page, "/components/marquee", { rtl })
      await expect(page.locator("#main-content .dr-marquee")).toHaveCount(7)
      await expect(
        page.locator('#main-content .dr-marquee[data-reverse="true"]'),
      ).toHaveCount(2)
      const failures = await gaps(page)
      expect(failures, failures.join("\n")).toEqual([])
    })
  }
})

test.describe("toggle bar starts at the content edge", () => {
  test("the first toggle sits at its preview card's content start", async ({
    page,
  }) => {
    await openShowcase(page, "/components/buttons")
    const preview = page
      .locator("[data-showcase-example]")
      .filter({ hasText: "Toggle button bar" })
      .locator("[data-showcase-preview]")
    const firstToggle = preview.locator(".dr-toggle-group > .dr-toggle").first()
    await expect(firstToggle).toBeVisible()
    const contentStart = await preview.evaluate((card) => {
      const style = getComputedStyle(card)
      return (
        card.getBoundingClientRect().left +
        card.clientLeft +
        parseFloat(style.paddingLeft)
      )
    })
    const toggleStart = await firstToggle.evaluate(
      (toggle) => toggle.getBoundingClientRect().left,
    )
    expect(Math.abs(toggleStart - contentStart)).toBeLessThanOrEqual(0.5)
  })
})

test.describe("carousel arrows stay inside their card", () => {
  test("every arrow lies inside its card and the vertical slide fills its viewport", async ({
    page,
  }) => {
    await openShowcase(page, "/components/carousel")
    const arrows = await page
      .locator(".dr-carousel-previous, .dr-carousel-next")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect()
          const card = button
            .closest("[data-showcase-preview]")
            ?.getBoundingClientRect()
          const example = button
            .closest("[data-showcase-example]")
            ?.querySelector("p")
            ?.textContent?.trim()
          const inside =
            card !== undefined &&
            rect.left >= card.left - 1 &&
            rect.top >= card.top - 1 &&
            rect.right <= card.right + 1 &&
            rect.bottom <= card.bottom + 1
          return inside
            ? null
            : `"${button.textContent?.trim()}" in "${example}" at (${Math.round(rect.left)},${Math.round(rect.top)})-(${Math.round(rect.right)},${Math.round(rect.bottom)}) outside its card`
        }),
      )
    expect(arrows.length).toBeGreaterThan(0)
    const outside = arrows.filter((problem) => problem !== null)
    expect(outside, outside.join("\n")).toEqual([])

    const vertical = page.locator(
      ".dr-carousel-content[data-orientation=vertical]",
    )
    const heights = await vertical.evaluate((content) => ({
      viewport: content.parentElement?.getBoundingClientRect().height ?? 0,
      card:
        content
          .querySelector(".dr-carousel-item .dr-card")
          ?.getBoundingClientRect().height ?? 0,
    }))
    expect(heights.viewport).toBeGreaterThan(0)
    expect(Math.abs(heights.card - heights.viewport)).toBeLessThanOrEqual(1)

    const next = page.locator(".dr-carousel-next[data-orientation=vertical]")
    await expect(next).toBeVisible()
    const hit = await next.evaluate((button) => {
      const rect = button.getBoundingClientRect()
      const top = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      )
      return top !== null && button.contains(top)
    })
    expect(hit, "the vertical next arrow is the topmost element").toBe(true)
  })
})

test.describe("dual-series charts use the plot height", () => {
  const CHARTS = ["Revenue vs Orders", "Visitors vs Conversions"]

  for (const title of CHARTS) {
    test(`${title}: each series spans at least a quarter of the plot`, async ({
      page,
    }) => {
      await openShowcase(page, "/components/charts")
      const chart = page
        .locator(".dr-card")
        .filter({ has: page.getByText(title, { exact: true }) })
        .filter({ has: page.locator(".recharts-surface") })
        .last()
      const measure = () =>
        chart.evaluate((card) => {
          const plot = card.querySelector("defs clipPath rect")
          const plotHeight = Number(plot?.getAttribute("height") ?? 0)
          const series = [
            ...card.querySelectorAll<SVGPathElement>(".recharts-line-curve"),
          ].map((path) => path.getBBox().height)
          return { plotHeight, series }
        })
      await expect.poll(async () => (await measure()).series.length).toBe(2)
      const { plotHeight, series } = await measure()
      expect(plotHeight).toBeGreaterThan(0)
      const shares = series.map((height) =>
        Math.round((height / plotHeight) * 100),
      )
      for (const share of shares) {
        expect(
          share,
          `series span ${shares.join("%, ")}% of a ${plotHeight}px plot`,
        ).toBeGreaterThanOrEqual(25)
      }
    })
  }
})

test.describe("stacked avatars keep their initials whole", () => {
  const GROUPS = ["Avatar group (stacked)", "Group with +N overflow"]

  for (const title of GROUPS) {
    test(title, async ({ page }) => {
      await openShowcase(page, "/components/avatar")
      const preview = page
        .locator("[data-showcase-example]")
        .filter({ has: page.getByText(title, { exact: true }) })
        .locator("[data-showcase-preview]")
      const problems = await preview.evaluate((card) => {
        const row = card.querySelector(".dr-avatar")?.parentElement
        if (!row) return ["no avatar row"]
        const members = [...row.children]
        const range = document.createRange()
        return members.slice(0, -1).flatMap((member, index) => {
          const fallback = member.querySelector(".dr-avatar-fallback")
          if (!fallback) return []
          range.selectNodeContents(fallback)
          const textRight = range.getBoundingClientRect().right
          const nextLeft = members[index + 1]?.getBoundingClientRect().left ?? 0
          return textRight <= nextLeft
            ? []
            : [
                `"${fallback.textContent}" ends at ${textRight.toFixed(1)}, under the next avatar from ${nextLeft.toFixed(1)}`,
              ]
        })
      })
      expect(problems, problems.join("\n")).toEqual([])
    })
  }
})

test.describe("the app-scope panel starts closed", () => {
  test("no app-scope panel covers the title or the sidebar after load", async ({
    page,
  }) => {
    // A fresh page: the app-scope registry lives for the page session, so a
    // panel opened by an earlier navigation would still be on screen.
    await openShowcase(page, "/components/floating-panel")
    const overlaps = await page.evaluate(() => {
      const panels = [
        ...document.querySelectorAll(".dr-floating-panel"),
      ].filter((panel) => !panel.closest("#main-content"))
      const targets = [
        { name: "page title", el: document.querySelector("main h1") },
        { name: "sidebar", el: document.querySelector("aside") },
      ]
      const hits: string[] = []
      for (const panel of panels) {
        const a = panel.getBoundingClientRect()
        for (const { name, el } of targets) {
          if (!el) {
            hits.push(`no ${name} found`)
            continue
          }
          const b = el.getBoundingClientRect()
          const intersects =
            a.left < b.right &&
            b.left < a.right &&
            a.top < b.bottom &&
            b.top < a.bottom
          if (intersects) {
            hits.push(
              `app-scope panel "${panel.textContent?.trim().slice(0, 30)}" overlaps the ${name}`,
            )
          }
        }
      }
      return hits
    })
    expect(overlaps, overlaps.join("\n")).toEqual([])

    const example = page.locator("[data-showcase-example]").filter({
      has: page.getByText("Scope: app (survives route changes)", {
        exact: true,
      }),
    })
    await example.getByRole("button", { name: "Open", exact: true }).click()
    await expect(
      page.locator(".dr-floating-panel:not(#main-content *)"),
    ).toHaveCount(1)
  })
})

test.describe("shell-style previews", () => {
  const REGIONS: Record<string, string[]> = {
    sidebar: ["bar", "content", "nav"],
    "top-nav": ["bar", "content"],
    stacked: ["bar", "content", "nav", "subnav"],
    "split-panel": ["bar", "content", "handle", "panel"],
  }

  test("each preview renders exactly the regions of its structure, inside it", async ({
    page,
  }) => {
    await openShowcase(page, "/components/shell-styles")
    const previews = await page
      .locator("[data-showcase-preview] .dr-shell")
      .evaluateAll((shells) =>
        shells.map((shell) => {
          const box = shell.getBoundingClientRect()
          const regions = [...shell.querySelectorAll(":scope > [data-region]")]
          return {
            structure: shell.getAttribute("data-structure") ?? "",
            style: shell.getAttribute("data-shell-style") ?? "",
            regions: regions.map((r) => r.getAttribute("data-region")).sort(),
            outside: regions
              .filter((region) => {
                const r = region.getBoundingClientRect()
                return (
                  r.width < 1 ||
                  r.height < 1 ||
                  r.left < box.left - 1 ||
                  r.top < box.top - 1 ||
                  r.right > box.right + 1 ||
                  r.bottom > box.bottom + 1
                )
              })
              .map((region) => region.getAttribute("data-region")),
          }
        }),
      )
    expect(previews).toHaveLength(24)
    for (const { structure, style, regions, outside } of previews) {
      expect(regions, `${structure} · ${style} regions`).toEqual(
        REGIONS[structure],
      )
      expect(outside, `${structure} · ${style} regions outside`).toEqual([])
    }
  })
})

test.describe("signature pad Clear button", () => {
  test("Clear sits at least 8px below the custom-stroke canvas", async ({
    page,
  }) => {
    await openShowcase(page, "/components/signature-pad")
    const preview = page
      .locator("[data-showcase-example]")
      .filter({ hasText: "Custom stroke" })
      .locator("[data-showcase-preview]")
    const canvasBottom = await preview
      .locator("canvas")
      .evaluate((el) => el.getBoundingClientRect().bottom)
    const clearTop = await preview
      .getByRole("button", { name: "Clear" })
      .evaluate((el) => el.getBoundingClientRect().top)
    expect(clearTop).toBeGreaterThanOrEqual(canvasBottom + 8)
  })
})

test.describe("kitchen-sink radio alignment", () => {
  test("each radio row centres on a checkbox row", async ({ page }) => {
    await openShowcase(page, "/components/kitchen-sink")
    const choices = page.locator('[data-family="choices"]')
    const centre = (rows: Element[]) =>
      rows.map((row) => {
        const r = row.getBoundingClientRect()
        return r.top + r.height / 2
      })
    const checkboxRows = await choices
      .locator('[role="checkbox"]')
      .locator("xpath=..")
      .evaluateAll(centre)
    const radioRows = await choices
      .locator('[role="radiogroup"] > div')
      .evaluateAll(centre)
    expect(checkboxRows).toHaveLength(2)
    expect(radioRows).toHaveLength(2)
    for (const radio of radioRows) {
      const nearest = Math.min(
        ...checkboxRows.map((checkbox) => Math.abs(checkbox - radio)),
      )
      expect(nearest, `radio row centre ${radio}`).toBeLessThanOrEqual(2)
    }
  })
})

test.describe("calendar custom cell size", () => {
  test("custom-size day cells are wider than the basic calendar cells", async ({
    page,
  }) => {
    await openShowcase(page, "/components/calendar")
    const dayWidth = (title: string) =>
      page
        .locator("[data-showcase-example]")
        .filter({ hasText: title })
        .locator("[data-showcase-preview] .dr-calendar-day")
        .first()
        .evaluate((cell) => cell.getBoundingClientRect().width)
    const basic = await dayWidth("Basic calendar")
    const custom = await dayWidth("Custom cell size")
    expect(custom).toBeGreaterThan(basic)
  })
})

test.describe("showcase nits", () => {
  const example = (page: Page, title: string) =>
    page.locator("[data-showcase-example]").filter({
      has: page.getByText(title, { exact: true }),
    })

  test("the dashboard progress card formats its value as currency", async ({
    page,
  }) => {
    await openShowcase(page, "/components/dashboard")
    await expect(
      example(page, "ProgressCard — value vs target").getByText(/72,000/),
    ).toHaveText("$72,000 / $100,000")
  })

  test("date-picker fields share one width and a picked range fits", async ({
    page,
  }) => {
    await openShowcase(page, "/components/date-picker")
    const widths = await page
      .locator(".dr-date-picker-control")
      .evaluateAll((controls) =>
        controls.map((control) => control.getBoundingClientRect().width),
      )
    expect(widths).toHaveLength(5)
    expect(new Set(widths).size, `field widths ${widths.join(", ")}`).toBe(1)

    await expect(
      example(page, "Min/max constraints").locator("input"),
    ).toHaveAttribute("placeholder", "Pick a date")

    const range = example(page, "Range with two-month view")
    await range.locator(".dr-date-picker-trigger").click()
    const days = page.locator(
      ".dr-date-picker-content [role=gridcell]:not(.dr-calendar-outside) button",
    )
    await days.filter({ hasText: /^10$/ }).first().click()
    await days.filter({ hasText: /^28$/ }).last().click()
    await page.keyboard.press("Escape")
    const input = range.locator("input")
    await expect(input).toHaveValue(/ – /)
    const { scrollWidth, clientWidth } = await input.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }))
    expect(
      scrollWidth,
      `range text "${await input.inputValue()}" overflows its field`,
    ).toBeLessThanOrEqual(clientWidth)
  })

  test("the three aspect-ratio boxes share one gradient fill", async ({
    page,
  }) => {
    await openShowcase(page, "/components/aspect-ratio")
    const fills = await page
      .locator(".dr-aspect-ratio > div")
      .evaluateAll((boxes) =>
        boxes.map((box) => getComputedStyle(box).backgroundImage),
      )
    expect(fills).toHaveLength(3)
    expect(fills[0]).toContain("gradient")
    expect(new Set(fills).size, fills.join("\n")).toBe(1)
  })

  test("the transition demos read as hover targets", async ({ page }) => {
    await openShowcase(page, "/components/animation")
    const demo = example(page, "Color and opacity transitions")
    const link = demo.getByRole("link", { name: "Transition colors" })
    expect(
      await link.evaluate((el) => getComputedStyle(el).textDecorationLine),
    ).toBe("underline")
    await expect(demo.getByText("Transition opacity")).toHaveAttribute(
      "data-variant",
      "outline",
    )
  })
})

test.describe("menubar matrix cells fit their trigger", () => {
  test("each side x align Menubar is no wider than its trigger plus 16px", async ({
    page,
  }) => {
    await openShowcase(page, "/components/menubar")
    const cells = await page
      .locator("[data-showcase-example]")
      .filter({ has: page.getByText("Side x align", { exact: true }) })
      .locator("[data-showcase-matrix] .dr-menubar")
      .evaluateAll((bars) =>
        bars.map((bar) => {
          const trigger = bar.querySelector(".dr-menubar-trigger")
          return {
            label: trigger?.textContent ?? "",
            bar: bar.getBoundingClientRect().width,
            trigger: trigger?.getBoundingClientRect().width ?? 0,
          }
        }),
      )
    expect(cells).toHaveLength(18)
    const wide = cells.filter((cell) => cell.bar > cell.trigger + 16)
    expect(
      wide,
      wide
        .map(
          (cell) =>
            `${cell.label}: menubar ${cell.bar}px, trigger ${cell.trigger}px`,
        )
        .join("\n"),
    ).toEqual([])
  })
})

test.describe("stock ticker deltas", () => {
  test("gains and losses use subtle status badges with arrows", async ({
    page,
  }) => {
    await openShowcase(page, "/components/marquee")
    const badges = await page
      .locator("[data-showcase-example]")
      .filter({ has: page.getByText("Stock ticker", { exact: true }) })
      .locator(".dr-badge")
      .evaluateAll((elements) =>
        elements.map((badge) => ({
          text: (badge.textContent ?? "").trim(),
          variant: badge.getAttribute("data-variant"),
          icon: badge.querySelector("svg") !== null,
        })),
      )
    expect(badges.length).toBeGreaterThan(0)
    for (const badge of badges) {
      const gain = !badge.text.startsWith("-")
      expect(badge, badge.text).toEqual({
        text: badge.text,
        variant: gain ? "success-subtle" : "destructive-subtle",
        icon: true,
      })
    }
  })
})

test.describe("password strength meter", () => {
  for (const mode of ["light", "dark"] as const) {
    test(`${mode}: the meter shows at rest and its empty segments read against the card`, async ({
      page,
    }) => {
      await openShowcase(page, "/components/password-input", { mode })
      const demo = page
        .locator("[data-showcase-example]")
        .filter({ has: page.getByText("With strength meter", { exact: true }) })
      const meter = demo.locator("[data-strength-meter]")
      await expect(meter).toBeVisible()
      await expect(meter).toHaveAttribute("aria-hidden", "true")
      const segments = meter.locator("[data-segment]")
      await expect(segments).toHaveCount(3)

      const { edge, card } = await meter
        .locator("[data-segment]:not([data-filled])")
        .first()
        .evaluate((segment) => ({
          edge: getComputedStyle(segment).borderTopColor,
          card: getComputedStyle(
            segment.closest("[data-showcase-preview]") ?? document.body,
          ).backgroundColor,
        }))
      expect(alphaOf(card), `card background ${card}`).toBe(1)
      const ratio = contrast(rgbOf(edge), rgbOf(card))
      test.info().annotations.push({
        type: "contrast",
        description: `${mode}: empty segment border ${edge} on card ${card} is ${ratio.toFixed(2)}:1`,
      })
      expect(ratio, `${edge} on ${card}`).toBeGreaterThanOrEqual(3)

      const field = demo.locator("input")
      const filled = meter.locator("[data-segment][data-filled]")
      await expect(filled).toHaveCount(1)
      await field.fill("abcdefgh")
      await expect(filled).toHaveCount(2)
      await field.fill("Abcdefgh1234")
      await expect(filled).toHaveCount(3)
      await expect(demo.locator("[data-strength]")).toHaveText(
        "Strength: strong",
      )
      await expect(demo.locator("[data-strength]")).toHaveAttribute(
        "aria-live",
        "polite",
      )
    })
  }

  test("forced colours keep the segment borders and drop the fills", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" })
    await openShowcase(page, "/components/password-input")
    const segments = await page
      .locator("[data-strength-meter] [data-segment]")
      .evaluateAll((elements) =>
        elements.map((segment) => {
          const style = getComputedStyle(segment)
          return {
            filled: segment.hasAttribute("data-filled"),
            border: style.borderTopColor,
            borderWidth: style.borderTopWidth,
            background: style.backgroundColor,
            card: getComputedStyle(
              segment.closest("[data-showcase-preview]") ?? document.body,
            ).backgroundColor,
          }
        }),
      )
    expect(segments.map((segment) => segment.filled)).toEqual([
      true,
      false,
      false,
    ])
    for (const segment of segments) {
      expect(segment.borderWidth).toBe("1px")
      expect(
        contrast(rgbOf(segment.border), rgbOf(segment.card)),
        `${segment.border} on ${segment.card}`,
      ).toBeGreaterThanOrEqual(3)
      expect(rgbOf(segment.background)).toEqual(rgbOf(segment.card))
    }
  })
})

test.describe("frame demos follow the colour scheme", () => {
  /** The cross-origin External site demo is the only frame with a src. */
  const SAME_ORIGIN_FRAMES = "iframe.dr-frame:not([src])"

  for (const mode of ["light", "dark"] as const) {
    test(`${mode}: every text node in a same-origin frame meets 4.5:1`, async ({
      page,
    }) => {
      await openShowcase(page, "/components/frame", { mode })
      const frames = page.locator(SAME_ORIGIN_FRAMES)
      await expect(frames).toHaveCount(6)
      const failures: string[] = []
      let checked = 0
      for (const frame of await frames.all()) {
        const title = await frame.evaluate(
          (el) =>
            el
              .closest("[data-showcase-example]")
              ?.querySelector("p")
              ?.textContent?.trim() ?? "",
        )
        const body = frame.contentFrame().locator("body")
        await expect(body).not.toBeEmpty()
        for (const element of await body.locator("*").all()) {
          const text = await element.evaluate((el) =>
            el.checkVisibility()
              ? [...el.childNodes]
                  .filter((node) => node.nodeType === Node.TEXT_NODE)
                  .map((node) => node.textContent ?? "")
                  .join("")
                  .trim()
              : "",
          )
          if (!text) continue
          checked += 1
          const ratio = await textContrast(element)
          if (ratio < 4.5) {
            failures.push(
              `${title}: "${text.slice(0, 40)}" ${ratio.toFixed(2)}:1`,
            )
          }
        }
      }
      expect(checked).toBeGreaterThan(20)
      expect(failures, failures.join("\n")).toEqual([])
    })
  }

  test("the design-system frame mirrors the host theme attributes", async ({
    page,
  }) => {
    await openShowcase(page, "/components/frame", { mode: "dark" })
    const root = page
      .locator("[data-showcase-example]")
      .filter({
        has: page.getByText("Design system inside the frame", { exact: true }),
      })
      .locator("iframe")
      .contentFrame()
      .locator("html")
    const hostAttributes = await page.evaluate(() =>
      Object.fromEntries(
        [...document.documentElement.attributes]
          .filter((attribute) => attribute.name.startsWith("data-"))
          .map((attribute) => [attribute.name, attribute.value]),
      ),
    )
    expect(hostAttributes["data-mode"]).toBe("dark")
    for (const [name, value] of Object.entries(hostAttributes)) {
      await expect(root).toHaveAttribute(name, value)
    }
    const token = (el: Element) =>
      getComputedStyle(el).getPropertyValue("--background")
    expect(await root.evaluate(token)).toBe(
      await page.locator("html").evaluate(token),
    )

    await page.evaluate(() =>
      document.documentElement.setAttribute("data-mode", "light"),
    )
    await expect(root).toHaveAttribute("data-mode", "light")
  })
})

test.describe("tree-view empty placeholder", () => {
  /** Left edge of the first non-blank text node inside the element. */
  const textStart = (el: Element) => {
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent?.trim()) continue
      const range = el.ownerDocument.createRange()
      range.selectNodeContents(node)
      return range.getBoundingClientRect().left
    }
    throw new Error("no text")
  }

  test("the lazy Empty placeholder text starts where a sibling leaf text starts", async ({
    page,
  }) => {
    await openShowcase(page, "/components/tree-view")
    const demo = page
      .locator("[data-showcase-example]")
      .filter({ has: page.getByText("Lazy-load children", { exact: true }) })
    await demo.getByText("users", { exact: true }).click()
    const leaf = demo.getByText("alice.json", { exact: true })
    await expect(leaf).toBeVisible()
    await demo.getByText("archive", { exact: true }).click()
    const placeholder = demo.getByText("Empty", { exact: true })
    await expect(placeholder).toBeVisible()
    const leafStart = await leaf.evaluate(textStart)
    const placeholderStart = await placeholder.evaluate(textStart)
    expect(
      Math.abs(placeholderStart - leafStart),
      `placeholder text at ${placeholderStart}px, leaf text at ${leafStart}px`,
    ).toBeLessThanOrEqual(1)
  })
})

test.describe("rating half star under right-to-left", () => {
  for (const rtl of [true, false]) {
    const [startName, endName] = rtl ? ["right", "left"] : ["left", "right"]
    test(`${rtl ? "rtl" : "ltr"}: the filled half lies on the inline-start (${startName}) side`, async ({
      page,
    }) => {
      await openShowcase(page, "/components/rating-group", { rtl })
      const demo = page
        .locator("[data-showcase-example]")
        .filter({ has: page.getByText("Half-star precision", { exact: true }) })
      const half = demo.locator('[role=radio][data-half="true"]')
      await expect(half).toHaveCount(1)
      const box = await boxOf(half.locator("svg").first())
      const fill = rgbOf(
        await half
          .locator(".fill-warning-edge")
          .evaluate((el) => getComputedStyle(el).fill),
      )
      const ground = rgbOf(
        await demo
          .locator("[data-showcase-preview]")
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      const distance = (a: Rgb, b: Rgb) =>
        Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
      // Inside the star body on either side of its vertical centre line,
      // clear of the outline stroke.
      const y = Math.round(box.y + box.height * 0.5)
      const right = await pixel(page, Math.round(box.x + box.width * 0.62), y)
      const left = await pixel(page, Math.round(box.x + box.width * 0.38), y)
      const [start, end] = rtl ? [right, left] : [left, right]
      expect(
        distance(start, fill),
        `inline-start (${startName}) sample ${start} should be the fill ${fill}`,
      ).toBeLessThan(40)
      expect(
        distance(end, ground),
        `inline-end (${endName}) sample ${end} should be the card ${ground}`,
      ).toBeLessThan(40)
    })
  }
})
