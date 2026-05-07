import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"

import { Button } from "@components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/collapsible"

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Collapsible>

export const Basic: Story = {
  render: () => (
    <Collapsible className="w-72 space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline">Toggle details</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded border p-3 text-sm">
        <p>Hidden content revealed on demand.</p>
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Collapsible disabled className="w-72 space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" disabled>
          Disabled
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded border p-3 text-sm">
        Cannot open.
      </CollapsibleContent>
    </Collapsible>
  ),
}

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false)
      return (
        <Collapsible
          open={open}
          onOpenChange={setOpen}
          className="w-72 space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline">{open ? "Hide" : "Show"}</Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded border p-3 text-sm">
            Controlled content.
          </CollapsibleContent>
        </Collapsible>
      )
    }
    return <Demo />
  },
}
