import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { X } from "lucide-react"

import {
  TagsInput,
  TagsInputControl,
  TagsInputHiddenInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDeleteTrigger,
  TagsInputItemInput,
  TagsInputItemPreview,
  TagsInputItemText,
  TagsInputLabel,
} from "./TagsInput"

const meta: Meta<typeof TagsInput> = {
  title: "UI/TagsInput",
  component: TagsInput,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof TagsInput>

function renderTags(tags: string[]) {
  return tags.map((tag, index) => (
    <TagsInputItem key={`${tag}-${index}`} index={index} value={tag}>
      <TagsInputItemPreview>
        <TagsInputItemText>{tag}</TagsInputItemText>
        <TagsInputItemDeleteTrigger>
          <X className="h-3 w-3" />
        </TagsInputItemDeleteTrigger>
      </TagsInputItemPreview>
      <TagsInputItemInput />
    </TagsInputItem>
  ))
}

export const Default: Story = {
  render: () => {
    const [tags, setTags] = React.useState<string[]>(["react", "typescript"])
    return (
      <div className="w-96">
        <TagsInput value={tags} onValueChange={(d) => setTags(d.value)}>
          <TagsInputLabel>Frameworks</TagsInputLabel>
          <TagsInputControl>
            {renderTags(tags)}
            <TagsInputInput placeholder="Add framework..." />
          </TagsInputControl>
          <TagsInputHiddenInput />
        </TagsInput>
      </div>
    )
  },
}

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

export const EmailValidation: Story = {
  render: () => {
    const [tags, setTags] = React.useState<string[]>([])
    return (
      <div className="w-96">
        <TagsInput
          value={tags}
          onValueChange={(d) => setTags(d.value)}
          validate={isEmail}
        >
          <TagsInputLabel>Recipients</TagsInputLabel>
          <TagsInputControl>
            {renderTags(tags)}
            <TagsInputInput placeholder="Add email..." />
          </TagsInputControl>
        </TagsInput>
      </div>
    )
  },
}

export const PasteSplit: Story = {
  render: () => {
    const [tags, setTags] = React.useState<string[]>([])
    return (
      <div className="w-96">
        <TagsInput
          value={tags}
          onValueChange={(d) => setTags(d.value)}
          pasteSplit
        >
          <TagsInputLabel>Tags (paste comma-separated)</TagsInputLabel>
          <TagsInputControl>
            {renderTags(tags)}
            <TagsInputInput placeholder="Paste a,b,c..." />
          </TagsInputControl>
        </TagsInput>
      </div>
    )
  },
}

export const MaxItems: Story = {
  render: () => {
    const [tags, setTags] = React.useState<string[]>([])
    return (
      <div className="w-96">
        <TagsInput
          value={tags}
          onValueChange={(d) => setTags(d.value)}
          maxItems={3}
        >
          <TagsInputLabel>Up to 3 tags</TagsInputLabel>
          <TagsInputControl>
            {renderTags(tags)}
            <TagsInputInput placeholder="Add tag..." />
          </TagsInputControl>
        </TagsInput>
      </div>
    )
  },
}
