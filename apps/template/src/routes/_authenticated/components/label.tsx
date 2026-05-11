import { createFileRoute } from "@tanstack/react-router"
import { Checkbox } from "darkraise-ui/components/checkbox"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/label")({
  component: LabelPage,
})

function LabelPage() {
  return (
    <ShowcasePage
      title="Label"
      description="Accessible label primitive. Use htmlFor to associate it with a control by id so click and screen-reader focus both forward to the input."
    >
      <ShowcaseExample
        title="Paired with an input"
        code={`<div className="space-y-1.5">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>`}
      >
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="label-email">Email</Label>
          <Input id="label-email" type="email" placeholder="you@example.com" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Paired with a checkbox"
        code={`<div className="flex items-center gap-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`}
      >
        <div className="flex items-center gap-2">
          <Checkbox id="label-terms" />
          <Label htmlFor="label-terms">Accept terms and conditions</Label>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
