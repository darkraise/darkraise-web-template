import { describe, expect, it, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { useFocusTrap } from "./useFocusTrap"

function Trap({
  disabled = false,
  loop = true,
}: {
  disabled?: boolean
  loop?: boolean
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  useFocusTrap(ref, { disabled, loop })
  return (
    <div ref={ref} data-testid="trap">
      <button data-testid="a">a</button>
      <button data-testid="b">b</button>
      <button data-testid="c">c</button>
    </div>
  )
}

describe("useFocusTrap", () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it("focuses the first tabbable on mount", async () => {
    const { findByTestId } = render(<Trap />)
    const a = await findByTestId("a")
    expect(document.activeElement).toBe(a)
  })

  it("Shift+Tab from first wraps to last when loop is true", async () => {
    const { findByTestId } = render(<Trap loop />)
    const a = await findByTestId("a")
    a.focus()
    await userEvent.tab({ shift: true })
    expect((document.activeElement as HTMLElement)?.dataset.testid).toBe("c")
  })

  it("Tab from last wraps to first when loop is true", async () => {
    const { findByTestId } = render(<Trap loop />)
    const c = await findByTestId("c")
    c.focus()
    await userEvent.tab()
    expect((document.activeElement as HTMLElement)?.dataset.testid).toBe("a")
  })

  it("does nothing when disabled", async () => {
    const { findByTestId } = render(
      <>
        <button data-testid="outside">o</button>
        <Trap disabled />
      </>,
    )
    const outside = await findByTestId("outside")
    outside.focus()
    expect(document.activeElement).toBe(outside)
  })
})
