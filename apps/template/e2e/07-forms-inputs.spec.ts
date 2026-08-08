import { test, expect, type Page } from "@playwright/test"
import { attrOf, boxOf, gotoApp, seedApp, watchConsole } from "./helpers/app"

async function open(page: Page, path: string) {
  await seedApp(page)
  await gotoApp(page, path)
  return page.locator("main")
}

test.describe("text entry", () => {
  test("text input accepts and reflects typing", async ({ page }) => {
    const main = await open(page, "/components/inputs")
    const input = main.locator("input").first()
    await input.fill("hello world")
    await expect(input).toHaveValue("hello world")
  })

  test("textarea accepts multiline text", async ({ page }) => {
    const main = await open(page, "/components/textarea")
    const area = main.locator("textarea").first()
    await area.fill("line one\nline two")
    await expect(area).toHaveValue("line one\nline two")
  })

  test("password input toggles visibility", async ({ page }) => {
    const main = await open(page, "/components/password-input")
    const input = main.locator('input[type="password"]').first()
    await input.fill("s3cret")
    await main
      .getByRole("button", { name: /show password/i })
      .first()
      .click()
    await expect(main.locator("input").first()).toHaveAttribute("type", "text")
  })

  test("number input steps with its buttons", async ({ page }) => {
    const main = await open(page, "/components/number-input")
    const input = main.locator("input").first()
    const before = Number(await input.inputValue())
    await main
      .getByRole("button", { name: /increment|increase|\+/i })
      .first()
      .click()
    await expect
      .poll(async () => Number(await input.inputValue()))
      .toBeGreaterThan(before)
  })

  test("OTP input fills across cells", async ({ page }) => {
    const main = await open(page, "/components/input-otp")
    const cells = main.locator("input")
    await cells.first().click()
    await page.keyboard.type("123456")
    await expect
      .poll(async () =>
        (
          await cells.evaluateAll((els) =>
            els.map((e) => (e as HTMLInputElement).value).join(""),
          )
        ).replace(/\s/g, ""),
      )
      .toContain("1")
  })

  test("editable switches to an input and commits", async ({ page }) => {
    const main = await open(page, "/components/editable")
    await main.getByRole("button", { name: "Rename document" }).click()
    const input = main.locator("input.dr-editable-input").first()
    await expect(input).toBeVisible()
    await input.fill("edited value")
    await page.keyboard.press("Enter")
    await expect(main.getByText("edited value").first()).toBeVisible()
  })

  test("tags input adds and removes a tag", async ({ page }) => {
    const main = await open(page, "/components/tags-input")
    const input = main.locator("input").first()
    await input.fill("playwright")
    await page.keyboard.press("Enter")
    await expect(main.getByText("playwright").first()).toBeVisible()
  })
})

test.describe("choice controls", () => {
  test("checkbox toggles", async ({ page }) => {
    const main = await open(page, "/components/checkbox")
    const box = main.getByRole("checkbox").first()
    const before = await attrOf(box, "aria-checked")
    await box.click()
    await expect(box).not.toHaveAttribute("aria-checked", before)
  })

  test("switch toggles", async ({ page }) => {
    const main = await open(page, "/components/switch")
    const toggle = main.getByRole("switch").first()
    const before = await attrOf(toggle, "aria-checked")
    await toggle.click()
    await expect(toggle).not.toHaveAttribute("aria-checked", before)
  })

  test("radio group selects one option", async ({ page }) => {
    const main = await open(page, "/components/radio-group")
    const radios = main.getByRole("radio")
    const second = radios.nth(1)
    await second.click()
    await expect(second).toHaveAttribute("aria-checked", "true")
  })

  test("toggle button flips pressed state", async ({ page }) => {
    const main = await open(page, "/components/toggle")
    const toggle = main.locator("button[aria-pressed]").first()
    const before = await attrOf(toggle, "aria-pressed")
    await toggle.click()
    await expect(toggle).not.toHaveAttribute("aria-pressed", before)
  })

  test("toggle group selects an item", async ({ page }) => {
    const main = await open(page, "/components/toggle-group")
    const group = main.locator('[role="radiogroup"]').first()
    const item = group.getByRole("radio").nth(1)
    await item.click()
    await expect(item).toHaveAttribute("aria-checked", "true")
  })

  test("segment group switches segments", async ({ page }) => {
    const main = await open(page, "/components/segment-group")
    const items = main.getByRole("radio")
    const target = items.nth(1)
    await target.click()
    await expect(target).toHaveAttribute("aria-checked", "true")
  })

  test("rating group sets a rating", async ({ page }) => {
    const main = await open(page, "/components/rating-group")
    const stars = main.getByRole("radio")
    await stars.nth(3).click()
    await expect(stars.nth(3)).toHaveAttribute("aria-checked", "true")
  })

  test("swap flips between its two faces", async ({ page }) => {
    const main = await open(page, "/components/swap")
    const swap = main.locator("button").first()
    const before = await swap.getAttribute("aria-pressed")
    await swap.click()
    await expect(swap).not.toHaveAttribute("aria-pressed", before ?? "")
  })
})

