import type { Locator, Page } from "@playwright/test"

/** The showcase example on the current page whose title is `title`. */
export function example(page: Page, title: string): Locator {
  return page.locator("main [data-showcase-example]").filter({
    has: page.getByText(title, { exact: true }),
  })
}

/** The layers of a computed `box-shadow`: commas inside a colour do not split. */
export function shadowLayers(value: string): string[] {
  return value.split(/,(?![^(]*\))/).map((layer) => layer.trim())
}
