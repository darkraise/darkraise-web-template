import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "darkraise-ui/components/sheet"
import type { SheetSide } from "darkraise-ui/components/sheet"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/sheet")({
  component: SheetPage,
})

const SHEET_SIDES = allOf<SheetSide>()("top", "right", "bottom", "left")

function SheetPage() {
  return (
    <ShowcasePage
      title="Sheet"
      description="Edge-anchored modal panel — slides in from the left, right, top, or bottom. Use for contextual detail views, settings panels, and side forms."
    >
      <ShowcaseExample
        title="Sides"
        code={`// One representative cell: every side renders a trigger that opens a
// sheet from that edge.
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open</Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Left sheet</SheetTitle>
      <SheetDescription>Slides in from the left.</SheetDescription>
    </SheetHeader>
    <p className="mt-4 text-sm text-muted-foreground">Sheet content appears here.</p>
    <SheetFooter className="mt-4">
      <Button>Apply</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
      >
        <VariantMatrix
          rows={{ label: "side", values: SHEET_SIDES }}
          render={(side) => (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open</Button>
              </SheetTrigger>
              <SheetContent side={side}>
                <SheetHeader>
                  <SheetTitle className="capitalize">{side} sheet</SheetTitle>
                  <SheetDescription>
                    Slides in from the {side}.
                  </SheetDescription>
                </SheetHeader>
                <p className="text-muted-foreground mt-4 text-sm">
                  Sheet content appears here.
                </p>
                <SheetFooter className="mt-4">
                  <Button>Apply</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="With a form"
        code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit Profile</SheetTitle>
      <SheetDescription>Update your public profile information.</SheetDescription>
    </SheetHeader>
    <div className="space-y-4 py-4">
      <Field>
        <FieldLabel htmlFor="sp-name">Name</FieldLabel>
        <Input id="sp-name" defaultValue="Jane Doe" />
      </Field>
      <Field>
        <FieldLabel htmlFor="sp-email">Email</FieldLabel>
        <Input id="sp-email" type="email" defaultValue="jane@example.com" />
      </Field>
    </div>
    <SheetFooter>
      <SheetClose asChild>
        <Button variant="outline">Cancel</Button>
      </SheetClose>
      <Button>Save Changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Edit Profile</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Edit Profile</SheetTitle>
              <SheetDescription>
                Update your public profile information.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <Field>
                <FieldLabel htmlFor="sheet-name">Name</FieldLabel>
                <Input id="sheet-name" defaultValue="Jane Doe" />
              </Field>
              <Field>
                <FieldLabel htmlFor="sheet-email">Email</FieldLabel>
                <Input
                  id="sheet-email"
                  type="email"
                  defaultValue="jane@example.com"
                />
              </Field>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button>Save Changes</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
