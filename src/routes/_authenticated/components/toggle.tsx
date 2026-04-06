import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Toggle } from "@/core/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/core/components/ui/toggle-group"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/toggle")({
  component: TogglePage,
})

function TogglePage() {
  const [bold, setBold] = useState(false)
  const [align, setAlign] = useState("left")
  const [formatting, setFormatting] = useState<string[]>([])

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Toggle" },
        ]}
        title="Toggle & ToggleGroup"
        description="Stateful button primitives for single and multi-select toolbar interactions."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Single toggle"
          code={`const [bold, setBold] = useState(false)

<Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">
  <Bold className="h-4 w-4" />
  Bold
</Toggle>`}
        >
          <Toggle pressed={bold} onPressedChange={setBold} aria-label="Bold">
            <Bold className="h-4 w-4" />
            Bold
          </Toggle>
        </ShowcaseExample>

        <ShowcaseExample
          title="Toggle variants"
          code={`<Toggle variant="default" aria-label="Italic">
  <Italic className="h-4 w-4" />
  Default
</Toggle>
<Toggle variant="outline" aria-label="Underline">
  <Underline className="h-4 w-4" />
  Outline
</Toggle>`}
        >
          <div className="flex gap-3">
            <Toggle variant="default" aria-label="Italic">
              <Italic className="h-4 w-4" />
              Default
            </Toggle>
            <Toggle variant="outline" aria-label="Underline">
              <Underline className="h-4 w-4" />
              Outline
            </Toggle>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Toggle group (single) — only one item active at a time"
          code={`const [align, setAlign] = useState("left")

<ToggleGroup type="single" value={align} onValueChange={(v) => { if (v) setAlign(v) }}>
  <ToggleGroupItem value="left" aria-label="Align left">
    <AlignLeft className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="center" aria-label="Align center">
    <AlignCenter className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="right" aria-label="Align right">
    <AlignRight className="h-4 w-4" />
  </ToggleGroupItem>
</ToggleGroup>`}
        >
          <ToggleGroup
            type="single"
            value={align}
            onValueChange={(v) => {
              if (v) setAlign(v)
            }}
          >
            <ToggleGroupItem value="left" aria-label="Align left">
              <AlignLeft className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Align center">
              <AlignCenter className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Align right">
              <AlignRight className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </ShowcaseExample>

        <ShowcaseExample
          title="Toggle group (multiple) — any combination active"
          code={`const [formatting, setFormatting] = useState<string[]>([])

<ToggleGroup type="multiple" value={formatting} onValueChange={setFormatting}>
  <ToggleGroupItem value="bold" aria-label="Bold">
    <Bold className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Italic">
    <Italic className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Underline">
    <Underline className="h-4 w-4" />
  </ToggleGroupItem>
</ToggleGroup>`}
        >
          <ToggleGroup
            type="multiple"
            value={formatting}
            onValueChange={setFormatting}
          >
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </ShowcaseExample>
      </div>
    </div>
  )
}
