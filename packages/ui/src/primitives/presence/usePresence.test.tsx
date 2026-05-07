import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import * as React from "react"
import { usePresence } from "./usePresence"

describe("usePresence", () => {
  it("returns isPresent=true and state='open' immediately when present is true", () => {
    const { result } = renderHook(() => {
      const ref = React.useRef<HTMLDivElement | null>(null)
      return { presence: usePresence(true, ref), ref }
    })
    expect(result.current.presence.isPresent).toBe(true)
    expect(result.current.presence.state).toBe("open")
  })

  it("flips to closed when present becomes false and unmounts when no animations are running", async () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => {
        const ref = React.useRef<HTMLDivElement | null>(null)
        if (!ref.current) ref.current = document.createElement("div")
        return usePresence(open, ref)
      },
      { initialProps: { open: true } },
    )
    expect(result.current.isPresent).toBe(true)
    rerender({ open: false })
    await act(async () => {})
    expect(result.current.state).toBe("closed")
    expect(result.current.isPresent).toBe(false)
  })
})
