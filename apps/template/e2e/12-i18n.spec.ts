import { test, expect } from "@playwright/test"
import { seedApp } from "./helpers/app"

test("table filters and portalled controls survive language changes", async ({
  page,
}) => {
  await seedApp(page)
  await page.goto("/products")
  const search = page.getByPlaceholder("Search products...")
  await search.fill("no-matching-product")
  await expect(
    page.getByText("No results found", { exact: true }),
  ).toBeVisible()
  await page.getByRole("combobox", { name: "Language" }).click()
  await page.getByRole("option", { name: "Tiếng Việt" }).click()
  await expect(page.getByPlaceholder("Tìm sản phẩm...")).toHaveValue(
    "no-matching-product",
  )
  await expect(
    page.getByText("Không tìm thấy kết quả", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Cột", exact: true }).click()
  await expect(page.getByRole("menu")).toBeVisible()
  expect(
    await page
      .getByRole("menu")
      .evaluate((element) => element.closest("[lang]")?.getAttribute("lang")),
  ).toBe("vi")
})

test("localized showcase controls and root error pages use the shared locale", async ({
  page,
}) => {
  await seedApp(page)
  await page.goto("/components/calendar")
  await page.getByRole("combobox", { name: "Language" }).click()
  await page.getByRole("option", { name: "Tiếng Việt" }).click()
  await expect(page.getByText("Lịch cơ bản", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Xem mã", exact: true }).first(),
  ).toBeVisible()
  await expect(
    page.getByText("Chọn năm và thập kỷ — nhấp tiêu đề để thu nhỏ", {
      exact: true,
    }),
  ).toBeVisible()
  await page.goto("/missing-i18n-page")
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy trang" }),
  ).toBeVisible()
})

test("the language control remains usable with translated labels on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedApp(page)
  await page.goto("/settings")
  await page.getByRole("combobox", { name: "Language" }).first().click()
  await page.getByRole("option", { name: "Tiếng Việt" }).click()
  await expect(
    page.getByRole("combobox", { name: "Ngôn ngữ" }).first(),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Cài đặt", exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
})

test("shared locale switches settings and navigation and survives reload", async ({
  page,
}, testInfo) => {
  await seedApp(page)
  await page.goto("/settings")
  const trigger = page.getByRole("combobox", { name: "Language" }).first()
  await expect(trigger.locator(".dr-locale-option")).toHaveCSS(
    "display",
    "inline-flex",
  )
  await expect(trigger.locator(".dr-locale-option-icon svg")).toHaveAttribute(
    "viewBox",
    "0 0 19 10",
  )
  await trigger.click()
  await expect(
    page
      .getByRole("option", { name: "English", exact: true })
      .locator(".dr-locale-option-icon svg"),
  ).toHaveAttribute("viewBox", "0 0 19 10")
  await expect(
    page
      .getByRole("option", { name: "Tiếng Việt", exact: true })
      .locator(".dr-locale-option-icon svg"),
  ).toHaveAttribute("viewBox", "0 0 30 20")
  await expect(
    page
      .getByRole("option", { name: "Tiếng Việt", exact: true })
      .locator(".dr-locale-option"),
  ).toHaveCSS("display", "inline-flex")
  const box = await trigger.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) throw new Error("Language trigger is not visible")
  await page.screenshot({
    path: testInfo.outputPath("flags-menu.png"),
    clip: {
      x: Math.max(box.x - 20, 0),
      y: Math.max(box.y - 10, 0),
      width: Math.min(300, viewport.width - Math.max(box.x - 20, 0)),
      height: 200,
    },
  })
  await page.getByRole("option", { name: "Tiếng Việt" }).click()
  await expect(
    page
      .getByRole("combobox", { name: "Ngôn ngữ" })
      .first()
      .locator(".dr-locale-option-icon svg"),
  ).toHaveAttribute("viewBox", "0 0 30 20")
  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
  await expect(
    page.getByRole("heading", { name: "Cài đặt", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Sản phẩm", exact: true }).first(),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Cài đặt", exact: true }),
  ).toBeVisible()
  await page.getByRole("combobox", { name: "Ngôn ngữ" }).first().click()
  await page.getByRole("option", { name: "English" }).click()
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible()
})

test("language changes preserve an authentication draft and translate existing errors", async ({
  page,
}) => {
  await page.goto("/login")
  await page.getByLabel("Email", { exact: true }).fill("invalid")
  await page.getByLabel("Password", { exact: true }).focus()
  await expect(
    page.getByText("Enter a valid email", { exact: true }),
  ).toBeVisible()
  await page.getByRole("combobox", { name: "Language" }).click()
  await page.getByRole("option", { name: "Tiếng Việt" }).click()
  await expect(
    page.getByRole("heading", { name: "Chào mừng trở lại" }),
  ).toBeVisible()
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("invalid")
  await expect(
    page.getByText("Nhập email hợp lệ", { exact: true }),
  ).toBeVisible()
})
