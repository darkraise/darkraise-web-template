import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Checkbox } from "darkraise-ui/components/checkbox"
import { Label } from "darkraise-ui/components/label"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/checkbox")({
  component: CheckboxPage,
})

function CheckboxPage() {
  const [checked, setChecked] = useState(false)

  return (
    <ShowcasePage
      title="Checkbox"
      description="Two-state and indeterminate boolean input. Pair with a Label for accessible click targets."
    >
      <ShowcaseExample
        title="States"
        code={`const [checked, setChecked] = useState(false)

<Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
<Label htmlFor="terms">Accept terms and conditions</Label>

<Checkbox id="disabled-cb" disabled />
<Label htmlFor="disabled-cb">Disabled</Label>

<Checkbox id="checked-disabled" checked disabled />
<Label htmlFor="checked-disabled">Checked and disabled</Label>`}
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="demo-checkbox"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
            />
            <Label htmlFor="demo-checkbox">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="demo-checkbox-disabled" disabled />
            <Label htmlFor="demo-checkbox-disabled" className="opacity-50">
              Disabled
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="demo-checkbox-checked-disabled" checked disabled />
            <Label
              htmlFor="demo-checkbox-checked-disabled"
              className="opacity-50"
            >
              Checked and disabled
            </Label>
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Sizes"
        code={`<Checkbox size="sm" />     // Small
<Checkbox size="default" /> // Default
<Checkbox size="lg" />      // Large`}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-sm" size="sm" defaultChecked />
            <Label htmlFor="cb-sm" className="text-xs">
              Small
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-default" size="default" defaultChecked />
            <Label htmlFor="cb-default" className="text-sm">
              Default
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-lg" size="lg" defaultChecked />
            <Label htmlFor="cb-lg">Large</Label>
          </div>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
