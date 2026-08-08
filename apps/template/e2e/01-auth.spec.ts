import { test, expect } from "@playwright/test"
import { gotoApp, seedApp, watchConsole } from "./helpers/app"

test.describe("authentication", () => {
  test("unauthenticated visitor is redirected to login", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page, {}, { authenticated: false })
    await gotoApp(page, "/")
    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible()
    consoleWatch.assertClean()
  })

  test("protected component route redirects to login", async ({ page }) => {
    await seedApp(page, {}, { authenticated: false })
    await gotoApp(page, "/components/buttons")
    await expect(page).toHaveURL(/\/login$/)
  })

  for (const [path, heading] of [
    ["/login", /Welcome back/],
    ["/register", /.+/],
    ["/forgot-password", /.+/],
    ["/reset-password", /.+/],
  ] as const) {
    test(`guest route ${path} renders`, async ({ page }) => {
      const consoleWatch = watchConsole(page)
      await seedApp(page, {}, { authenticated: false })
      await gotoApp(page, path)
      await expect(page.getByRole("heading").first()).toHaveText(heading)
      consoleWatch.assertClean()
    })
  }

  test("login form signs in and lands on the dashboard", async ({ page }) => {
    const consoleWatch = watchConsole(page)
    await seedApp(page, {}, { authenticated: false })
    await gotoApp(page, "/login")

    await page.getByRole("textbox", { name: "Email" }).fill("demo@example.com")
    await page.getByRole("textbox", { name: "Password" }).fill("password123")
    await page.getByRole("button", { name: "Sign in" }).click()

    await expect(page).toHaveURL("http://localhost:5176/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    expect(
      await page.evaluate(() => localStorage.getItem("auth-token")),
    ).toBeTruthy()
    consoleWatch.assertClean()
  })

  test("password visibility toggle reveals the value", async ({ page }) => {
    await seedApp(page, {}, { authenticated: false })
    await gotoApp(page, "/login")
    const password = page.getByRole("textbox", { name: "Password" })
    await password.fill("secret")
    await expect(password).toHaveAttribute("type", "password")
    await page.getByRole("button", { name: "Show password" }).click()
    await expect(password).toHaveAttribute("type", "text")
  })

  test("seeded session reaches the dashboard directly", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/")
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
  })

  test("unknown route renders the not-found page", async ({ page }) => {
    await seedApp(page)
    await gotoApp(page, "/this-route-does-not-exist")
    await expect(page.getByText(/404|not found/i).first()).toBeVisible()
  })
})
