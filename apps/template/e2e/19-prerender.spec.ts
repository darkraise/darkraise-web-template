import { readFileSync } from "node:fs"
import { test, expect } from "@playwright/test"
import { gotoApp, seedApp } from "./helpers/app"

interface ScaffoldAxis {
  values: string[]
  default: string
  storageKey: string
  attribute: string | null
}

const AXES = JSON.parse(
  readFileSync(
    new URL("../../../create-app/bin/axes.json", import.meta.url),
    "utf8",
  ),
) as Record<string, ScaffoldAxis>

// The kit does not export its migration revision, and its source cannot be
// imported here: its path aliases do not resolve under the e2e tsconfig.
const LEGACY_REVISION = /export const LEGACY_REVISION = (\d+)/.exec(
  readFileSync(
    new URL("../../../packages/ui/src/theme/axes/legacy.ts", import.meta.url),
    "utf8",
  ),
)?.[1]
if (!LEGACY_REVISION) throw new Error("LEGACY_REVISION not found in legacy.ts")

// Mode must be `dark`: `system` and `light` both resolve to light under
// Playwright's scheme and would prove nothing. Every other axis takes its
// last non-default value, which puts the style on glass and both glass axes
// off their defaults.
const PINNED: Record<string, string> = {
  mode: "dark",
}

// Every attribute axis, seeded with its last non-default value. With the app
// bundle blocked, an attribute present after reload can only come from the
// pre-render script.
const SEED: [storageKey: string, attribute: string, value: string][] =
  Object.values(AXES).flatMap((axis) =>
    axis.attribute
      ? [
          [
            axis.storageKey,
            axis.attribute,
            PINNED[axis.storageKey] ??
              [...axis.values].reverse().find((v) => v !== axis.default) ??
              axis.default,
          ] as [string, string, string],
        ]
      : [],
  )

const seeded = (storageKey: string) =>
  SEED.find(([key]) => key === storageKey)?.[2] ?? ""

test("restores the stored theme before the app mounts", async ({ page }) => {
  await seedApp(page)
  await page.addInitScript((seed: [string, string, string][]) => {
    for (const [key, , value] of seed) {
      if (localStorage.getItem(key) === null) localStorage.setItem(key, value)
    }
  }, SEED)
  await gotoApp(page, "/components/buttons")
  const html = page.locator("html")
  await expect(html).toHaveAttribute("data-accent", seeded("theme-accent"))
  const primary = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue("--primary"),
  )
  expect(primary).not.toBe("")

  // Without the app bundle nothing but the pre-render script can paint.
  await page.route(/\/src\/main\.tsx/, (route) => route.abort())
  await page.reload()
  for (const [, attribute, value] of SEED) {
    await expect(html, attribute).toHaveAttribute(attribute, value)
  }
  expect(
    await page.evaluate(() =>
      document.documentElement.style.getPropertyValue("--primary"),
    ),
  ).toBe(primary)
  await expect(page.locator("#root .app-loading")).toHaveCount(1)
})

