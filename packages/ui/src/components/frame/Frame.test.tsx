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

  /** Text of the colour-scheme rule Frame renders into the frame head. */
  const schemeRule = (iframe: HTMLIFrameElement) =>
    [...(iframe.contentDocument?.head.querySelectorAll("style") ?? [])]
      .map((style) => style.textContent ?? "")
      .find((text) => text.startsWith(":where(:root)"))

  it("copies the host mode into the frame document", async () => {
    document.documentElement.setAttribute("data-mode", "dark")
    render(<Frame data-testid="f">x</Frame>)
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => {
      expect(schemeRule(iframe)).toBe(":where(:root){color-scheme:dark}")
    })
  })

  it("follows a mode change on the host", async () => {
    document.documentElement.setAttribute("data-mode", "light")
    render(<Frame data-testid="f">x</Frame>)
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => {
      expect(schemeRule(iframe)).toBe(":where(:root){color-scheme:light}")
    })
    document.documentElement.setAttribute("data-mode", "dark")
    await waitFor(() => {
      expect(schemeRule(iframe)).toBe(":where(:root){color-scheme:dark}")
    })
  })

  it("leaves the scheme unset without a theme", async () => {
    render(<Frame data-testid="f">x</Frame>)
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => expect(iframe.contentDocument).not.toBeNull())
    expect(schemeRule(iframe)).toBeUndefined()
    expect(iframe.contentDocument?.documentElement.style.colorScheme).toBe("")
  })

  it("lets a frame stylesheet override the host scheme", async () => {
    document.documentElement.setAttribute("data-mode", "dark")
    render(
      <Frame
        data-testid="f"
        head={<style>{":root{color-scheme:light}"}</style>}
      >
        x
      </Frame>,
    )
    const iframe = screen.getByTestId("f") as HTMLIFrameElement
    await waitFor(() => {
      expect(iframe.contentDocument?.head.textContent).toContain(
        ":root{color-scheme:light}",
      )
    })
    const frameDocument = iframe.contentDocument as Document
    expect(frameDocument.documentElement.style.colorScheme).toBe("")
    expect(schemeRule(iframe)).toBe(":where(:root){color-scheme:dark}")
  })
})
