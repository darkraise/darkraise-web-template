import type { Meta, StoryObj } from "@storybook/react-vite"
import { Check, Pencil, X } from "lucide-react"
import * as React from "react"
import {
  Editable,
  EditableArea,
  EditableCancelTrigger,
  EditableControl,
  EditableEditTrigger,
  EditableInput,
  EditableLabel,
  EditablePreview,
  EditableSubmitTrigger,
} from "./Editable"

const meta: Meta<typeof Editable> = {
  title: "UI/Editable",
  component: Editable,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Editable>

export const Default: Story = {
  render: () => (
    <Editable defaultValue="Hello world" placeholder="Click to edit">
      <EditableLabel>Name</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit">
          <Pencil />
        </EditableEditTrigger>
      </EditableControl>
    </Editable>
  ),
}

export const SubmitOnBlur: Story = {
  render: () => (
    <Editable defaultValue="Click outside to save" submitOnBlur>
      <EditableLabel>Title</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
    </Editable>
  ),
}

export const ExplicitSaveCancel: Story = {
  render: () => {
    const [value, setValue] = React.useState("Hopper")
    return (
      <Editable
        value={value}
        onValueCommit={(d) => setValue(d.value)}
        submitOnBlur={false}
      >
        <EditableLabel>Username</EditableLabel>
        <EditableArea>
          <EditableInput />
          <EditablePreview />
        </EditableArea>
        <EditableControl>
          <EditableEditTrigger aria-label="Edit">
            <Pencil />
          </EditableEditTrigger>
          <EditableSubmitTrigger aria-label="Save">
            <Check />
          </EditableSubmitTrigger>
          <EditableCancelTrigger aria-label="Cancel">
            <X />
          </EditableCancelTrigger>
        </EditableControl>
      </Editable>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <Editable defaultValue="Read only value" disabled>
      <EditableLabel>Locked field</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
    </Editable>
  ),
}
