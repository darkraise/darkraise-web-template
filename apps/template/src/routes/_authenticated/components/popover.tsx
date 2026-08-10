import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import type { PopoverSide, PopoverAlign } from "darkraise-ui/components/popover"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/popover")({
  component: PopoverPage,
})

const POPOVER_SIDES = allOf<PopoverSide>()("top", "right", "bottom", "left")

const POPOVER_ALIGNS = allOf<PopoverAlign>()("start", "center", "end")

function PopoverPage() {
  return (
    <ShowcasePage
      title="Popover"
      description="Anchored floating panel for short forms, secondary actions, and contextual content. Closes on outside click and Escape by default."
    >
      <ShowcaseExample
        title="Side x align"
        code={`// One representative cell: every side x align combination renders above.
// Each cell is a live Popover; click its trigger to see that placement.
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">right/end</Button>
  </PopoverTrigger>
  <PopoverContent side="right" align="end" className="w-48">
    side=right align=end
  </PopoverContent>
</Popover>`}
      >
        <VariantMatrix
          rows={{ label: "side", values: POPOVER_SIDES }}
          cols={{ label: "align", values: POPOVER_ALIGNS }}
          render={(side, align) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {side}/{align}
                </Button>
              </PopoverTrigger>
              <PopoverContent side={side} align={align} className="w-48">
                <p className="text-sm">
                  side={side} align={align}
                </p>
              </PopoverContent>
            </Popover>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Basic"
        code={`<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-64">
    <p className="text-sm font-medium">Popover Title</p>
    <p className="text-xs text-muted-foreground">
      Popovers float anchored to their trigger element.
    </p>
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open Popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <p className="text-sm font-medium">Popover Title</p>
              <p className="text-muted-foreground text-xs">
                Popovers appear anchored to their trigger and float above page
                content.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </ShowcaseExample>

      <ShowcaseExample
        title="With inline form"
        code={`<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Quick edit</Button>
  </PopoverTrigger>
  <PopoverContent className="w-72">
    <div className="space-y-3">
      <p className="text-sm font-medium">Quick Update</p>
      <Field>
        <FieldLabel htmlFor="pop-name">Name</FieldLabel>
        <Input id="pop-name" placeholder="Enter name..." />
      </Field>
      <Button size="sm" className="w-full">Save</Button>
    </div>
  </PopoverContent>
</Popover>`}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Quick edit</Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-3">
              <p className="text-sm font-medium">Quick Update</p>
              <Field>
                <FieldLabel htmlFor="popover-name">Name</FieldLabel>
                <Input id="popover-name" placeholder="Enter name..." />
              </Field>
              <Button size="sm" className="w-full">
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
