import { describe, expect, it, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { useFocusTrap } from "./useFocusTrap"
import { isProgrammaticFocus } from "./programmaticFocus"

function Trap({
  disabled = false,
  loop = true,
  initialOnB = false,
}: {
  disabled?: boolean
  loop?: boolean
  initialOnB?: boolean
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  useFocusTrap(ref, {
    disabled,
    loop,
    initialFocus: initialOnB
      ? () => ref.current?.querySelector<HTMLElement>("[data-testid=b]") ?? null
      : null,
  })
  return (
    <div ref={ref} data-testid="trap">
      <button data-testid="a">a</button>
      <button data-testid="b">b</button>
      <button data-testid="c">c</button>
    </div>
  )
}

// Records, for every focus that lands, which element got it and whether the
// move was marked as the library's own.
function recordFocus(): { id: string | undefined; programmatic: boolean }[] {
  const seen: { id: string | undefined; programmatic: boolean }[] = []
  document.addEventListener(
    "focusin",
    (event) =>
      seen.push({
        id: (event.target as HTMLElement).dataset?.testid,
        programmatic: isProgrammaticFocus(),
      }),
    true,
  )
  return seen
}

describe("useFocusTrap", () => {
  beforeEach(() => {
    document.body.replaceChildren()
  })

  it("marks the focus it moves on open and on close as programmatic", async () => {
    const outside = document.createElement("button")
    outside.dataset.testid = "outside"
    document.body.append(outside)
    outside.focus()
    const seen = recordFocus()

    const { findByTestId, unmount } = render(<Trap />)
    await findByTestId("a")
    unmount()

    expect(seen).toEqual([
      { id: "a", programmatic: true },
      { id: "outside", programmatic: true },
    ])
  })

  it("marks focus it moves to initialFocus as programmatic", async () => {
    const seen = recordFocus()
    const { findByTestId } = render(<Trap initialOnB />)
    await findByTestId("b")

    expect(seen).toEqual([{ id: "b", programmatic: true }])
  })

  it("leaves the Tab wrap-around unmarked, since the user pressed Tab", async () => {
    const { findByTestId } = render(<Trap loop />)
    const c = await findByTestId("c")
    c.focus()
    const seen = recordFocus()
    await userEvent.tab()

    expect(seen).toEqual([{ id: "a", programmatic: false }])
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
