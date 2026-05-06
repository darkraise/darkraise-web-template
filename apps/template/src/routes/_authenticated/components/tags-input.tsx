import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { X } from "lucide-react"
import {
  TagsInput,
  TagsInputClearTrigger,
  TagsInputControl,
  TagsInputHiddenInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDeleteTrigger,
  TagsInputItemInput,
  TagsInputItemPreview,
  TagsInputItemText,
  TagsInputLabel,
} from "darkraise-ui/components/tags-input"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tags-input")({
  component: TagsInputPage,
})

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

function FreeFormTags() {
  const [tags, setTags] = useState<string[]>([
    "react",
    "typescript",
    "tailwind",
  ])
  return (
    <TagsInput value={tags} onValueChange={(d) => setTags(d.value)}>
      <TagsInputLabel>Frameworks</TagsInputLabel>
      <TagsInputControl>
        {renderTags(tags)}
        <TagsInputInput placeholder="Add framework..." />
      </TagsInputControl>
      <TagsInputClearTrigger className="text-muted-foreground hover:text-foreground self-start text-xs underline">
        Clear all
      </TagsInputClearTrigger>
      <TagsInputHiddenInput />
    </TagsInput>
  )
}

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)

function EmailWithValidation() {
  const [tags, setTags] = useState<string[]>(["alex@example.com"])
  return (
    <TagsInput
      value={tags}
      onValueChange={(d) => setTags(d.value)}
      validate={isEmail}
      name="recipients"
    >
      <TagsInputLabel>Recipients (email-only)</TagsInputLabel>
      <TagsInputControl>
        {renderTags(tags)}
        <TagsInputInput placeholder="Add email..." />
      </TagsInputControl>
      <TagsInputHiddenInput />
    </TagsInput>
  )
}

function PasteSplitDemo() {
  const [tags, setTags] = useState<string[]>([])
  return (
    <TagsInput
      value={tags}
      onValueChange={(d) => setTags(d.value)}
      pasteSplit
      delimiter={[",", ";", "Enter"]}
    >
      <TagsInputLabel>Tags (paste comma or semicolon list)</TagsInputLabel>
      <TagsInputControl>
        {renderTags(tags)}
        <TagsInputInput placeholder="Paste a,b,c..." />
      </TagsInputControl>
    </TagsInput>
  )
}

function MaxCountDemo() {
  const [tags, setTags] = useState<string[]>([])
  return (
    <TagsInput
      value={tags}
      onValueChange={(d) => setTags(d.value)}
      maxItems={3}
    >
      <TagsInputLabel>Skills (max 3)</TagsInputLabel>
      <TagsInputControl>
        {renderTags(tags)}
        <TagsInputInput placeholder="Add a skill..." />
      </TagsInputControl>
    </TagsInput>
  )
}

function TagsInputPage() {
  return (
    <ShowcasePage
      title="TagsInput"
      description="A chip-based input for entering multiple tagged values. Supports delimiters, validation, paste splitting, max-count, and form serialization."
    >
      <ShowcaseExample
        title="Free-form tags"
        code={`<TagsInput value={tags} onValueChange={(d) => setTags(d.value)}>
  <TagsInputLabel>Frameworks</TagsInputLabel>
  <TagsInputControl>
    {tags.map((tag, i) => (
      <TagsInputItem key={i} index={i} value={tag}>
        <TagsInputItemPreview>
          <TagsInputItemText>{tag}</TagsInputItemText>
          <TagsInputItemDeleteTrigger><X /></TagsInputItemDeleteTrigger>
        </TagsInputItemPreview>
        <TagsInputItemInput />
      </TagsInputItem>
    ))}
    <TagsInputInput placeholder="Add framework..." />
  </TagsInputControl>
</TagsInput>`}
      >
        <FreeFormTags />
      </ShowcaseExample>

      <ShowcaseExample
        title="Email-only with validation"
        code={`const isEmail = (s: string) => /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(s)

<TagsInput value={tags} onValueChange={(d) => setTags(d.value)} validate={isEmail} name="recipients">
  ...
  <TagsInputHiddenInput />
</TagsInput>`}
      >
        <EmailWithValidation />
      </ShowcaseExample>

      <ShowcaseExample
        title="Paste-split commas"
        code={`<TagsInput pasteSplit delimiter={[",", ";", "Enter"]} value={tags} onValueChange={(d) => setTags(d.value)}>
  ...
</TagsInput>`}
      >
        <PasteSplitDemo />
      </ShowcaseExample>

      <ShowcaseExample
        title="Max-count enforcement"
        code={`<TagsInput maxItems={3} value={tags} onValueChange={(d) => setTags(d.value)}>
  ...
</TagsInput>`}
      >
        <MaxCountDemo />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
