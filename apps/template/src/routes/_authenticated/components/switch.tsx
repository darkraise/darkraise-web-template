import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Label } from "darkraise-ui/components/label"
import { Switch } from "darkraise-ui/components/switch"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/switch")({
  component: SwitchPage,
})

function SwitchPage() {
  const [enabled, setEnabled] = useState(false)

  return (
    <ShowcasePage
      title="Switch"
      description="Two-state toggle for immediate, reversible settings — preferred over a Checkbox when the change applies on flip rather than on form submission."
    >
      <ShowcaseExample
        title="States"
        code={`const [enabled, setEnabled] = useState(false)

<Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
<Label htmlFor="notifications">Enable notifications</Label>

<Switch id="default-on" defaultChecked />
<Label htmlFor="default-on">Enabled by default</Label>

<Switch id="disabled-sw" disabled />
<Label htmlFor="disabled-sw">Disabled</Label>`}
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <Switch
              id="switch-notifications"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="switch-notifications">Enable notifications</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="switch-default-on" defaultChecked />
            <Label htmlFor="switch-default-on">Enabled by default</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="switch-disabled" disabled />
            <Label htmlFor="switch-disabled" className="opacity-50">
              Disabled
            </Label>
          </div>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
