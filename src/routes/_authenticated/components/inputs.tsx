import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Textarea } from "@/core/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Switch } from "@/core/components/ui/switch"
import { Label } from "@/core/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/inputs")({
  component: InputsPage,
})

function InputsPage() {
  const [selectValue, setSelectValue] = useState("")
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [switchChecked, setSwitchChecked] = useState(false)
  const [radioValue, setRadioValue] = useState("option-a")

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Inputs" },
        ]}
        title="Inputs"
        description="Form control primitives: text input, textarea, select, checkbox, switch, and radio group."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Text input states"
          code={`<Label htmlFor="default">Default</Label>
<Input id="default" placeholder="Type something..." />

<Label htmlFor="disabled">Disabled</Label>
<Input id="disabled" placeholder="Cannot be edited" disabled />

<Label htmlFor="with-value">With value</Label>
<Input id="with-value" defaultValue="Existing content" />`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-default">Default</Label>
              <Input id="demo-default" placeholder="Type something..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-disabled">Disabled</Label>
              <Input
                id="demo-disabled"
                placeholder="Cannot be edited"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-value">With value</Label>
              <Input id="demo-value" defaultValue="Existing content" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-password">Password</Label>
              <Input
                id="demo-password"
                type="password"
                defaultValue="secret123"
              />
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Textarea"
          code={`<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" placeholder="Tell us about yourself..." rows={3} />

<Label htmlFor="disabled-ta">Disabled</Label>
<Textarea id="disabled-ta" placeholder="Disabled" disabled rows={2} />`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-textarea">Bio</Label>
              <Textarea
                id="demo-textarea"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-textarea-disabled">Disabled</Label>
              <Textarea
                id="demo-textarea-disabled"
                placeholder="Disabled"
                disabled
                rows={3}
              />
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Select"
          code={`<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Pick an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="alpha">Alpha</SelectItem>
    <SelectItem value="beta">Beta</SelectItem>
    <SelectItem value="gamma">Gamma</SelectItem>
  </SelectContent>
</Select>

<Select disabled>
  <SelectTrigger>
    <SelectValue placeholder="Disabled" />
  </SelectTrigger>
</Select>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-select">Select</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger id="demo-select">
                  <SelectValue placeholder="Pick an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="gamma">Gamma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disabled select</Label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Disabled" />
                </SelectTrigger>
              </Select>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Checkbox"
          code={`<Checkbox
  id="terms"
  checked={checked}
  onCheckedChange={(v) => setChecked(v === true)}
/>
<Label htmlFor="terms">Accept terms and conditions</Label>

<Checkbox id="disabled-cb" disabled />
<Label htmlFor="disabled-cb">Disabled</Label>

<Checkbox id="checked-disabled" checked disabled />
<Label htmlFor="checked-disabled">Checked disabled</Label>`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="demo-checkbox"
                checked={checkboxChecked}
                onCheckedChange={(v) => setCheckboxChecked(v === true)}
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
          title="Switch"
          code={`<Switch
  id="notifications"
  checked={enabled}
  onCheckedChange={setEnabled}
/>
<Label htmlFor="notifications">Enable notifications</Label>

<Switch id="disabled-sw" disabled />
<Label htmlFor="disabled-sw">Disabled</Label>`}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch
                id="demo-switch"
                checked={switchChecked}
                onCheckedChange={setSwitchChecked}
              />
              <Label htmlFor="demo-switch">Enable notifications</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="demo-switch-on" defaultChecked />
              <Label htmlFor="demo-switch-on">Enabled by default</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="demo-switch-disabled" disabled />
              <Label htmlFor="demo-switch-disabled" className="opacity-50">
                Disabled
              </Label>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Radio Group"
          code={`<RadioGroup value={value} onValueChange={setValue}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-a" id="a" />
    <Label htmlFor="a">Option A</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="option-b" id="b" />
    <Label htmlFor="b">Option B</Label>
  </div>
</RadioGroup>`}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Vertical group</Label>
              <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                {["option-a", "option-b", "option-c"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`demo-radio-${v}`} />
                    <Label htmlFor={`demo-radio-${v}`}>
                      {v.replace("option-", "Option ")}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Disabled group</Label>
              <RadioGroup defaultValue="option-a" disabled>
                {["option-a", "option-b"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={`demo-radio-dis-${v}`} />
                    <Label
                      htmlFor={`demo-radio-dis-${v}`}
                      className="opacity-50"
                    >
                      {v.replace("option-", "Option ")}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Input with button"
          code={`<div className="flex gap-2">
  <Input placeholder="Enter email address..." />
  <Button>Subscribe</Button>
</div>`}
        >
          <div className="flex max-w-sm gap-2">
            <Input placeholder="Enter email address..." />
            <Button>Subscribe</Button>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
