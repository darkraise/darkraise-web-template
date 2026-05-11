import { createFileRoute } from "@tanstack/react-router"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"
import { Textarea } from "darkraise-ui/components/textarea"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/field")({
  component: FieldPage,
})

function FieldPage() {
  return (
    <ShowcasePage
      title="Field"
      description="Vertical label+control wrapper used as the layout primitive for form controls. Use FieldLabel for the visible label and place any Input, Textarea, Select, or custom control inside."
    >
      <ShowcaseExample
        title="Single field"
        code={`<Field>
  <FieldLabel htmlFor="email">Email</FieldLabel>
  <Input id="email" type="email" placeholder="you@example.com" />
</Field>`}
      >
        <Field>
          <FieldLabel htmlFor="single-email">Email</FieldLabel>
          <Input id="single-email" type="email" placeholder="you@example.com" />
        </Field>
      </ShowcaseExample>

      <ShowcaseExample
        title="Two-column grid"
        code={`<div className="grid gap-4 sm:grid-cols-2">
  <Field>
    <FieldLabel htmlFor="first">First name</FieldLabel>
    <Input id="first" defaultValue="Jane" />
  </Field>
  <Field>
    <FieldLabel htmlFor="last">Last name</FieldLabel>
    <Input id="last" defaultValue="Doe" />
  </Field>
  <Field>
    <FieldLabel htmlFor="bio">Bio</FieldLabel>
    <Textarea id="bio" rows={3} placeholder="Tell us about yourself..." />
  </Field>
</div>`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="grid-first">First name</FieldLabel>
            <Input id="grid-first" defaultValue="Jane" />
          </Field>
          <Field>
            <FieldLabel htmlFor="grid-last">Last name</FieldLabel>
            <Input id="grid-last" defaultValue="Doe" />
          </Field>
          <Field>
            <FieldLabel htmlFor="grid-bio">Bio</FieldLabel>
            <Textarea
              id="grid-bio"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </Field>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
