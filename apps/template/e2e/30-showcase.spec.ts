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

const SWEEP_PENDING: Record<string, string> = {}

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

        // A wrapper with any overflow but visible clips on both axes, since
        // overflow-x: auto computes overflow-y to auto as well, so content
        // that overhangs a cell bottom, such as an anchored badge, is cut.
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

test.describe("row 68 and 76: matrix columns fit their content", () => {
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
            if (wrapper.scrollHeight > wrapper.clientHeight + 1) {
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

test.describe("row 69: tags input clear trigger fits its label", () => {
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

test.describe("row 75: marquee copies cover the container", () => {
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

test.describe("row 93: toggle bar starts at the content edge", () => {
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

test.describe("row 60: carousel arrows stay inside their card", () => {
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

test.describe("row 61: dual-series charts use the plot height", () => {
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

test.describe("row 62: stacked avatars keep their initials whole", () => {
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

test.describe("row 67: the app-scope panel starts closed", () => {
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

test.describe("row 73: shell-style previews", () => {
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
