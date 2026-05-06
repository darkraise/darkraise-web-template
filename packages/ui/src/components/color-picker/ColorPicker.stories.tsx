import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { ChevronDown, Pipette } from "lucide-react"

import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropperTrigger,
  ColorPickerInput,
  ColorPickerLabel,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerSwatchItem,
  ColorPickerTrigger,
} from "./ColorPicker"

const PRESETS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#000000",
  "#ffffff",
]

const meta: Meta<typeof ColorPicker> = {
  title: "UI/ColorPicker",
  component: ColorPicker,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ColorPicker>

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("#3b82f6")
    return (
      <div className="w-72">
        <ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
          <ColorPickerLabel>Brand color</ColorPickerLabel>
          <ColorPickerControl>
            <ColorPickerSwatch />
            <ColorPickerInput />
            <ColorPickerTrigger>
              <ChevronDown className="h-4 w-4" />
            </ColorPickerTrigger>
          </ColorPickerControl>
          <ColorPickerContent>
            <ColorPickerArea />
            <ColorPickerSwatchGroup>
              {PRESETS.map((c) => (
                <ColorPickerSwatchItem key={c} value={c} />
              ))}
            </ColorPickerSwatchGroup>
          </ColorPickerContent>
        </ColorPicker>
      </div>
    )
  },
}

export const Embedded: Story = {
  render: () => {
    const [value, setValue] = React.useState("#10b981")
    return (
      <div className="border-border flex w-72 flex-col gap-3 rounded-md border p-3">
        <ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
          <ColorPickerLabel>Highlight</ColorPickerLabel>
          <ColorPickerControl>
            <ColorPickerSwatch />
            <ColorPickerInput />
          </ColorPickerControl>
          <ColorPickerArea />
          <ColorPickerSwatchGroup>
            {PRESETS.map((c) => (
              <ColorPickerSwatchItem key={c} value={c} />
            ))}
          </ColorPickerSwatchGroup>
        </ColorPicker>
      </div>
    )
  },
}

export const WithEyeDropper: Story = {
  render: () => {
    const [value, setValue] = React.useState("#8b5cf6")
    return (
      <div className="w-72">
        <ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
          <ColorPickerLabel>Accent</ColorPickerLabel>
          <ColorPickerControl>
            <ColorPickerSwatch />
            <ColorPickerInput />
            <ColorPickerTrigger>
              <ChevronDown className="h-4 w-4" />
            </ColorPickerTrigger>
          </ColorPickerControl>
          <ColorPickerContent>
            <ColorPickerArea />
            <ColorPickerSwatchGroup>
              {PRESETS.map((c) => (
                <ColorPickerSwatchItem key={c} value={c} />
              ))}
            </ColorPickerSwatchGroup>
            <ColorPickerEyeDropperTrigger>
              <Pipette className="h-4 w-4" />
            </ColorPickerEyeDropperTrigger>
          </ColorPickerContent>
        </ColorPicker>
      </div>
    )
  },
}
