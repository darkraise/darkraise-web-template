import { describe, expect, it } from "vitest"
import {
  fieldTriggerBodyOf,
  resolveFieldTrigger,
  resolveFieldTriggerIn,
} from "./fieldTrigger"

const SHEET = `
@utility focus-ring {
  &:focus-visible {
    outline: 2px solid red;
  }
}

/* The closed trigger. */
@utility field-trigger {
  @apply flex gap-2;

  & > span {
    @apply truncate;
  }

  height: var(--field-height);
  border-bottom-color: var(--field-edge);
}

@theme inline {
  --color-border: red;
}
`

const UTILITY =
  "@apply flex gap-2; & > span { @apply truncate; } height: var(--field-height); border-bottom-color: var(--field-edge);"

describe("field-trigger resolution", () => {
  it("reads the utility's body with its nested rules, normalised", () => {
    expect(fieldTriggerBodyOf(SHEET)).toBe(UTILITY)
  })

  it("fails loudly when the stylesheet has no field-trigger utility", () => {
    expect(() => fieldTriggerBodyOf("@utility glass { color: red; }")).toThrow(
      /field-trigger/,
    )
  })

  it.each([
    "@apply field-trigger;",
    "@apply field-trigger min-w-48; width: fit-content;",
    "@apply field-trigger; width: fit-content;",
  ])("resolves %s to the utility's body", (body) => {
    expect(resolveFieldTriggerIn(body, SHEET)).toBe(UTILITY)
  })

  it.each([
    "@apply flex border; height: var(--field-height);",
    "@apply field-trigger-wide;",
  ])("leaves %s unchanged: it does not apply the utility", (body) => {
    expect(resolveFieldTrigger(body)).toBe(body)
  })

  it.each([
    "@apply field-trigger; height: 1px; border-radius: 0;",
    "@apply field-trigger; height: 1px;",
    "@apply field-trigger; min-height: 0;",
    "@apply field-trigger; border-radius: 0;",
    "@apply field-trigger; border-top-left-radius: 0;",
    "@apply field-trigger; background-color: red;",
    "@apply field-trigger; background: red;",
    "@apply field-trigger; border-color: red;",
    "@apply field-trigger; border-bottom-color: red;",
    "@apply field-trigger; border: 0;",
    "@apply field-trigger h-4;",
    "@apply field-trigger rounded-none;",
    "@apply field-trigger md:rounded-full;",
    "@apply field-trigger bg-transparent;",
    "@apply field-trigger border-0;",
  ])("leaves %s unchanged: it overrides the utility", (body) => {
    expect(resolveFieldTriggerIn(body, SHEET)).toBe(body)
  })
})
