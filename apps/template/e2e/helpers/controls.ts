import { expect, type Page } from "@playwright/test"
import { collectGarbage } from "./app"

export const CONTROL_FIXTURE = "/e2e/fixtures/control-contract.html"

const TRANSITION_TIMEOUT = 5_000

export async function openControlFixture(page: Page): Promise<void> {
  await collectGarbage(page)
  await page.goto(CONTROL_FIXTURE)
  await page.getByTestId("control-height").waitFor({ state: "attached" })
  await page
    .locator('[data-probe="segment"] .dr-segment-group-item')
    .first()
    .waitFor()
  // The fixture paints the light fallback before ThemeProvider applies the
  // seeded theme, so colours are still transitioning when the controls first
  // appear; a pixel sampled then is a blend of the two themes. Wait for the
  // theme, give its transitions a frame to start, then let them finish (a
  // transition cut short by a later style change rejects, which is fine).
  // The wait is bounded so a transition that never ends fails here, by name,
  // rather than as a test timeout.
  await expect(page.locator("html")).toHaveAttribute("data-style", /.+/)
  const pending = await page.evaluate(async (timeout) => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    const transitions = document
      .getAnimations()
      .filter((animation) => animation instanceof CSSTransition)
    const ended = await Promise.race([
      Promise.all(
        transitions.map((animation) => animation.finished.catch(() => null)),
      ).then(() => true),
      new Promise<false>((resolve) =>
        setTimeout(() => resolve(false), timeout),
      ),
    ])
    return ended
      ? []
      : transitions
          .filter((animation) => animation.playState !== "finished")
          .map((animation) => animation.transitionProperty)
  }, TRANSITION_TIMEOUT)
  if (pending.length > 0) {
    throw new Error(
      `openControlFixture: transitions still running after ${TRANSITION_TIMEOUT}ms: ${pending.join(", ")}`,
    )
  }
}
