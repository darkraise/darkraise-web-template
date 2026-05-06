import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  Clipboard,
  ClipboardControl,
  ClipboardIndicator,
  ClipboardInput,
  ClipboardLabel,
  ClipboardTrigger,
} from "./Clipboard"

let writeTextMock: ReturnType<typeof vi.fn>

function installClipboardMock() {
  writeTextMock = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    configurable: true,
    writable: true,
  })
}

function renderClipboard(
  props: { value: string; timeout?: number } = { value: "hello" },
) {
  return render(
    <Clipboard value={props.value} timeout={props.timeout}>
      <ClipboardLabel>Share</ClipboardLabel>
      <ClipboardControl>
        <ClipboardInput aria-label="copy-target" />
        <ClipboardTrigger aria-label="copy">
          <ClipboardIndicator
            copied={<span>done</span>}
            fallback={<span>copy</span>}
          />
        </ClipboardTrigger>
      </ClipboardControl>
    </Clipboard>,
  )
}

describe("Clipboard", () => {
  beforeEach(() => {
    installClipboardMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("renders the value inside the input", () => {
    renderClipboard({ value: "https://example.com" })
    const input = screen.getByLabelText("copy-target") as HTMLInputElement
    expect(input.value).toBe("https://example.com")
    expect(input).toHaveAttribute("readonly")
  })

  it("calls navigator.clipboard.writeText with the value when the trigger is clicked", async () => {
    const user = userEvent.setup()
    // userEvent.setup() installs its own clipboard mock; reinstall ours after.
    installClipboardMock()
    renderClipboard({ value: "secret-token" })

    await user.click(screen.getByRole("button", { name: "copy" }))

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("secret-token")
    })
  })

  it("flips data-copied to true after click and back to false after timeout", async () => {
    renderClipboard({ value: "x", timeout: 1000 })
    const user = userEvent.setup()

    const trigger = screen.getByRole("button", { name: "copy" })
    expect(trigger).toHaveAttribute("data-copied", "false")

    await user.click(trigger)
    await waitFor(() => expect(trigger).toHaveAttribute("data-copied", "true"))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1100))
    })
    expect(trigger).toHaveAttribute("data-copied", "false")
  })

  it("invokes onCopyStatusChange with copied=true then copied=false", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Clipboard value="abc" timeout={500} onCopyStatusChange={onChange}>
        <ClipboardControl>
          <ClipboardTrigger aria-label="copy">
            <ClipboardIndicator
              copied={<span>ok</span>}
              fallback={<span>copy</span>}
            />
          </ClipboardTrigger>
        </ClipboardControl>
      </Clipboard>,
    )

    await user.click(screen.getByRole("button", { name: "copy" }))
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ copied: true, value: "abc" }),
      ),
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ copied: false, value: "abc" }),
    )
  })

  it("fires onCopyStatusChange with error when writeText rejects", async () => {
    const error = new Error("denied")
    const onCopyStatusChange = vi.fn()
    const user = userEvent.setup()
    // userEvent.setup() installs its own clipboard mock; spy after to override.
    const writeSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockRejectedValue(error)

    render(
      <Clipboard value="test" onCopyStatusChange={onCopyStatusChange}>
        <ClipboardControl>
          <ClipboardTrigger>
            <ClipboardIndicator
              copied={<span>copied</span>}
              fallback={<span>copy</span>}
            />
          </ClipboardTrigger>
        </ClipboardControl>
      </Clipboard>,
    )

    await user.click(screen.getByRole("button"))

    await waitFor(() => {
      expect(onCopyStatusChange).toHaveBeenCalledWith({
        copied: false,
        value: "test",
        error,
      })
    })
    // state stays idle: no second call with copied=true
    expect(onCopyStatusChange).toHaveBeenCalledTimes(1)
    writeSpy.mockRestore()
  })
})
