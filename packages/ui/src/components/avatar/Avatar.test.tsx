import { render, screen, act, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { createRef } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@components/avatar"

describe("Avatar", () => {
  let originalImage: typeof window.Image
  let lastImage: HTMLImageElement | null = null

  beforeEach(() => {
    originalImage = window.Image
    lastImage = null
    class MockImage {
      _src = ""
      _listeners: Record<string, EventListener[]> = {}
      complete = false
      naturalWidth = 0
      referrerPolicy = ""
      crossOrigin: string | null = null
      get src() {
        return this._src
      }
      set src(v: string) {
        this._src = v
      }
      addEventListener(type: string, l: EventListener) {
        this._listeners[type] = [...(this._listeners[type] ?? []), l]
      }
      removeEventListener(type: string, l: EventListener) {
        this._listeners[type] =
          this._listeners[type]?.filter((cb) => cb !== l) ?? []
      }
      dispatchEvent(type: string) {
        for (const cb of this._listeners[type] ?? []) cb(new Event(type))
      }
      constructor() {
        lastImage = this as unknown as HTMLImageElement
      }
    }
    window.Image = MockImage as unknown as typeof window.Image
  })

  afterEach(() => {
    window.Image = originalImage
  })

  it("renders the root span with class", () => {
    const { container } = render(<Avatar>x</Avatar>)
    const root = container.firstChild as HTMLElement
    expect(root.tagName).toBe("SPAN")
    expect(root).toHaveClass("dr-avatar")
  })

  it("forwards root ref", () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Avatar ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("renders fallback initially before image loads", () => {
    render(
      <Avatar>
        <AvatarImage src="/x.png" alt="" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("renders image after load event", async () => {
    render(
      <Avatar>
        <AvatarImage src="/x.png" alt="me" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    expect(lastImage).not.toBeNull()
    await act(async () => {
      ;(
        lastImage as unknown as { dispatchEvent: (t: string) => void }
      ).dispatchEvent("load")
    })
    await waitFor(() => {
      expect(screen.getByAltText("me")).toBeInTheDocument()
      expect(screen.queryByText("JD")).toBeNull()
    })
  })

  it("keeps fallback after image error", async () => {
    render(
      <Avatar>
        <AvatarImage src="/bad.png" alt="me" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    )
    await act(async () => {
      ;(
        lastImage as unknown as { dispatchEvent: (t: string) => void }
      ).dispatchEvent("error")
    })
    await waitFor(() => {
      expect(screen.queryByAltText("me")).toBeNull()
      expect(screen.getByText("JD")).toBeInTheDocument()
    })
  })

  it("delays fallback render when delayMs set", async () => {
    vi.useFakeTimers()
    render(
      <Avatar>
        <AvatarFallback delayMs={500}>JD</AvatarFallback>
      </Avatar>,
    )
    expect(screen.queryByText("JD")).toBeNull()
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText("JD")).toBeInTheDocument()
    vi.useRealTimers()
  })
})
