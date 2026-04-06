import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Eye, EyeOff, X } from "lucide-react"
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
import { Field, FieldLabel } from "@/core/components/ui/field"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/inputs")({
  component: InputsPage,
})

function ClearableInputExample() {
  const [value, setValue] = useState("")
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type to search..."
        className="pr-8"
      />
      {value && (
        <X
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 cursor-pointer"
          onClick={() => setValue("")}
        />
      )}
    </div>
  )
}

function PasswordInputExample() {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        defaultValue="supersecret123"
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword((p) => !p)}
        className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

function CharCountTextareaExample() {
  const [value, setValue] = useState(
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  )
  const countColor =
    value.length > 270
      ? "text-destructive"
      : value.length > 240
        ? "text-amber-500"
        : "text-muted-foreground"
  return (
    <div className="space-y-1">
      <Textarea
        maxLength={280}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
      />
      <p className={`text-right text-xs ${countColor}`}>{value.length} / 280</p>
    </div>
  )
}

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
          code={`<Field>
  <FieldLabel htmlFor="default">Default</FieldLabel>
  <Input id="default" placeholder="Type something..." />
</Field>

<Field>
  <FieldLabel htmlFor="disabled">Disabled</FieldLabel>
  <Input id="disabled" placeholder="Cannot be edited" disabled />
</Field>

<Field>
  <FieldLabel htmlFor="with-value">With value</FieldLabel>
  <Input id="with-value" defaultValue="Existing content" />
</Field>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="demo-default">Default</FieldLabel>
              <Input id="demo-default" placeholder="Type something..." />
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-disabled">Disabled</FieldLabel>
              <Input
                id="demo-disabled"
                placeholder="Cannot be edited"
                disabled
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-value">With value</FieldLabel>
              <Input id="demo-value" defaultValue="Existing content" />
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-password">Password</FieldLabel>
              <Input
                id="demo-password"
                type="password"
                defaultValue="secret123"
              />
            </Field>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Textarea"
          code={`<Field>
  <FieldLabel htmlFor="bio">Bio</FieldLabel>
  <Textarea id="bio" placeholder="Tell us about yourself..." rows={3} />
</Field>

<Field>
  <FieldLabel htmlFor="disabled-ta">Disabled</FieldLabel>
  <Textarea id="disabled-ta" placeholder="Disabled" disabled rows={2} />
</Field>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="demo-textarea">Bio</FieldLabel>
              <Textarea
                id="demo-textarea"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="demo-textarea-disabled">Disabled</FieldLabel>
              <Textarea
                id="demo-textarea-disabled"
                placeholder="Disabled"
                disabled
                rows={3}
              />
            </Field>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Select"
          code={`<Field>
  <FieldLabel htmlFor="select">Select</FieldLabel>
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger id="select">
      <SelectValue placeholder="Pick an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="alpha">Alpha</SelectItem>
      <SelectItem value="beta">Beta</SelectItem>
      <SelectItem value="gamma">Gamma</SelectItem>
    </SelectContent>
  </Select>
</Field>

<Field>
  <FieldLabel>Disabled select</FieldLabel>
  <Select disabled>
    <SelectTrigger>
      <SelectValue placeholder="Disabled" />
    </SelectTrigger>
  </Select>
</Field>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="demo-select">Select</FieldLabel>
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
            </Field>
            <Field>
              <FieldLabel>Disabled select</FieldLabel>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Disabled" />
                </SelectTrigger>
              </Select>
            </Field>
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
          <div className="space-y-2.5">
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
          title="Checkbox sizes"
          code={`<Checkbox size="sm" /> Small
<Checkbox size="default" /> Default
<Checkbox size="lg" /> Large`}
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
          <div className="space-y-2.5">
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
          code={`<Field>
  <FieldLabel>Vertical group</FieldLabel>
  <RadioGroup value={value} onValueChange={setValue}>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="option-a" id="a" />
      <Label htmlFor="a">Option A</Label>
    </div>
    <div className="flex items-center gap-2">
      <RadioGroupItem value="option-b" id="b" />
      <Label htmlFor="b">Option B</Label>
    </div>
  </RadioGroup>
</Field>`}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel>Vertical group</FieldLabel>
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
            </Field>
            <Field>
              <FieldLabel>Disabled group</FieldLabel>
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
            </Field>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Radio group sizes"
          code={`<RadioGroupItem value="a" size="sm" /> Small
<RadioGroupItem value="b" size="default" /> Default
<RadioGroupItem value="c" size="lg" /> Large`}
        >
          <div className="flex items-center gap-6">
            <RadioGroup defaultValue="sm-a">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sm-a" id="radio-sm" size="sm" />
                  <Label htmlFor="radio-sm" className="text-xs">
                    Small
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="sm-b"
                    id="radio-default"
                    size="default"
                  />
                  <Label htmlFor="radio-default" className="text-sm">
                    Default
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sm-c" id="radio-lg" size="lg" />
                  <Label htmlFor="radio-lg">Large</Label>
                </div>
              </div>
            </RadioGroup>
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

        <ShowcaseExample
          title="Prefix / suffix input"
          code={`{/* URL prefix */}
<Field>
  <FieldLabel>URL</FieldLabel>
  <div className="flex rounded-md border border-input overflow-hidden">
    <span className="bg-muted px-3 flex items-center text-sm text-muted-foreground border-r border-input">
      https://
    </span>
    <Input className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="example.com" />
  </div>
</Field>

{/* Currency prefix + suffix */}
<Field>
  <FieldLabel>Currency</FieldLabel>
  <div className="flex rounded-md border border-input overflow-hidden">
    <span className="bg-muted px-3 flex items-center text-sm text-muted-foreground border-r border-input">$</span>
    <Input className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0" placeholder="0.00" />
    <span className="bg-muted px-3 flex items-center text-sm text-muted-foreground border-l border-input">.00</span>
  </div>
</Field>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>URL</FieldLabel>
              <div className="border-input flex overflow-hidden rounded-md border">
                <span className="border-input bg-muted text-muted-foreground flex items-center border-r px-3 text-sm">
                  https://
                </span>
                <Input
                  className="rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="example.com"
                />
              </div>
            </Field>
            <Field>
              <FieldLabel>Currency</FieldLabel>
              <div className="border-input flex overflow-hidden rounded-md border">
                <span className="border-input bg-muted text-muted-foreground flex items-center border-r px-3 text-sm">
                  $
                </span>
                <Input
                  className="rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="0.00"
                />
                <span className="border-input bg-muted text-muted-foreground flex items-center border-l px-3 text-sm">
                  .00
                </span>
              </div>
            </Field>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Clearable input"
          code={`function ClearableInputExample() {
  const [value, setValue] = useState("")
  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type to search..."
        className="pr-8"
      />
      {value && (
        <X
          className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={() => setValue("")}
        />
      )}
    </div>
  )
}`}
        >
          <div className="max-w-sm">
            <ClearableInputExample />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Password visibility toggle"
          code={`function PasswordInputExample() {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        defaultValue="supersecret123"
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword((p) => !p)}
        className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  )
}`}
        >
          <div className="max-w-sm">
            <PasswordInputExample />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Character count textarea"
          code={`function CharCountTextareaExample() {
  const [value, setValue] = useState("Lorem ipsum...")
  const countColor =
    value.length > 270 ? "text-destructive"
    : value.length > 240 ? "text-amber-500"
    : "text-muted-foreground"
  return (
    <div className="space-y-1">
      <Textarea maxLength={280} value={value} onChange={(e) => setValue(e.target.value)} rows={4} />
      <p className={\`text-right text-xs \${countColor}\`}>{value.length} / 280</p>
    </div>
  )
}`}
        >
          <div className="max-w-sm">
            <CharCountTextareaExample />
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
