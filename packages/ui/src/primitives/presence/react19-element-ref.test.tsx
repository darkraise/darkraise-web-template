import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as React from "react"
import { Presence } from "./Presence"
import { Slot } from "../slot/Slot"

// React 19 only installs the deprecation getter on `element.ref` when the
// element was created WITH a (non-null) ref; a ref-less element gets a silent
// `value: null`. So every probe element below must carry a ref, otherwise the
// test would pass even against buggy code. React dedupes the warning per
// element type name, so each case uses a distinct tag.
const REF_WARNING = /Accessing element\.ref was removed in React 19/

function warned(spy: ReturnType<typeof vi.spyOn>): boolean {
  return spy.mock.calls.some((args) =>
    args.some((a) => typeof a === "string" && REF_WARNING.test(a)),
  )
}

// Reproduces the pre-fix pattern: read `.ref` straight off the element.
function BuggyReader({ children }: { children: React.ReactElement }) {
  void (children as unknown as { ref?: unknown }).ref
  return children
}

describe("React 19 element.ref access", () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    spy.mockRestore()
  })

  it("control: accessing element.ref on a ref-bearing element warns", () => {
    const el = <span ref={React.createRef<HTMLSpanElement>()} />
    void (el as unknown as { ref?: unknown }).ref
    expect(warned(spy)).toBe(true)
  })

  it("negative control: a component reading children.ref warns", () => {
    render(
      <BuggyReader>
        <section ref={React.createRef<HTMLElement>()} />
      </BuggyReader>,
    )
    expect(warned(spy)).toBe(true)
  })

  it("Presence reads ref via props, not element.ref", () => {
    render(
      <Presence present>
        <div ref={React.createRef<HTMLDivElement>()} />
      </Presence>,
    )
    expect(warned(spy)).toBe(false)
  })

  it("Slot reads ref via props, not element.ref", () => {
    render(
      <Slot>
        <button ref={React.createRef<HTMLButtonElement>()}>ok</button>
      </Slot>,
    )
    expect(warned(spy)).toBe(false)
  })
})
