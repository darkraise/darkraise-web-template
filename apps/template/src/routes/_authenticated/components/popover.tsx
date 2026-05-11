import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { Input } from "darkraise-ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/popover")({
  component: PopoverPage,
})

function PopoverPage() {
  return (
    <ShowcasePage
      title="Popover"
      description="Anchored floating panel for short forms, secondary actions, and contextual content. Closes on outside click and Escape by default."
    >
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
