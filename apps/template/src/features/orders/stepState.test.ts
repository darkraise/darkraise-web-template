import { describe, expect, it } from "vitest"
import { ORDER_STEPS, stepState } from "./stepState"

describe("stepState", () => {
  it.each([
    ["pending", ["current", "upcoming", "upcoming", "upcoming"]],
    ["processing", ["complete", "current", "upcoming", "upcoming"]],
    ["shipped", ["complete", "complete", "current", "upcoming"]],
    ["delivered", ["complete", "complete", "complete", "complete"]],
    ["cancelled", ["upcoming", "upcoming", "upcoming", "upcoming"]],
  ] as const)("%s", (status, expected) => {
    expect(ORDER_STEPS.map((_, index) => stepState(index, status))).toEqual(
      expected,
    )
  })
})
