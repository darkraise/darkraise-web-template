import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { Frame } from "./Frame"

describe("Frame", () => {
  it("renders an iframe element", () => {
    render(<Frame data-testid="f">child</Frame>)
    expect(screen.getByTestId("f").tagName).toBe("IFRAME")
  })

  it("portals children into the iframe document body once loaded", async () => {
    render(
      <Frame data-testid="f">
        <p>hello inside frame</p>
      </Frame>,
    )
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    // jsdom synchronously creates a document for srcDoc-less iframes.
    await waitFor(() => {
      expect(iframe.contentDocument?.body.textContent).toContain(
        "hello inside frame",
      )
    })
  })
})
