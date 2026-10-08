import { test, expect, type Page } from "@playwright/test"
import { attrOf, boxOf, gotoApp, seedApp, watchConsole } from "./helpers/app"
import { example } from "./helpers/showcase"

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
    await open(page, "/components/input-otp")
    const otp = example(page, "6-digit code")
    const input = otp.getByRole("textbox", { name: "One-time password" })
    await input.click()
    await page.keyboard.type("123456")
    await expect(input).toHaveValue("123456")
    await expect(otp.locator(".dr-input-otp-slot")).toHaveText([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ])
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

  test("editable keeps its edit trigger on the value row", async ({ page }) => {
    const main = await open(page, "/components/editable")
    const trigger = main.getByRole("button", { name: "Rename document" })
    const preview = main
      .locator(".dr-editable")
      .filter({ has: page.getByRole("button", { name: "Rename document" }) })
      .locator(".dr-editable-preview")
    const previewBox = await boxOf(preview)
    const triggerBox = await boxOf(trigger)
    const centre = (box: { y: number; height: number }) =>
      box.y + box.height / 2
    expect(
      Math.abs(centre(triggerBox) - centre(previewBox)),
      "trigger centred on the value row",
    ).toBeLessThanOrEqual(1)
    expect(triggerBox.x, "trigger after the value").toBeGreaterThanOrEqual(
      previewBox.x + previewBox.width,
    )
  })

  test("tags input adds and removes a tag", async ({ page }) => {
    await open(page, "/components/tags-input")
    const tags = example(page, "Free-form tags")
    const texts = tags.locator(".dr-tags-input-item-text")
    await expect(texts).toHaveText(["react", "typescript", "tailwind"])

    await tags.getByPlaceholder("Add framework...").fill("playwright")
    await page.keyboard.press("Enter")
    await expect(texts).toHaveText([
      "react",
      "typescript",
      "tailwind",
      "playwright",
    ])

    await tags.getByRole("button", { name: "Remove playwright" }).click()
    await expect(texts).toHaveText(["react", "typescript", "tailwind"])
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
    await open(page, "/components/segment-group")
    const range = example(page, "Date range picker")
    const week = range.getByRole("radio", { name: "Week" })
    const month = range.getByRole("radio", { name: "Month" })
    await expect(week).toHaveAttribute("aria-checked", "true")
    await expect(month).toHaveAttribute("aria-checked", "false")

    await month.click()
    await expect(month).toHaveAttribute("aria-checked", "true")
    await expect(week).toHaveAttribute("aria-checked", "false")
  })

  test("rating group sets a rating", async ({ page }) => {
    const main = await open(page, "/components/rating-group")
    const stars = main.getByRole("radio")
    await stars.nth(3).click()
    await expect(stars.nth(3)).toHaveAttribute("aria-checked", "true")
  })

  test("swap flips between its two faces", async ({ page }) => {
    await open(page, "/components/swap")
    const hamburger = example(page, "Hamburger to close")
    const button = hamburger.getByRole("button", { name: "Open menu" })
    const swap = hamburger.locator(".dr-swap")
    await expect(swap).toHaveAttribute("data-pressed", "false")

    await button.click()
    await expect(
      hamburger.getByRole("button", { name: "Close menu" }),
    ).toBeVisible()
    await expect(button).toHaveCount(0)
    await expect(swap).toHaveAttribute("data-pressed", "true")
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
    await open(page, "/components/combobox")
    const input = example(page, "Country picker with filtering").getByRole(
      "combobox",
    )
    await input.fill("can")
    const options = page.getByRole("option")
    await expect(options).toHaveText(["Canada"])
    await options.first().click()
    await expect(input).toHaveValue("Canada")
    await expect(options).toHaveCount(0)
  })

  test("multi select keeps several values", async ({ page }) => {
    await open(page, "/components/multi-select")
    const fruit = example(page, "Basic")
    const chips = fruit.locator(".dr-multi-select-chip-label")
    await expect(chips).toHaveText(["Apple", "Mango"])

    await fruit.getByRole("combobox").click()
    await page.getByRole("option", { name: "Banana" }).click()
    await page.getByRole("option", { name: "Grape" }).click()
    await page.keyboard.press("Escape")
    await expect(chips).toHaveText(["Apple", "Mango", "Banana", "Grape"])
  })

  test("cascade select drills into a child level", async ({ page }) => {
    const main = await open(page, "/components/cascade-select")
    await main.locator("button.dr-cascade-trigger").first().click()
    // The first item's column opens with the popover; drill into the second.
    const option = page.locator('[role="listbox"] [role="option"]').nth(1)
    await expect(option).toHaveText(/Canada/)
    await option.click()
    await expect(page.getByRole("option", { name: "Ontario" })).toBeVisible()
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
    await open(page, "/components/calendar")
    const basic = example(page, "Basic calendar")
    const readout = basic.getByText(/^Selected: /)
    const before = await readout.innerText()
    const target = basic
      .locator(
        ".dr-calendar-day:not(.dr-calendar-outside) button:not([disabled]):not([aria-pressed])",
      )
      .first()
    const label = await attrOf(target, "aria-label")

    await target.click()
    const picked = basic.getByRole("button", { name: label, exact: true })
    await expect(picked).toHaveAttribute("aria-pressed", "true")
    await expect(basic.locator('button[aria-pressed="true"]')).toHaveCount(1)
    await expect(readout).not.toHaveText(before)
  })

  test("date picker opens a calendar and picks a date", async ({ page }) => {
    await open(page, "/components/date-picker")
    const picker = example(page, "Single date with input mask")
    const input = picker.getByRole("textbox", { name: "Date" })
    await expect(input).toHaveValue("")
    await picker.getByRole("button", { name: "Open date picker" }).click()
    const popover = page.getByRole("dialog")
    const day = popover
      .locator(
        ".dr-calendar-day:not(.dr-calendar-outside) button:not([disabled])",
      )
      .nth(14)
    const stamp = await attrOf(day, "data-day")

    await day.click()
    await expect(popover).toHaveCount(0)
    await expect(input).toHaveValue(/^\d{4}-\d{2}-\d{2}$/)
    // data-day is the browser locale date string, so the comparison is made
    // in the browser rather than by parsing it here.
    const picked = await input.inputValue()
    expect(
      await page.evaluate(
        (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(),
        picked,
      ),
    ).toBe(stamp)
  })

  test("date input accepts a typed date", async ({ page }) => {
    await open(page, "/components/date-input")
    const us = example(page, "Month-day-year (US)").getByRole("group", {
      name: "US date",
    })
    const month = us.getByRole("spinbutton", { name: "Month" })
    await month.click()
    await page.keyboard.type("12")
    await page.keyboard.press("Tab")
    await page.keyboard.type("25")
    await page.keyboard.press("Tab")
    await page.keyboard.type("2025")
    await expect(month).toHaveValue("12")
    await expect(us.getByRole("spinbutton", { name: "Day" })).toHaveValue("25")
    await expect(us.getByRole("spinbutton", { name: "Year" })).toHaveValue(
      "2025",
    )
  })

  test("time picker opens and selects a time", async ({ page }) => {
    await open(page, "/components/time-picker")
    const trigger = example(page, "Single value (12-hour, default)").locator(
      "button.dr-time-picker-trigger",
    )
    await expect(trigger).not.toHaveText("10:30 AM")
    await trigger.click()
    const popover = page.locator(".dr-popover-content")
    await popover.getByRole("button", { name: "Hour 10" }).click()
    await popover.getByRole("button", { name: "Minute 30" }).click()
    await popover.getByRole("button", { name: "OK" }).click()
    await expect(popover).toHaveCount(0)
    await expect(trigger).toHaveText("10:30 AM")
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
    await open(page, "/components/color-picker")
    const picker = example(page, "Brand color with swatches")
    const input = picker.getByRole("textbox", { name: "Brand color" })
    const swatch = picker.locator(".dr-color-picker-swatch")
    await expect(input).toHaveValue("#3b82f6")

    await picker
      .getByRole("button", { name: "Open color picker", exact: true })
      .click()
    const content = page.locator(".dr-color-picker-content")
    await expect(content).toBeVisible()
    await content.getByRole("button", { name: "Select color #ef4444" }).click()
    await expect(input).toHaveValue("#ef4444")
    await expect(swatch).toHaveCSS("background-color", "rgb(239, 68, 68)")
    await expect(swatch).toHaveAccessibleName(
      "Open color picker, current color #ef4444",
    )
  })
})

