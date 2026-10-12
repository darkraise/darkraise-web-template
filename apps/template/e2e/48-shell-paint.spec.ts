import { test, expect, type Page } from "@playwright/test"
import { boxOf, gotoApp, kitLook, seedApp } from "./helpers/app"
import { alphaOf, computed, settle } from "./helpers/measure"

/**
 * The shell paints from style tokens, and the bar span and bar edge
 * signatures reshape it. A style's tokens are injected into its own layer,
 * as a compiled style sheet would carry them; signatures are stamped on the
 * root as the provider stamps them. Each value is read through computed
 * style in Chromium.
 */

const shell = (page: Page) => page.locator(".dr-shell").first()

const region = (page: Page, name: string) =>
  shell(page).locator(`:scope > [data-region="${name}"]`)

async function openShell(page: Page, shellStyle: string, mode = "light") {
  await page.setViewportSize({ width: 1280, height: 800 })
  await seedApp(page, { shellStyle, style: "quiet", mode })
  await gotoApp(page, "/")
  await expect(shell(page)).toHaveAttribute("data-shell-style", shellStyle)
  await kitLook(page)
  await settle(page)
}

function styleTokens(page: Page, declarations: string) {
  return page.addStyleTag({
    content: `@layer style.base { :root { ${declarations} } }`,
  })
}

/** Chrome carries theme transitions, so a read waits for them to end. */
async function stamp(page: Page, name: string, value: string) {
  await page.evaluate(([n, v]) => document.documentElement.setAttribute(n, v), [
    name,
    value,
  ] as const)
  await settle(page)
}

function pseudo(page: Page, name: string, which: string, property: string) {
  return region(page, name).evaluate(
    (el, [w, p]) => getComputedStyle(el, w).getPropertyValue(p),
    [which, property] as const,
  )
}

/** A colour as Chromium computes `background-color: <css>`. */
function resolved(page: Page, css: string) {
  return page.evaluate((text) => {
    const el = document.createElement("div")
    el.style.backgroundColor = text
    document.body.append(el)
    const out = getComputedStyle(el).backgroundColor
    el.remove()
    return out
  }, css)
}

test("a style's shell tokens reach a detached shell", async ({ page }) => {
  await openShell(page, "island")
  await styleTokens(
    page,
    `--shell-shadow: rgb(1, 2, 3) 0px 0px 0px 3px;
     --shell-content-fill: rgb(4, 5, 6);
     --shell-content-edge: rgb(7, 8, 9);
     --shell-ground-fill: linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255));
     --chrome-bar-height: 48px;
     --card-radius: calc(var(--radius) + 5px);`,
  )
  const content = region(page, "content")
  expect(await computed(content, "box-shadow")).toContain(
    "rgb(1, 2, 3) 0px 0px 0px 3px",
  )
  expect(await computed(region(page, "nav"), "box-shadow")).toContain(
    "rgb(1, 2, 3) 0px 0px 0px 3px",
  )
  expect(await computed(content, "background-color")).toBe("rgb(4, 5, 6)")
  expect(await computed(content, "border-top-color")).toBe("rgb(7, 8, 9)")
  expect(await computed(shell(page), "background-image")).toBe(
    "linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))",
  )
  expect(await computed(region(page, "bar"), "height")).toBe("48px")
  // The rounded axis gives the shell 8px; the style's cards add 5px.
  expect(await computed(region(page, "nav"), "border-top-left-radius")).toBe(
    "13px",
  )
  expect(await computed(content, "border-top-left-radius")).toBe("13px")
})

test("the frame follows the style", async ({ page }) => {
  await openShell(page, "framed")
  await styleTokens(page, "--shell-frame-edge: rgb(10, 11, 12);")
  expect(await computed(shell(page), "box-shadow")).toContain(
    "rgb(10, 11, 12) 0px 0px 0px 1px",
  )
})

test("the flat fill follows the style", async ({ page }) => {
  await openShell(page, "flat")
  await styleTokens(page, "--chrome-flat-fill: rgb(13, 14, 15);")
  expect(await pseudo(page, "nav", "::before", "background-color")).toBe(
    "rgb(13, 14, 15)",
  )
  expect(await pseudo(page, "bar", "::before", "background-color")).toBe(
    "rgb(13, 14, 15)",
  )
  expect(await computed(region(page, "nav"), "background-image")).toBe("none")
})

