import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { AtSign, Eye, EyeOff, Search, X } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import { Input } from "darkraise-ui/components/input"
import { Textarea } from "darkraise-ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import { Checkbox } from "darkraise-ui/components/checkbox"
import { Switch } from "darkraise-ui/components/switch"
import { Label } from "darkraise-ui/components/label"
import { RadioGroup, RadioGroupItem } from "darkraise-ui/components/radio-group"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/inputs")({
  component: InputsPage,
})

function ClearableInputExample() {
  const [value, setValue] = useState("")
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type to search…"
      prefix={<Search className="h-4 w-4" />}
      trailingAction={
        value ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear"
            onClick={() => setValue("")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null
      }
    />
  )
}

function PasswordInputExample() {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Input
      type={showPassword ? "text" : "password"}
      defaultValue="supersecret123"
      trailingAction={
        <Button
          variant="ghost"
          size="icon"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((p) => !p)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      }
    />
  )
}

function ClearableTextareaExample() {
  const [value, setValue] = useState("This textarea has a clear button.")
  return (
    <Textarea
      rows={4}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type something…"
      trailingAction={
        value ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear"
            onClick={() => setValue("")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null
      }
    />
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
        ? "text-warning"
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
    <ShowcasePage
      title="Inputs"
      description="Form control primitives: text input, textarea, select, checkbox, switch, and radio group."
    >
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
            <Input id="demo-disabled" placeholder="Cannot be edited" disabled />
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
                  <Label htmlFor={`demo-radio-dis-${v}`} className="opacity-50">
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
        title="Prefix / suffix"
        code={`{/* String addons — render in a muted slot with a divider. */}
<Field>
  <FieldLabel>URL</FieldLabel>
  <Input prefix="https://" placeholder="example.com" />
</Field>

<Field>
  <FieldLabel>Price</FieldLabel>
  <Input prefix="$" suffix=".00" placeholder="0.00" inputMode="decimal" />
</Field>

{/* ReactNode addons — pass an icon or any JSX. */}
<Field>
  <FieldLabel>Search</FieldLabel>
  <Input prefix={<Search className="h-4 w-4" />} placeholder="Search…" />
</Field>

<Field>
  <FieldLabel>Email</FieldLabel>
  <Input prefix={<AtSign className="h-4 w-4" />} suffix="@acme.com" placeholder="jane.doe" />
</Field>`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>URL</FieldLabel>
            <Input prefix="https://" placeholder="example.com" />
          </Field>
          <Field>
            <FieldLabel>Price</FieldLabel>
            <Input
              prefix="$"
              suffix=".00"
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>
          <Field>
            <FieldLabel>Search</FieldLabel>
            <Input
              prefix={<Search className="h-4 w-4" />}
              placeholder="Search…"
            />
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              prefix={<AtSign className="h-4 w-4" />}
              suffix="@acme.com"
              placeholder="jane.doe"
            />
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Clearable input (trailingAction)"
        code={`function ClearableInputExample() {
  const [value, setValue] = useState("")
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type to search…"
      prefix={<Search className="h-4 w-4" />}
      trailingAction={
        value ? (
          <Button variant="ghost" size="icon" aria-label="Clear" onClick={() => setValue("")}>
            <X className="h-4 w-4" />
          </Button>
        ) : null
      }
    />
  )
}`}
      >
        <div className="max-w-sm">
          <ClearableInputExample />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Password visibility toggle (trailingAction)"
        code={`function PasswordInputExample() {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <Input
      type={showPassword ? "text" : "password"}
      defaultValue="supersecret123"
      trailingAction={
        <Button
          variant="ghost"
          size="icon"
          aria-label={showPassword ? "Hide password" : "Show password"}
          onClick={() => setShowPassword((p) => !p)}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      }
    />
  )
}`}
      >
        <div className="max-w-sm">
          <PasswordInputExample />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Clearable textarea (trailingAction)"
        code={`function ClearableTextareaExample() {
  const [value, setValue] = useState("…")
  return (
    <Textarea
      rows={4}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type something…"
      trailingAction={
        value ? (
          <Button variant="ghost" size="icon" aria-label="Clear" onClick={() => setValue("")}>
            <X className="h-4 w-4" />
          </Button>
        ) : null
      }
    />
  )
}`}
      >
        <div className="max-w-sm">
          <ClearableTextareaExample />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Character count textarea"
        code={`function CharCountTextareaExample() {
  const [value, setValue] = useState("Lorem ipsum...")
  const countColor =
    value.length > 270 ? "text-destructive"
    : value.length > 240 ? "text-warning"
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
    </ShowcasePage>
  )
}
