import { expect, type Page } from "@playwright/test"

// The kit's fallback rules match more contrast only: reduced transparency
// keeps glass (theme.css, style.fallback). Playwright's emulateMedia has no
// reduced-transparency option, so that one goes through the DevTools
// protocol, which Chromium supports.
export const FALLBACK_MEDIA: ReadonlyArray<{
  name: string
  query: string
  emulate: (page: Page, on: boolean) => Promise<void>
}> = [
  {
    name: "more contrast",
    query: "(prefers-contrast: more)",
    emulate: (page, on) =>
      page.emulateMedia({ contrast: on ? "more" : "no-preference" }),
  },
]

/** Switches `prefers-reduced-transparency: reduce` on or off for `page`. */
export async function emulateReducedTransparency(page: Page, on: boolean) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-reduced-transparency",
        value: on ? "reduce" : "no-preference",
      },
    ],
  })
}

/** Runs `check` under each fallback media feature, having confirmed the page matches it. */
export async function underFallbackMedia(
  page: Page,
  check: (media: string) => Promise<void>,
) {
  for (const media of FALLBACK_MEDIA) {
    await media.emulate(page, true)
    expect(
      await page.evaluate((query) => matchMedia(query).matches, media.query),
      `the page matches ${media.query}`,
    ).toBe(true)
    await check(media.name)
    await media.emulate(page, false)
  }
}

/** Every rendered element or pseudo-element that still filters its backdrop. */
export function filtering(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found = new Set<string>()
    for (const el of document.body.querySelectorAll("*")) {
      for (const pseudo of ["", "::before", "::after"]) {
        const style = getComputedStyle(el, pseudo || null)
        if (pseudo && style.content === "none") continue
        if (style.backdropFilter !== "" && style.backdropFilter !== "none") {
          found.add(
            `${el.tagName.toLowerCase()}.${el.classList[0] ?? ""}${pseudo}`,
          )
        }
      }
    }
    return [...found]
  })
}