test.describe("form validation", () => {
  test("form fields surface validation errors on submit", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await open(page, "/components/form-fields")
    const form = example(
      page,
      "TextField, TextareaField, NumberField, SelectField, SwitchField, RadioGroupField, CheckboxField",
    )
    const invalid = form.locator('[data-invalid="true"], [aria-invalid="true"]')
    await expect(invalid).toHaveCount(0)
    await form.getByRole("button", { name: "Submit Demo Form" }).click()
    await expect(invalid.first()).toBeVisible()
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
    await open(page, "/components/field")
    const field = example(page, "Description and error")
    const input = field.getByRole("textbox", { name: "Username" })
    await expect(input).toHaveAccessibleDescription("3 to 20 characters.")
    await expect(input).not.toHaveAttribute("aria-invalid", "true")
    await expect(field.getByRole("alert")).toHaveCount(0)

    await input.fill("not valid!")
    await expect(input).toHaveAttribute("aria-invalid", "true")
    await expect(field.getByRole("alert")).toHaveText(
      "Use only letters, digits and hyphens.",
    )
    await expect(input).toHaveAccessibleDescription(
      "3 to 20 characters. Use only letters, digits and hyphens.",
    )

    await input.fill("valid-name")
    await expect(input).not.toHaveAttribute("aria-invalid", "true")
    await expect(input).toHaveAccessibleDescription("3 to 20 characters.")
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
