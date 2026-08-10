import { createFileRoute } from "@tanstack/react-router"
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "darkraise-ui/components/field"
import type {
  FieldLegendVariant,
  FieldOrientation,
} from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"
import { Textarea } from "darkraise-ui/components/textarea"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/field")({
  component: FieldPage,
})

const FIELD_LEGEND_VARIANTS = allOf<FieldLegendVariant>()("legend", "label")

const FIELD_ORIENTATIONS = allOf<FieldOrientation>()(
  "vertical",
  "horizontal",
  "responsive",
)

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
        title="Legend variant"
        code={`// One representative cell: every variant renders above.
<FieldSet>
  <FieldLegend variant="label">Notification preferences</FieldLegend>
  <Field>
    <FieldLabel htmlFor="email-notifs">Email</FieldLabel>
    <Input id="email-notifs" type="email" placeholder="you@example.com" />
  </Field>
</FieldSet>`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: FIELD_LEGEND_VARIANTS }}
          render={(variant) => (
            <FieldSet>
              <FieldLegend variant={variant}>
                Notification preferences
              </FieldLegend>
              <Field>
                <FieldLabel htmlFor={`legend-${variant}-email`}>
                  Email
                </FieldLabel>
                <Input
                  id={`legend-${variant}-email`}
                  type="email"
                  placeholder="you@example.com"
                />
              </Field>
            </FieldSet>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Orientation"
        code={`// One representative cell: every orientation renders above.
// "responsive" is vertical until the field's container is wide enough.
<Field orientation="horizontal">
  <FieldLabel htmlFor="plan">Plan</FieldLabel>
  <Input id="plan" defaultValue="Pro" />
</Field>`}
      >
        <VariantMatrix
          rows={{ label: "orientation", values: FIELD_ORIENTATIONS }}
          render={(orientation) => (
            <Field orientation={orientation} className="max-w-sm">
              <FieldLabel htmlFor={`orientation-${orientation}-plan`}>
                Plan
              </FieldLabel>
              <Input
                id={`orientation-${orientation}-plan`}
                defaultValue="Pro"
              />
            </Field>
          )}
        />
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
