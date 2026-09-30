import { afterEach, describe, expect, it, vi } from "vitest"
import { writeClipboardText } from "./clipboard"

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
    writable: true,
  })
}

function mockExecCommand(result: boolean) {
  const execCommand = vi.fn().mockReturnValue(result)
  Object.defineProperty(document, "execCommand", {
    value: execCommand,
    configurable: true,
    writable: true,
  })
  return execCommand
}

describe("writeClipboardText", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("uses the Clipboard API when it is available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    const execCommand = mockExecCommand(true)

    await writeClipboardText("hello")

    expect(writeText).toHaveBeenCalledWith("hello")
    expect(execCommand).not.toHaveBeenCalled()
  })

  it("falls back to a selection copy outside a secure context", async () => {
    setClipboard(undefined)
    let selected = ""
    const execCommand = vi.fn(() => {
      selected = document.getSelection()?.toString() ?? ""
      return true
    })
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
      writable: true,
    })

    await writeClipboardText("line one\nline two")

    expect(execCommand).toHaveBeenCalledWith("copy")
    expect(selected).toBe("line one\nline two")
    expect(document.body.childElementCount).toBe(0)
  })

  it("falls back when the Clipboard API rejects", async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) })
    const execCommand = mockExecCommand(true)

    await writeClipboardText("hello")

    expect(execCommand).toHaveBeenCalledWith("copy")
  })

  it("rejects with the API's error when both paths fail", async () => {
    const error = new Error("denied")
    setClipboard({ writeText: vi.fn().mockRejectedValue(error) })
    mockExecCommand(false)

    await expect(writeClipboardText("hello")).rejects.toBe(error)
  })
})
