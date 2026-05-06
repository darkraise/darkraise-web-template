import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
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
} from "darkraise-ui/components/color-picker"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/color-picker")(
  {
    component: ColorPickerPage,
  },
)

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

function BrandPicker() {
  const [value, setValue] = useState("#3b82f6")
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
}

function WithEyeDropper() {
  const [value, setValue] = useState("#8b5cf6")
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
}

function Embedded() {
  const [value, setValue] = useState("#10b981")
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
}

function HexInputField() {
  const [value, setValue] = useState("#f59e0b")
  return (
    <div className="w-72">
      <ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
        <ColorPickerLabel>Hex</ColorPickerLabel>
        <ColorPickerControl>
          <ColorPickerSwatch />
          <ColorPickerInput />
        </ColorPickerControl>
      </ColorPicker>
    </div>
  )
}

function ColorPickerPage() {
  return (
    <ShowcasePage
      title="ColorPicker"
      description="A hex color picker that composes Popover, Input, and react-colorful's saturation/hue surface. Swatch presets, eye-dropper, and embedded layouts are supported."
    >
      <ShowcaseExample
        title="Brand color with swatches"
        code={`const [value, setValue] = useState("#3b82f6")

<ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
  <ColorPickerLabel>Brand color</ColorPickerLabel>
  <ColorPickerControl>
    <ColorPickerSwatch />
    <ColorPickerInput />
    <ColorPickerTrigger><ChevronDown className="h-4 w-4" /></ColorPickerTrigger>
  </ColorPickerControl>
  <ColorPickerContent>
    <ColorPickerArea />
    <ColorPickerSwatchGroup>
      {PRESETS.map((c) => <ColorPickerSwatchItem key={c} value={c} />)}
    </ColorPickerSwatchGroup>
  </ColorPickerContent>
</ColorPicker>`}
      >
        <BrandPicker />
      </ShowcaseExample>

      <ShowcaseExample
        title="With eye-dropper"
        code={`<ColorPickerContent>
  <ColorPickerArea />
  <ColorPickerSwatchGroup>...</ColorPickerSwatchGroup>
  <ColorPickerEyeDropperTrigger>
    <Pipette className="h-4 w-4" />
  </ColorPickerEyeDropperTrigger>
</ColorPickerContent>`}
      >
        <WithEyeDropper />
      </ShowcaseExample>

      <ShowcaseExample
        title="Embedded (no popover)"
        code={`<ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
  <ColorPickerLabel>Highlight</ColorPickerLabel>
  <ColorPickerControl>
    <ColorPickerSwatch />
    <ColorPickerInput />
  </ColorPickerControl>
  <ColorPickerArea />
  <ColorPickerSwatchGroup>...</ColorPickerSwatchGroup>
</ColorPicker>`}
      >
        <Embedded />
      </ShowcaseExample>

      <ShowcaseExample
        title="Hex input field only"
        code={`<ColorPicker value={value} onValueChange={(d) => setValue(d.value)}>
  <ColorPickerLabel>Hex</ColorPickerLabel>
  <ColorPickerControl>
    <ColorPickerSwatch />
    <ColorPickerInput />
  </ColorPickerControl>
</ColorPicker>`}
      >
        <HexInputField />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