for (const shellStyle of ["flat", "inset"]) {
  test(`a toned rail and bar keep their fill on a ${shellStyle} shell`, async ({
    page,
  }) => {
    await openShell(page, shellStyle)
    await styleTokens(
      page,
      "--chrome-rail-bg: rgb(20, 21, 22); --chrome-bar-bg: rgb(23, 24, 25);",
    )
    await stamp(page, "data-rail-tone", "inverse")
    await stamp(page, "data-bar-tone", "accent")
    expect(await pseudo(page, "nav", "::before", "background-color")).toBe(
      "rgb(20, 21, 22)",
    )
    expect(await pseudo(page, "bar", "::before", "background-color")).toBe(
      "rgb(23, 24, 25)",
    )
  })
}

test("a toned rail keeps its fill over a gradient canvas", async ({ page }) => {
  await openShell(page, "classic")
  await stamp(page, "data-background-style", "gradient")
  expect(await pseudo(page, "nav", "::before", "background-color")).toBe(
    "rgba(0, 0, 0, 0)",
  )
  await stamp(page, "data-rail-tone", "inverse")
  expect(await pseudo(page, "nav", "::before", "background-color")).toBe(
    await resolved(page, "hsl(var(--surface-sidebar))"),
  )
  expect(await pseudo(page, "bar", "::before", "background-color")).toBe(
    "rgba(0, 0, 0, 0)",
  )
})

test("a full bar spans the rail from md up", async ({ page }) => {
  await openShell(page, "classic")
  const nav = await boxOf(region(page, "nav"))
  const before = await boxOf(region(page, "bar"))
  expect(before.x).toBeCloseTo(nav.x + nav.width, 0)

  await stamp(page, "data-bar-span", "full")
  const bar = await boxOf(region(page, "bar"))
  const rail = await boxOf(region(page, "nav"))
  expect(bar.x).toBe(0)
  expect(bar.width).toBe(1280)
  expect(rail.y).toBeCloseTo(bar.y + bar.height, 0)

  await page.setViewportSize({ width: 390, height: 844 })
  await settle(page)
  const phone = await boxOf(region(page, "bar"))
  expect(phone.width).toBe(390)
  expect(await computed(shell(page), "grid-template-areas")).toBe(
    '"bar" "content"',
  )
})

test("the bar edge drops the rule or veils the content", async ({ page }) => {
  await openShell(page, "classic")
  const bar = region(page, "bar")
  const content = region(page, "content")

  await stamp(page, "data-bar-edge", "none")
  expect(await computed(bar, "border-bottom-color")).toBe("rgba(0, 0, 0, 0)")
  expect(await computed(bar, "border-bottom-width")).toBe("1px")

  const barBox = await boxOf(bar)
  const firstLine = page.locator("main#main-content > *").first()
  await expect(firstLine).toBeVisible()
  const restingTop = (await boxOf(firstLine)).y

  await stamp(page, "data-bar-edge", "veil")
  expect((await boxOf(content)).y).toBe(barBox.y)
  // The spacer keeps the first line where it rested below the bar.
  expect((await boxOf(firstLine)).y).toBeCloseTo(restingTop, 0)
  expect(await computed(bar, "border-bottom-color")).toBe("rgba(0, 0, 0, 0)")
  expect(await pseudo(page, "bar", "::before", "backdrop-filter")).toBe(
    "blur(4px)",
  )
  expect(await pseudo(page, "bar", "::after", "backdrop-filter")).toBe(
    "blur(14px)",
  )
  expect(await pseudo(page, "bar", "::before", "bottom")).toBe("-26px")

  await page.emulateMedia({ contrast: "more" })
  await settle(page)
  expect(await pseudo(page, "bar", "::before", "backdrop-filter")).toBe("none")
  expect(await pseudo(page, "bar", "::after", "content")).toBe("none")
  expect(await pseudo(page, "bar", "::before", "background-color")).toBe(
    await resolved(page, "var(--chrome-bar-bg)"),
  )
  expect(await computed(bar, "border-bottom-color")).toBe(
    await resolved(page, "var(--chrome-edge)"),
  )
})

