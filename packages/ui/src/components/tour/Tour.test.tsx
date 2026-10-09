import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import * as React from "react"
import { Tour, type TourStep } from "./Tour"

const STEPS: TourStep[] = [
  {
    targetSelector: "[data-tour='one']",
    title: "Step 1",
    description: "First",
  },
  {
    targetSelector: "[data-tour='two']",
    title: "Step 2",
    description: "Second",
  },
  {
    targetSelector: "[data-tour='three']",
    title: "Step 3",
    description: "Third",
  },
]

function Targets() {
  return (
    <>
      <div data-tour="one">One</div>
      <div data-tour="two">Two</div>
      <div data-tour="three">Three</div>
    </>
  )
}

describe("Tour", () => {
  it("renders the current step's title and description when open", () => {
    render(
      <>
        <Targets />
        <Tour
          open
          steps={STEPS}
          current={0}
          onChange={() => {}}
          onClose={() => {}}
        />
      </>,
    )
    expect(screen.getByText("Step 1")).toBeInTheDocument()
    expect(screen.getByText("First")).toBeInTheDocument()
  })

  it("Next advances the step", async () => {
    const onChange = vi.fn()
    function Wrapper() {
      const [step, setStep] = React.useState(0)
      return (
        <>
          <Targets />
          <Tour
            open
            steps={STEPS}
            current={step}
            onChange={(next) => {
              setStep(next)
              onChange(next)
            }}
            onClose={() => {}}
          />
        </>
      )
    }
    render(<Wrapper />)
    await userEvent.click(await screen.findByRole("button", { name: /next/i }))
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it("Prev goes back; disabled on first step", async () => {
    const onChange = vi.fn()
    render(
      <>
        <Targets />
        <Tour
          open
          steps={STEPS}
          current={0}
          onChange={onChange}
          onClose={() => {}}
        />
      </>,
    )
    expect(
      await screen.findByRole("button", { name: /previous/i }),
    ).toBeDisabled()
  })

  it("Skip / Close fires onClose", async () => {
    const onClose = vi.fn()
    render(
      <>
        <Targets />
        <Tour
          open
          steps={STEPS}
          current={0}
          onChange={() => {}}
          onClose={onClose}
        />
      </>,
    )
    await userEvent.click(
      await screen.findByRole("button", { name: /skip|close/i }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("renders nothing when open=false", () => {
    render(
      <>
        <Targets />
        <Tour
          open={false}
          steps={STEPS}
          current={0}
          onChange={() => {}}
          onClose={() => {}}
        />
      </>,
    )
    expect(screen.queryByText("Step 1")).not.toBeInTheDocument()
  })

  it("scrolls the target into view on step change", async () => {
    const scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    function Wrapper() {
      const [step, setStep] = React.useState(0)
      return (
        <>
          <Targets />
          <Tour
            open
            steps={STEPS}
            current={step}
            onChange={setStep}
            onClose={() => {}}
          />
        </>
      )
    }
    render(<Wrapper />)
    await userEvent.click(await screen.findByRole("button", { name: /next/i }))
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
  })

  it("focuses the popover on open and restores focus on close", async () => {
    function Wrapper() {
      const [open, setOpen] = React.useState(false)
      return (
        <>
          <Targets />
          <button
            data-testid="opener"
            type="button"
            onClick={() => setOpen(true)}
          >
            Open
          </button>
          <Tour
            open={open}
            steps={STEPS}
            current={0}
            onChange={() => {}}
            onClose={() => setOpen(false)}
          />
        </>
      )
    }
    render(<Wrapper />)
    const opener = screen.getByTestId("opener")
    opener.focus()
    expect(opener).toHaveFocus()

    await userEvent.click(opener)

    const popover = screen.getByRole("dialog")
    await waitFor(() => expect(popover).toHaveFocus())

    await userEvent.click(screen.getByRole("button", { name: /skip/i }))

    await waitFor(() => expect(opener).toHaveFocus())
  })

  it("hides the popover until positioned again after a reopen", async () => {
    function Wrapper({ open, current }: { open: boolean; current: number }) {
      return (
        <>
          <Targets />
          <Tour
            open={open}
            steps={STEPS}
            current={current}
            onChange={() => {}}
            onClose={() => {}}
          />
        </>
      )
    }
    const { rerender } = render(<Wrapper open current={0} />)
    await waitFor(() =>
      expect(screen.getByRole("dialog").style.visibility).toBe(""),
    )

    rerender(<Wrapper open={false} current={0} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    // A mutation record is delivered before Floating UI's asynchronous
    // measurement settles, so it reads the popover as first committed.
    const firstVisibility: string[] = []
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          const dialog =
            node instanceof HTMLElement
              ? node.matches("[role='dialog']")
                ? node
                : node.querySelector<HTMLElement>("[role='dialog']")
              : null
          if (dialog) firstVisibility.push(dialog.style.visibility)
        }
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    rerender(<Wrapper open current={1} />)
    await screen.findByText("Step 2")
    observer.disconnect()

    expect(firstVisibility[0]).toBe("hidden")
    await waitFor(() =>
      expect(screen.getByRole("dialog").style.visibility).toBe(""),
    )
  })
})
