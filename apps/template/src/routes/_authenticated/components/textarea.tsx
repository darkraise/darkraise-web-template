import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { X } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Textarea } from "darkraise-ui/components/textarea"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/textarea")({
  component: TextareaPage,
})

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

function TextareaPage() {
  return (
    <ShowcasePage
      title="Textarea"
      description="Multi-line text input. Supports a trailingAction slot for adornments like a clear button, character count, or send action."
    >
      <ShowcaseExample
        title="Basic"
        code={`<Field>
  <FieldLabel htmlFor="bio">Bio</FieldLabel>
  <Textarea id="bio" placeholder="Tell us about yourself..." rows={3} />
</Field>

<Field>
  <FieldLabel htmlFor="disabled-ta">Disabled</FieldLabel>
  <Textarea id="disabled-ta" placeholder="Disabled" disabled rows={3} />
</Field>`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="textarea-bio">Bio</FieldLabel>
            <Textarea
              id="textarea-bio"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="textarea-disabled">Disabled</FieldLabel>
            <Textarea
              id="textarea-disabled"
              placeholder="Disabled"
              disabled
              rows={3}
            />
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Clearable (trailingAction)"
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
        title="Character count"
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
