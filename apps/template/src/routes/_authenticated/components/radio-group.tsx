import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Label } from "darkraise-ui/components/label"
import { RadioGroup, RadioGroupItem } from "darkraise-ui/components/radio-group"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/radio-group")({
  component: RadioGroupPage,
})

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
        title="Sizes"
        code={`<RadioGroupItem value="a" size="sm" />     // Small
<RadioGroupItem value="b" size="default" /> // Default
<RadioGroupItem value="c" size="lg" />      // Large`}
      >
        <RadioGroup defaultValue="size-a">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="size-a" id="radio-sm" size="sm" />
              <Label htmlFor="radio-sm" className="text-xs">
                Small
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="size-b"
                id="radio-default"
                size="default"
              />
              <Label htmlFor="radio-default" className="text-sm">
                Default
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="size-c" id="radio-lg" size="lg" />
              <Label htmlFor="radio-lg">Large</Label>
            </div>
          </div>
        </RadioGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