// 6.x storage and the attributes the migrated values paint. Each case has
// the app bundle blocked from its first load, so nothing but the pre-render
// script can have migrated or painted anything. The script stamps every
// attribute axis, so an axis the migration left alone paints its default;
// `removed` lists keys that must be absent from storage afterwards, and
// `kept` the values storage must hold.
const LEGACY_USERS: {
  name: string
  stored: Record<string, string>
  painted: Record<string, string>
  absent: string[]
  removed: string[]
  kept: Record<string, string>
}[] = [
  {
    name: "a 6.x glass user on a solid canvas",
    stored: {
      mode: "dark",
      "theme-preset": "glass",
      "theme-bg-style": "solid",
      "theme-surface-color": "red",
      "theme-elevation": "low",
      "theme-surface-intensity": "bold",
      "theme-glass-halo": "pronounced",
      "theme-canvas-tint": "neutral",
    },
    painted: {
      "data-mode": "dark",
      "data-style": "glass",
      "data-background-style": "gradient",
      "data-surface": "zinc",
      "data-tint-with-accent": "on",
      "data-elevation": "standard",
      "data-outer-glow": "vivid",
      "data-background-intensity": "neutral",
      "data-contrast": "standard",
      "data-glass-opacity": "medium",
      "data-glass-blur": "medium",
    },
    absent: ["data-preset"],
    removed: [
      "theme-surface-intensity",
      "theme-glass-halo",
      "theme-canvas-tint",
      "theme-contrast",
    ],
    kept: { "theme-preset": "glass" },
  },
  {
    name: "a 6.x sci-fi user",
    stored: {
      mode: "dark",
      "theme-preset": "scifi",
      "theme-scifi-frame": "notched",
      "theme-surface-intensity": "bold",
      "theme-accent-intensity": "intense",
    },
    painted: {
      "data-mode": "dark",
      "data-style": "quiet",
      "data-contrast": "standard",
      "data-dark-accent-chroma": "standard",
    },
    absent: ["data-preset", "data-scifi-frame"],
    removed: [
      "theme-preset",
      "theme-scifi-frame",
      "theme-surface-intensity",
      "theme-accent-intensity",
      "theme-contrast",
      "theme-dark-accent-chroma",
    ],
    kept: {},
  },
  {
    name: "a 6.0 user with accent vibrancy",
    stored: { mode: "dark", "theme-accent-vibrancy": "intense" },
    painted: {
      "data-mode": "dark",
      "data-style": "quiet",
      "data-dark-accent-chroma": "vivid",
    },
    absent: ["data-preset"],
    removed: ["theme-accent-vibrancy", "theme-accent-intensity"],
    kept: { "theme-dark-accent-chroma": "vivid" },
  },
  {
    // 6.x wrote `medium` as a completed default, never as a choice.
    name: "a 6.x default user with glass axes stored at medium",
    stored: {
      mode: "dark",
      "theme-preset": "default",
      "theme-glass-opacity": "medium",
      "theme-glass-blur": "high",
    },
    painted: {
      "data-mode": "dark",
      "data-style": "quiet",
      "data-glass-opacity": "medium",
      "data-glass-blur": "high",
    },
    absent: ["data-preset"],
    removed: ["theme-glass-opacity"],
    kept: { "theme-preset": "quiet", "theme-glass-blur": "high" },
  },
  {
    // At marker 1 only revision 2 runs: the vibrancy key, which a revision 1
    // rule would migrate, is left as it is.
    name: "a browser that already ran revision 1",
    stored: {
      "theme-settings-version": "1",
      mode: "dark",
      "theme-preset": "default",
      "theme-glass-blur": "medium",
      "theme-accent-vibrancy": "intense",
    },
    painted: {
      "data-mode": "dark",
      "data-style": "quiet",
      "data-glass-blur": "medium",
      "data-dark-accent-chroma": "standard",
    },
    absent: ["data-preset"],
    removed: ["theme-glass-blur", "theme-dark-accent-chroma"],
    kept: { "theme-preset": "quiet", "theme-accent-vibrancy": "intense" },
  },
  {
    // At marker 2 only revision 3 runs: the sidebar indicator becomes a look.
    // The look reaches the DOM only on the sidebar, which needs the app.
    name: "a browser that already ran revision 2",
    stored: {
      "theme-settings-version": "2",
      mode: "dark",
      "theme-sidebar-active-bar": "ring",
    },
    painted: { "data-mode": "dark", "data-style": "quiet" },
    absent: ["data-preset"],
    removed: ["theme-sidebar-active-bar"],
    kept: { "theme-sidebar-selection": "chip" },
  },
]

for (const user of LEGACY_USERS) {
  test(`migrates ${user.name} before the app mounts`, async ({ page }) => {
    await page.addInitScript((stored: Record<string, string>) => {
      for (const [key, value] of Object.entries(stored)) {
        localStorage.setItem(key, value)
      }
    }, user.stored)
    await page.route(/\/src\/main\.tsx/, (route) => route.abort())
    await page.goto("/components/buttons")

    const html = page.locator("html")
    for (const [attribute, value] of Object.entries(user.painted)) {
      await expect(html, attribute).toHaveAttribute(attribute, value)
    }
    for (const attribute of user.absent) {
      await expect(html, attribute).not.toHaveAttribute(attribute)
    }
    const left = await page.evaluate(
      (keys: string[]) => keys.map((key) => localStorage.getItem(key)),
      [...user.removed, ...Object.keys(user.kept), "theme-settings-version"],
    )
    expect(left).toEqual([
      ...user.removed.map(() => null),
      ...Object.values(user.kept),
      LEGACY_REVISION,
    ])
    await expect(page.locator("#root .app-loading")).toHaveCount(1)
  })
}
