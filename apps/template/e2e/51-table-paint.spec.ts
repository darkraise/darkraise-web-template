import { test, expect, type Locator, type Page } from "@playwright/test"
import { gotoApp, kitLook, seedApp } from "./helpers/app"
import { computed, settle } from "./helpers/measure"

/**
 * Figures, body text, table heads, selected rows and avatars follow the
 * style's tokens and signatures. A table, a stat and an avatar are added to
 * the cards page so every case has the same structure; each value is read
 * through computed style in Chromium.
 */

async function openProbe(page: Page) {
  await seedApp(page, { style: "quiet", mode: "light" })
  await gotoApp(page, "/components/cards")
  await kitLook(page)
  await settle(page)
  await page.evaluate(() => {
    const host = document.createElement("div")
    host.dataset.probe = ""
    host.innerHTML = `
      <div class="dr-table-wrapper"><table class="dr-table">
        <thead class="dr-table-header"><tr class="dr-table-row">
          <th class="dr-table-head">Name</th>
          <th class="dr-table-head" data-align="end">Amount</th>
        </tr></thead>
        <tbody class="dr-table-body">
          <tr class="dr-table-row" data-state="selected">
            <td class="dr-table-cell">Ada</td>
            <td class="dr-table-cell" data-align="end">12.40</td>
          </tr>
          <tr class="dr-table-row">
            <td class="dr-table-cell">Grace</td>
            <td class="dr-table-cell" data-align="end">7.10</td>
          </tr>
        </tbody>
      </table></div>
      <div class="dr-stat"><span class="dr-stat-value">1,204</span></div>
      <span class="dr-avatar"><span class="dr-avatar-fallback">AL</span></span>`
    document.querySelector("main")?.prepend(host)
  })
  return page.locator("[data-probe]")
}

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

async function setRoot(page: Page, name: string, value: string) {
  await page
    .locator("html")
    .evaluate((el, [n, v]) => el.setAttribute(n, v), [name, value] as const)
  await settle(page)
}

function parts(host: Locator) {
  return {
    header: host.locator(".dr-table-header"),
    headRow: host.locator(".dr-table-header tr"),
    head: host.locator(".dr-table-head").first(),
    selected: host.locator('.dr-table-row[data-state="selected"]'),
    lead: host.locator('.dr-table-row[data-state="selected"] > :first-child'),
    amount: host.locator('.dr-table-cell[data-align="end"]').first(),
    name: host.locator(".dr-table-cell").first(),
    stat: host.locator(".dr-stat-value"),
    avatar: host.locator(".dr-avatar"),
  }
}

test("the defaults keep today's figures, body text and table", async ({
  page,
}) => {
  const host = await openProbe(page)
  const p = parts(host)
  expect(await computed(p.stat, "font-weight")).toBe("600")
  expect(await computed(page.locator("body"), "font-weight")).toBe("400")
  expect(await computed(p.header, "background-color")).not.toBe(
    "rgba(0, 0, 0, 0)",
  )
  expect(await computed(p.lead, "box-shadow")).toBe("none")
  expect(await computed(p.head, "text-transform")).toBe("none")
  expect(await computed(p.amount, "font-family")).toBe(
    await computed(p.name, "font-family"),
  )
})

test("a style's weights reach figures and body text", async ({ page }) => {
  const host = await openProbe(page)
  await page.addStyleTag({
    content:
      "@layer style.base { :root { --figure-weight: 300; --type-ui-weight: 450; } }",
  })
  expect(await computed(parts(host).stat, "font-weight")).toBe("300")
  expect(await computed(page.locator("body"), "font-weight")).toBe("450")
})

test("the table head follows its signature", async ({ page }) => {
  const host = await openProbe(page)
  const p = parts(host)
  const [strong, seam] = await probe(
    page,
    "border-top: 1px solid hsl(var(--border-strong)); border-bottom: 1px solid var(--seam)",
    ["border-top-color", "border-bottom-color"],
  )
  await setRoot(page, "data-table-head", "plain")
  expect(await computed(p.header, "background-color")).toBe("rgba(0, 0, 0, 0)")
  await setRoot(page, "data-table-head", "ruled")
  expect(await computed(p.header, "background-color")).toBe("rgba(0, 0, 0, 0)")
  expect(await computed(p.headRow, "border-bottom-color")).toBe(strong)
  await page.addStyleTag({
    content:
      "@layer style.base { :root { --seam-highlight: rgb(250, 251, 252); } }",
  })
  await setRoot(page, "data-table-head", "seam")
  expect(await computed(p.headRow, "border-bottom-color")).toBe(seam)
  expect(await computed(p.head, "box-shadow")).toBe(
    "rgb(250, 251, 252) 0px 1px 0px 0px",
  )
})

test("a selected row follows the row selection signature", async ({ page }) => {
  const host = await openProbe(page)
  const p = parts(host)
  const [tint, accent] = await probe(
    page,
    "background-color: hsl(var(--primary) / 0.12); color: hsl(var(--primary))",
    ["background-color", "color"],
  )
  await setRoot(page, "data-row-selection", "accent")
  expect(await computed(p.selected, "background-color")).toBe(tint)
  await setRoot(page, "data-row-selection", "stripe")
  expect(await computed(p.lead, "box-shadow")).toBe(
    `${accent} 3px 0px 0px 0px inset`,
  )
})

test("figures, avatars and table heads follow their signatures", async ({
  page,
}) => {
  const host = await openProbe(page)
  const p = parts(host)
  const [mono] = await probe(page, "font-family: var(--font-mono)", [
    "font-family",
  ])
  await setRoot(page, "data-figure-family", "mono")
  expect(await computed(p.stat, "font-family")).toBe(mono)
  expect(await computed(p.amount, "font-family")).toBe(mono)
  expect(await computed(p.name, "font-family")).not.toBe(mono)

  const [half] = await probe(page, "border-radius: calc(var(--radius) / 2)", [
    "border-top-left-radius",
  ])
  await setRoot(page, "data-avatar-shape", "square")
  expect(await computed(p.avatar, "border-top-left-radius")).toBe(half)

  expect(await computed(p.head, "text-transform")).toBe("none")
  await setRoot(page, "data-label-case", "upper")
  expect(await computed(p.head, "text-transform")).toBe("uppercase")
  await setRoot(page, "data-label-case", "lower")
  expect(await computed(p.head, "text-transform")).toBe("lowercase")
})
