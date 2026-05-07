import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"
import * as React from "react"
import { usePresence } from "./usePresence"

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

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
    await act(async () => {
      await nextFrame()
    })
    expect(result.current.state).toBe("closed")
    expect(result.current.isPresent).toBe(false)
  })

  it("waits for running exit animations before unmounting", async () => {
    const node = document.createElement("div")
    document.body.appendChild(node)

    let resolveAnimation: (() => void) | undefined
    const finished = new Promise<void>((resolve) => {
      resolveAnimation = resolve
    })
    const fakeAnimation = { finished } as unknown as Animation

    let animations: Animation[] = []
    Object.defineProperty(node, "getAnimations", {
      configurable: true,
      value: () => animations,
    })

    try {
      const { result, rerender } = renderHook(
        ({ open }: { open: boolean }) => {
          const ref = React.useRef<HTMLElement | null>(node)
          return usePresence(open, ref)
        },
        { initialProps: { open: true } },
      )
      expect(result.current.isPresent).toBe(true)
      expect(result.current.state).toBe("open")

      animations = [fakeAnimation]
      rerender({ open: false })

      await act(async () => {})
      expect(result.current.state).toBe("closed")
      expect(result.current.isPresent).toBe(true)

      await act(async () => {
        await nextFrame()
      })
      expect(result.current.state).toBe("closed")
      expect(result.current.isPresent).toBe(true)

      await act(async () => {
        resolveAnimation?.()
        await finished
      })
      expect(result.current.isPresent).toBe(false)
    } finally {
      document.body.removeChild(node)
    }
  })
})
