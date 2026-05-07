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
})