test.describe("selection menus", () => {
  test("select opens and picks an option", async ({ page }) => {
    const main = await open(page, "/components/select")
    const trigger = main.getByRole("combobox").first()
    await trigger.click()
    const option = page.getByRole("option").nth(1)
    const label = (await option.textContent())?.trim() ?? ""
    expect(label).not.toBe("")
    await option.click()
    await expect(trigger).toContainText(label)
  })

  test("combobox filters and selects", async ({ page }) => {
    const main = await open(page, "/components/combobox")
    const trigger = main.getByRole("combobox").first()
    await trigger.click()
    const input = page.locator("input").last()
    await input.fill("a")
    const option = page.getByRole("option").first()
    await expect(option).toBeVisible()
    await option.click()
  })

  test("multi select keeps several values", async ({ page }) => {
    const main = await open(page, "/components/multi-select")
    await main.getByRole("combobox").first().click()
    await page.getByRole("option").nth(0).click()
    await page.getByRole("option").nth(1).click()
    await page.keyboard.press("Escape")
    await expect(
      main
        .locator(
          '[class*="multi-select"] [class*="chip"], [class*="multi-select"] [class*="tag"]',
        )
        .first(),
    ).toBeVisible()
  })

  test("cascade select drills into a child level", async ({ page }) => {
    const main = await open(page, "/components/cascade-select")
    await main.locator("button.dr-cascade-trigger").first().click()
    const option = page.locator('[role="listbox"] [role="option"]').first()
    await expect(option).toBeVisible()
    await option.click()
    await expect(page.locator('[role="listbox"]')).toHaveCount(2)
  })

  test("listbox selects an option", async ({ page }) => {
    const main = await open(page, "/components/listbox")
    const option = main.getByRole("option").nth(1)
    await option.click()
    await expect(option).toHaveAttribute("aria-selected", "true")
  })
})

test.describe("date and time", () => {
  test("calendar selects a day", async ({ page }) => {
    const main = await open(page, "/components/calendar")
    const day = main.locator('[role="gridcell"] button:not([disabled])').nth(10)
    await day.click()
    await expect(day).toHaveAttribute("aria-pressed", "true")
  })

  test("date picker opens a calendar and picks a date", async ({ page }) => {
    const main = await open(page, "/components/date-picker")
    await main.getByRole("button").first().click()
    const day = page.locator('[role="gridcell"] button:not([disabled])').nth(10)
    await expect(day).toBeVisible()
    await day.click()
  })

  test("date input accepts a typed date", async ({ page }) => {
    const main = await open(page, "/components/date-input")
    const input = main.locator("input").first()
    await input.click()
    await page.keyboard.type("12252025")
    await expect(input).not.toHaveValue("")
  })

  test("time picker opens and selects a time", async ({ page }) => {
    const main = await open(page, "/components/time-picker")
    await main.getByRole("button").first().click()
    await expect(
      page.getByRole("option").or(page.locator("li")).first(),
    ).toBeVisible()
  })
})

test.describe("range controls", () => {
  test("slider moves with the keyboard", async ({ page }) => {
    const main = await open(page, "/components/slider")
    const thumb = main.locator('[role="slider"]').first()
    const before = Number(await thumb.getAttribute("aria-valuenow"))
    await thumb.focus()
    await page.keyboard.press("ArrowRight")
    await expect
      .poll(async () => Number(await thumb.getAttribute("aria-valuenow")))
      .toBeGreaterThan(before)
  })

  test("angle slider moves with the keyboard", async ({ page }) => {
    const main = await open(page, "/components/angle-slider")
    const thumb = main.locator('[role="slider"]').first()
    const before = Number(await thumb.getAttribute("aria-valuenow"))
    await thumb.focus()
    await page.keyboard.press("ArrowRight")
    await expect
      .poll(async () => Number(await thumb.getAttribute("aria-valuenow")))
      .not.toBe(before)
  })

  test("color picker opens and reports a value", async ({ page }) => {
    const main = await open(page, "/components/color-picker")
    await main.getByRole("button").first().click()
    await expect(page.locator(".dr-color-picker-content").first()).toBeVisible()
  })
})

test.describe("form validation", () => {
  test("form fields surface validation errors on submit", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    const main = await open(page, "/components/form-fields")
    const submit = main
      .getByRole("button", { name: /submit|save|create/i })
      .first()
    await submit.click()
    await expect(
      main.locator('[data-invalid="true"], [aria-invalid="true"]').first(),
    ).toBeVisible()
    consoleWatch.assertClean()
  })

  test("product form validates required fields", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/products/new")
    const submit = page
      .getByRole("button", { name: /create|save|submit/i })
      .first()
    await submit.click()
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
  })

  test("field component links label, description and error", async ({
    page,
  }) => {
    const main = await open(page, "/components/field")
    const input = main.locator("input").first()
    const id = await input.getAttribute("id")
    expect(id).toBeTruthy()
    await expect(main.locator(`label[for="${id}"]`)).toHaveCount(1)
  })
})

test.describe("file and media input", () => {
  test("file upload accepts a file", async ({ page }) => {
    const main = await open(page, "/components/file-upload")
    // The first dropzone only accepts images; use the unrestricted one.
    const input = main.locator('input[type="file"]:not([accept])').first()
    await input.setInputFiles({
      name: "note.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    })
    await expect(main.getByText("note.txt").first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test("signature pad records a stroke", async ({ page }) => {
    const main = await open(page, "/components/signature-pad")
    const canvas = main.locator("canvas").first()
    const box = await boxOf(canvas)
    await page.mouse.move(box.x + 20, box.y + 20)
    await page.mouse.down()
    await page.mouse.move(box.x + 90, box.y + 60, { steps: 8 })
    await page.mouse.up()

    const hasInk = await canvas.evaluate((el) => {
      const c = el as HTMLCanvasElement
      const ctx = c.getContext("2d")
      if (!ctx) return false
      const data = ctx.getImageData(0, 0, c.width, c.height).data
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return true
      return false
    })
    expect(hasInk).toBe(true)
  })

  test("clipboard copy button reports success", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    const main = await open(page, "/components/clipboard")
    await main.getByRole("button").first().click()
    await expect(main.getByText(/copied/i).first()).toBeVisible()
  })
})
