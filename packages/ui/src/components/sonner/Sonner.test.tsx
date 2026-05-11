import { render, screen, act, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
import { Toaster } from "@components/sonner"
import { toast } from "@components/sonner/toastStore"

// jsdom lacks setPointerCapture / releasePointerCapture — stub them globally.
beforeAll(() => {
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = vi.fn()
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  }
})

// Reset store before each test to prevent cross-test pollution.
beforeEach(() => {
  act(() => {
    toast.dismiss()
  })
})

describe("Sonner / Toaster", () => {
  it("Toaster renders nothing when there are no toasts", () => {
    render(<Toaster />)
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("toast() adds a toast with the given message", async () => {
    render(<Toaster />)
    act(() => {
      toast("Hello world")
    })
    const li = await screen.findByRole("status")
    expect(li).toHaveTextContent("Hello world")
  })

  it("toast.success renders a success toast", async () => {
    render(<Toaster />)
    act(() => {
      toast.success("Saved!")
    })
    const li = await screen.findByRole("status")
    expect(li).toHaveTextContent("Saved!")
    expect(li).toHaveAttribute("data-kind", "success")
  })

  it("toast.error renders an error toast with assertive aria-live", async () => {
    render(<Toaster />)
    act(() => {
      toast.error("Something broke")
    })
    const li = await screen.findByRole("status")
    expect(li).toHaveAttribute("aria-live", "assertive")
    expect(li).toHaveAttribute("data-kind", "error")
  })

  it("multiple toasts stack in the DOM", async () => {
    render(<Toaster />)
    act(() => {
      toast("First")
      toast("Second")
      toast("Third")
    })
    const items = await screen.findAllByRole("status")
    expect(items).toHaveLength(3)
  })

  it("toast.dismiss(id) removes a single toast", async () => {
    render(<Toaster />)
    let id = ""
    act(() => {
      id = toast("Remove me", { duration: Number.POSITIVE_INFINITY })
      toast("Keep me", { duration: Number.POSITIVE_INFINITY })
    })
    expect(await screen.findAllByRole("status")).toHaveLength(2)
    act(() => {
      toast.dismiss(id)
    })
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(1))
    expect(screen.getByRole("status")).toHaveTextContent("Keep me")
  })

  it("toast.dismiss() with no args clears all toasts", async () => {
    render(<Toaster />)
    act(() => {
      toast("A")
      toast("B")
    })
    await screen.findAllByRole("status")
    act(() => {
      toast.dismiss()
    })
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(0))
  })

  it("dismiss button removes that toast", async () => {
    const user = userEvent.setup()
    render(<Toaster />)
    act(() => {
      toast("Click to dismiss", { duration: Number.POSITIVE_INFINITY })
    })
    await screen.findByRole("status")
    const closeBtn = screen.getByRole("button", {
      name: /dismiss notification/i,
    })
    await user.click(closeBtn)
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(0))
  })

  it("pointerdown on the close button does not capture on the <li>", async () => {
    // The <li> mounts a swipe-to-dismiss handler that calls setPointerCapture
    // on pointerdown. If capture is set on the ancestor, the spec dispatches
    // the resulting click to the capturing element rather than the inner
    // button — so onClick on the close button never fires. Ensure pointerdowns
    // whose target is the close button are ignored by the swipe handler.
    const captureSpy = vi.fn()
    HTMLElement.prototype.setPointerCapture = captureSpy
    try {
      render(<Toaster />)
      act(() => {
        toast("Press me", { duration: Number.POSITIVE_INFINITY })
      })
      await screen.findByRole("status")
      const closeBtn = screen.getByRole("button", {
        name: /dismiss notification/i,
      })
      closeBtn.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          pointerId: 1,
          clientX: 100,
        }),
      )
      expect(captureSpy).not.toHaveBeenCalled()
    } finally {
      HTMLElement.prototype.setPointerCapture = vi.fn()
    }
  })

  it("toasts in different positions render in separate stacks", async () => {
    render(<Toaster position="bottom-right" />)
    act(() => {
      toast("Default position", { duration: Number.POSITIVE_INFINITY })
      toast.success("Top-left override", {
        position: "top-left",
        duration: Number.POSITIVE_INFINITY,
      })
    })
    await waitFor(() => expect(screen.queryAllByRole("status")).toHaveLength(2))
    const lists = Array.from(document.querySelectorAll(".dr-toaster"))
    expect(lists).toHaveLength(2)
    const positions = lists.map((el) => el.getAttribute("data-position")).sort()
    expect(positions).toEqual(["bottom-right", "top-left"])
  })

  it("toast.promise auto-dismisses after morphing to success", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      render(<Toaster />)

      let resolveFn: (value: string) => void = () => {}
      const deferred = new Promise<string>((resolve) => {
        resolveFn = resolve
      })

      act(() => {
        void toast.promise(deferred, {
          loading: "Loading…",
          success: (data) => `Got ${data}`,
          error: "Failed",
        })
      })

      const loadingItem = await screen.findByRole("status")
      expect(loadingItem).toHaveAttribute("data-kind", "loading")

      // Resolve and let React commit the morph to success.
      await act(async () => {
        resolveFn("data")
        await deferred
      })

      const successItem = screen.getByRole("status")
      expect(successItem).toHaveAttribute("data-kind", "success")
      expect(successItem).toHaveTextContent("Got data")

      // Success default is 4000ms, with a 300ms close animation tail.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4500)
      })

      expect(screen.queryAllByRole("status")).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
