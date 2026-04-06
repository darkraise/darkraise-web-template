import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/core/components/ui/collapsible"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/collapsible")({
  component: CollapsiblePage,
})

function CollapsiblePage() {
  const [basicOpen, setBasicOpen] = useState(false)
  const [iconOpen, setIconOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)

  return (
    <ShowcasePage
      title="Collapsible"
      description="An interactive component that shows or hides content on demand."
    >
      <ShowcaseExample
        title="Basic collapsible"
        code={`const [open, setOpen] = useState(false)

<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="outline">{open ? "Hide" : "Show"} details</Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2">
    <p className="text-sm text-muted-foreground">
      This content is revealed when the trigger is activated.
    </p>
  </CollapsibleContent>
</Collapsible>`}
      >
        <Collapsible open={basicOpen} onOpenChange={setBasicOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline">
              {basicOpen ? "Hide" : "Show"} details
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <p className="text-muted-foreground text-sm">
              This content is revealed when the trigger is activated. Use
              Collapsible for optional details, advanced settings, or anything
              that benefits from progressive disclosure.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </ShowcaseExample>

      <ShowcaseExample
        title="Collapsible with rotating chevron icon"
        code={`const [open, setOpen] = useState(false)

<Collapsible open={open} onOpenChange={setOpen}>
  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
    <ChevronsUpDown className="h-4 w-4" />
    Advanced settings
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2 space-y-1 pl-6">
    <p className="text-sm text-muted-foreground">Option A</p>
    <p className="text-sm text-muted-foreground">Option B</p>
  </CollapsibleContent>
</Collapsible>`}
      >
        <Collapsible open={iconOpen} onOpenChange={setIconOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${iconOpen ? "rotate-180" : ""}`}
            />
            Advanced settings
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1 pl-6">
            <p className="text-muted-foreground text-sm">
              Enable experimental features
            </p>
            <p className="text-muted-foreground text-sm">
              Override rate limits
            </p>
            <p className="text-muted-foreground text-sm">
              Verbose debug logging
            </p>
          </CollapsibleContent>
        </Collapsible>
      </ShowcaseExample>

      <ShowcaseExample
        title='"Show more" list pattern'
        code={`const [open, setOpen] = useState(false)

<div className="space-y-1">
  <p className="text-sm">Item 1 (always visible)</p>
  <Collapsible open={open} onOpenChange={setOpen}>
    <CollapsibleContent className="space-y-1">
      <p className="text-sm">Item 2</p>
      <p className="text-sm">Item 3</p>
      <p className="text-sm">Item 4</p>
    </CollapsibleContent>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" size="sm" className="mt-1 h-auto p-0 text-xs">
        {open ? "Show less" : "+ 3 more items"}
      </Button>
    </CollapsibleTrigger>
  </Collapsible>
</div>`}
      >
        <div className="space-y-1">
          <p className="text-sm">Dashboard</p>
          <Collapsible open={listOpen} onOpenChange={setListOpen}>
            <CollapsibleContent className="space-y-1">
              <p className="text-sm">Analytics</p>
              <p className="text-sm">Reports</p>
              <p className="text-sm">Exports</p>
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-0 text-xs"
              >
                {listOpen ? "Show less" : "+ 3 more items"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
