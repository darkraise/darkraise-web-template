import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "darkraise-ui/components/toggle-group"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/toggle-group")(
  {
    component: ToggleGroupPage,
  },
)

function ToggleGroupPage() {
  const [align, setAlign] = useState("left")
  const [formatting, setFormatting] = useState<string[]>([])

  return (
    <ShowcasePage
      title="Toggle Group"
      description={`A row of toggle buttons that share state. \`type="single"\` enforces one active item, \`type="multiple"\` allows any combination.`}
    >
      <ShowcaseExample
        title="Single — only one item active"
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
        title="Multiple — any combination active"
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
    </ShowcasePage>
  )
}
