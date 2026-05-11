import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Fieldset, FieldsetLegend } from "darkraise-ui/components/fieldset"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import { Switch } from "darkraise-ui/components/switch"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/fieldset")({
  component: FieldsetPage,
})

function FieldsetToggleExample() {
  const [disabled, setDisabled] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Switch
          id="fs-disabled"
          checked={disabled}
          onCheckedChange={setDisabled}
        />
        <Label htmlFor="fs-disabled">Disable fieldset</Label>
      </div>
      <Fieldset disabled={disabled} className="max-w-sm">
        <FieldsetLegend>Account {disabled ? "(disabled)" : ""}</FieldsetLegend>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="fs-email">Email</Label>
            <Input id="fs-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fs-password">Password</Label>
            <Input id="fs-password" type="password" placeholder="••••••••" />
          </div>
        </div>
      </Fieldset>
    </div>
  )
}

function FieldsetPage() {
  return (
    <ShowcasePage
      title="Fieldset"
      description="Semantic <fieldset> wrapper with a styled legend. Setting disabled on the fieldset propagates to every nested form control via the native HTML behaviour."
    >
      <ShowcaseExample
        title="Toggle disabled propagation"
        code={`function FieldsetToggleExample() {
  const [disabled, setDisabled] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Switch id="fs-disabled" checked={disabled} onCheckedChange={setDisabled} />
        <Label htmlFor="fs-disabled">Disable fieldset</Label>
      </div>
      <Fieldset disabled={disabled} className="max-w-sm">
        <FieldsetLegend>Account {disabled ? "(disabled)" : ""}</FieldsetLegend>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="fs-email">Email</Label>
            <Input id="fs-email" type="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fs-password">Password</Label>
            <Input id="fs-password" type="password" placeholder="••••••••" />
          </div>
        </div>
      </Fieldset>
    </div>
  )
}`}
      >
        <FieldsetToggleExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