test("the veil holds on a flat shell", async ({ page }) => {
  await openShell(page, "flat")
  await stamp(page, "data-bar-edge", "veil")
  expect(await pseudo(page, "bar", "::before", "background-image")).toMatch(
    /^linear-gradient\(/,
  )

  await page.emulateMedia({ contrast: "more" })
  await settle(page)
  const fill = await pseudo(page, "bar", "::before", "background-color")
  expect(fill).toBe(await resolved(page, "var(--chrome-bar-bg)"))
  expect(fill).not.toBe("rgba(0, 0, 0, 0)")
})

// Under island and inset the content is its own pane below the bar, so the
// veil stands down and the bar keeps its shell's paint.
for (const shellStyle of ["island", "inset"]) {
  test(`a veiled bar stays out of the ${shellStyle} pane`, async ({ page }) => {
    await openShell(page, shellStyle)
    const bar = region(page, "bar")
    const content = region(page, "content")
    const resting = await boxOf(content)

    await stamp(page, "data-bar-edge", "veil")
    const barBox = await boxOf(bar)
    const pane = await boxOf(content)
    expect(pane.y).toBeCloseTo(resting.y, 0)
    expect(pane.y).toBeGreaterThanOrEqual(barBox.y + barBox.height - 0.5)
    expect(await pseudo(page, "bar", "::before", "backdrop-filter")).toBe(
      "none",
    )
    expect(await pseudo(page, "bar", "::after", "content")).toBe("none")
    expect(await pseudo(page, "bar", "::before", "background-color")).toBe(
      shellStyle === "island"
        ? await resolved(page, "var(--chrome-bar-bg)")
        : "rgba(0, 0, 0, 0)",
    )
  })
}

test("a detached island bar keeps its full edge without a bar rule", async ({
  page,
}) => {
  await openShell(page, "island")
  await stamp(page, "data-bar-edge", "none")
  expect(await computed(region(page, "bar"), "border-bottom-color")).toBe(
    await resolved(page, "var(--chrome-edge)"),
  )
})

/**
 * Seeds a built-in style, and a preset when one is named, as a returning
 * user's stored choice. Unlike openShell it keeps the look's signatures.
 */
async function openPreset(
  page: Page,
  preset: string | null,
  style: string,
  shellStyle: string,
  mode: string,
) {
  await page.setViewportSize({ width: 1280, height: 800 })
  await seedApp(page, { style, shellStyle, mode })
  if (preset) {
    await page.addInitScript((name) => {
      if (localStorage.getItem("theme-preset") === null) {
        localStorage.setItem("theme-preset", name)
      }
    }, preset)
  }
  await gotoApp(page, "/")
  await expect(shell(page)).toHaveAttribute("data-shell-style", shellStyle)
  await settle(page)
}

for (const shellStyle of ["island", "inset"]) {
  test(`card stock lays a card sheet in light mode · ${shellStyle}`, async ({
    page,
  }) => {
    await openPreset(page, "card-stock", "tactile", shellStyle, "light")
    expect(await computed(region(page, "content"), "background-color")).toBe(
      await resolved(page, "hsl(var(--card))"),
    )
  })

  test(`card stock's borderless dark pane shows the backdrop · ${shellStyle}`, async ({
    page,
  }) => {
    await openPreset(page, "card-stock", "tactile", shellStyle, "dark")
    expect(await computed(region(page, "content"), "background-color")).toBe(
      "rgba(0, 0, 0, 0)",
    )
  })
}

// The looks that carry the veil signature: under island and inset their
// bar stays above the pane, and an island bar keeps a fill of its own.
const VEIL_LOOKS: [string | null, string][] = [
  [null, "base glass"],
  ["milk-glass", "milk glass"],
  ["aurora-night", "aurora night"],
  ["dusk-haze", "dusk haze"],
]
for (const [preset, label] of VEIL_LOOKS) {
  for (const shellStyle of ["island", "inset"]) {
    test(`${label}'s veiled bar stays above the ${shellStyle} pane`, async ({
      page,
    }) => {
      await openPreset(page, preset, "glass", shellStyle, "light")
      await expect(page.locator("html")).toHaveAttribute(
        "data-bar-edge",
        "veil",
      )
      const barBox = await boxOf(region(page, "bar"))
      const pane = await boxOf(region(page, "content"))
      expect(pane.y).toBeGreaterThanOrEqual(barBox.y + barBox.height - 0.5)
      expect(await pseudo(page, "bar", "::after", "content")).toBe("none")
      if (shellStyle === "island") {
        expect(
          await pseudo(page, "bar", "::before", "background-color"),
        ).not.toBe("rgba(0, 0, 0, 0)")
      }
    })
  }
}

// The floating pane is the page plane itself: a translucent look's pane
// fallback stays out of it.
test("a floating glass plane stays clear", async ({ page }) => {
  await openPreset(page, "aurora-night", "glass", "floating", "light")
  expect(await computed(region(page, "content"), "background-color")).toBe(
    "rgba(0, 0, 0, 0)",
  )
})

// Base Glass keeps --surface-fill-alpha at 1, so its pane is opaque; Aurora
// Night lowers it (0.62 light, 0.55 dark) and its pane lets the canvas in.
for (const mode of ["light", "dark"]) {
  test(`a glass pane is translucent page colour · ${mode}`, async ({
    page,
  }) => {
    await openPreset(page, "aurora-night", "glass", "island", mode)
    const fill = await computed(region(page, "content"), "background-color")
    expect(fill).toBe(
      await resolved(
        page,
        "hsl(var(--background) / var(--surface-fill-alpha))",
      ),
    )
    expect(alphaOf(fill)).toBeLessThan(1)
  })
}
