import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Label } from "darkraise-ui/components/label"
import { RadioGroup, RadioGroupItem } from "darkraise-ui/components/radio-group"
import type {
  RadioGroupOrientation,
  RadioSize,
} from "darkraise-ui/components/radio-group"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/radio-group")({
  component: RadioGroupPage,
})

const RADIO_SIZES = allOf<RadioSize>()("sm", "default", "lg")
const RADIO_ORIENTATIONS = allOf<RadioGroupOrientation>()(
  "horizontal",
  "vertical",
)

const RADIO_MATRIX_ITEMS = ["a", "b", "c"] as const

function RadioMatrixCell({
  size,
  orientation,
}: {
  size: RadioSize
  orientation: RadioGroupOrientation
}) {
  return (
    <RadioGroup
      defaultValue="a"
      orientation={orientation}
      className={
        orientation === "horizontal" ? "flex items-center gap-4" : undefined
      }
    >
      {RADIO_MATRIX_ITEMS.map((item) => {
        const id = `radio-${size}-${orientation}-${item}`
        return (
          <div key={item} className="flex items-center gap-2">
            <RadioGroupItem value={item} id={id} size={size} />
            <Label htmlFor={id}>{item.toUpperCase()}</Label>
          </div>
        )
      })}
    </RadioGroup>
  )
}

function RadioGroupPage() {
  const [value, setValue] = useState("option-a")

  return (
    <ShowcasePage
      title="Radio Group"
      description="Exclusive selection across two or more options. The group owns the value; each RadioGroupItem provides one choice."
    >
      <ShowcaseExample
        title="Vertical group"
        code={`const [value, setValue] = useState("option-a")

<Field>
  <FieldLabel>Plan</FieldLabel>
  <RadioGroup value={value} onValueChange={setValue}>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="option-a" id="a" />
      <Label htmlFor="a">Option A</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="option-b" id="b" />
      <Label htmlFor="b">Option B</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="option-c" id="c" />
      <Label htmlFor="c">Option C</Label>
    </div>
  </RadioGroup>
</Field>`}
      >
        <Field>
          <FieldLabel>Plan</FieldLabel>
          <RadioGroup value={value} onValueChange={setValue}>
            {["option-a", "option-b", "option-c"].map((v) => (
              <div key={v} className="flex items-center gap-2">
                <RadioGroupItem value={v} id={`radio-${v}`} />
                <Label htmlFor={`radio-${v}`}>
                  {v.replace("option-", "Option ")}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Field>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled group"
        code={`<RadioGroup defaultValue="option-a" disabled>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-a" id="dis-a" />
    <Label htmlFor="dis-a" className="opacity-50">Option A</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-b" id="dis-b" />
    <Label htmlFor="dis-b" className="opacity-50">Option B</Label>
  </div>
</RadioGroup>`}
      >
        <RadioGroup defaultValue="option-a" disabled>
          {["option-a", "option-b"].map((v) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={`radio-dis-${v}`} />
              <Label htmlFor={`radio-dis-${v}`} className="opacity-50">
                {v.replace("option-", "Option ")}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Size x orientation"
        code={`// One representative cell: every size x orientation combination renders
// above.
<RadioGroup
  defaultValue="a"
  orientation="horizontal"
  className="flex items-center gap-4"
>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="a" id="a" size="lg" />
    <Label htmlFor="a">A</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="b" id="b" size="lg" />
    <Label htmlFor="b">B</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="c" id="c" size="lg" />
    <Label htmlFor="c">C</Label>
  </div>
</RadioGroup>`}
      >
        <VariantMatrix
          rows={{ label: "size", values: RADIO_SIZES }}
          cols={{ label: "orientation", values: RADIO_ORIENTATIONS }}
          render={(size, orientation) => (
            <RadioMatrixCell size={size} orientation={orientation} />
          )}
        />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
