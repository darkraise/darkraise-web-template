import { afterEach, describe, expect, it } from "vitest"
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

  afterEach(() => {
    document.documentElement.removeAttribute("data-mode")
  })

  it("copies the host mode into the frame document", async () => {
    document.documentElement.setAttribute("data-mode", "dark")
    render(<Frame data-testid="f">x</Frame>)
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => {
      expect(iframe.contentDocument?.documentElement.style.colorScheme).toBe(
        "dark",
      )
    })
  })

  it("follows a mode change on the host", async () => {
    document.documentElement.setAttribute("data-mode", "light")
    render(<Frame data-testid="f">x</Frame>)
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => {
      expect(iframe.contentDocument?.documentElement.style.colorScheme).toBe(
        "light",
      )
    })
    document.documentElement.setAttribute("data-mode", "dark")
    await waitFor(() => {
      expect(iframe.contentDocument?.documentElement.style.colorScheme).toBe(
        "dark",
      )
    })
  })

  it("leaves the scheme unset without a theme", async () => {
    render(<Frame data-testid="f">x</Frame>)
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => expect(iframe.contentDocument).not.toBeNull())
    expect(iframe.contentDocument?.documentElement.style.colorScheme).toBe("")
  })
})
