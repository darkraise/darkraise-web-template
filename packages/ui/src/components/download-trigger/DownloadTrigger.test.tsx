import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DownloadTrigger } from "./DownloadTrigger"

describe("DownloadTrigger", () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:fake")
    revokeObjectURL = vi.fn()
    globalThis.URL.createObjectURL =
      createObjectURL as unknown as typeof URL.createObjectURL
    globalThis.URL.revokeObjectURL =
      revokeObjectURL as unknown as typeof URL.revokeObjectURL
  })

  it("triggers a download with the given filename when clicked", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" })
    render(
      <DownloadTrigger fileName="hello.txt" data={blob}>
        Download
      </DownloadTrigger>,
    )
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})
    await userEvent.click(screen.getByRole("button", { name: "Download" }))
    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(click).toHaveBeenCalledTimes(1)
    click.mockRestore()
  })

  it("calls onDownload after triggering", async () => {
    const onDownload = vi.fn()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})
    render(
      <DownloadTrigger
        fileName="x.txt"
        data={new Blob(["x"])}
        onDownload={onDownload}
      >
        Go
      </DownloadTrigger>,
    )
    await userEvent.click(screen.getByRole("button"))
    expect(onDownload).toHaveBeenCalledTimes(1)
    click.mockRestore()
  })

  it("wires fileName onto the anchor's download attribute and href to the object URL", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})
    render(
      <DownloadTrigger fileName="report.csv" data={blob}>
        Download
      </DownloadTrigger>,
    )
    await userEvent.click(screen.getByRole("button", { name: "Download" }))

    expect(click).toHaveBeenCalledTimes(1)
    const anchor = click.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.download).toBe("report.csv")
    expect(anchor.getAttribute("href")).toBe("blob:fake")
    expect(anchor.rel).toBe("noopener")

    click.mockRestore()
  })
})
