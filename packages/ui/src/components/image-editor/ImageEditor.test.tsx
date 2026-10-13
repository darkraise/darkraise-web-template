import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { ImageEditor, ImageEditorPreset } from "./index"

describe("ImageEditorPreset", () => {
  // The theme paints [data-preset="<name>"] with a preset's tokens wherever
  // it sits, so a filter named like a theme preset must not carry it.
  it("names its filter without taking a theme preset's tokens", () => {
    render(
      <ImageEditor
        presets={[{ id: "soft-glass", label: "Soft glass", filters: {} }]}
      >
        <ImageEditorPreset preset="soft-glass" />
      </ImageEditor>,
    )
    const button = screen.getByRole("button", { name: "Soft glass" })
    expect(button).toHaveAttribute("data-filter-preset", "soft-glass")
    expect(button).not.toHaveAttribute("data-preset")
  })
})
