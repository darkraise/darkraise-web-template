import { createFileRoute } from "@tanstack/react-router"
import { Check, Pencil, X } from "lucide-react"
import { useState } from "react"
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
} from "darkraise-ui/components/editable"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/editable")({
  component: EditablePage,
})

function InlineRenameExample() {
  const [title, setTitle] = useState("Untitled document")
  return (
    <Editable
      value={title}
      onValueCommit={(d) => setTitle(d.value)}
      placeholder="Document title"
    >
      <EditableLabel>Document title</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Rename document">
          <Pencil />
        </EditableEditTrigger>
      </EditableControl>
    </Editable>
  )
}

function SubmitOnBlurExample() {
  const [value, setValue] = useState("Click outside to save")
  return (
    <Editable
      value={value}
      onValueCommit={(d) => setValue(d.value)}
      submitOnBlur
    >
      <EditableLabel>Inline note</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
    </Editable>
  )
}

function ExplicitSaveCancelExample() {
  const [name, setName] = useState("Grace Hopper")
  return (
    <Editable
      value={name}
      onValueCommit={(d) => setName(d.value)}
      submitOnBlur={false}
    >
      <EditableLabel>Display name</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit name">
          <Pencil />
        </EditableEditTrigger>
        <EditableSubmitTrigger aria-label="Save name">
          <Check />
        </EditableSubmitTrigger>
        <EditableCancelTrigger aria-label="Cancel edit">
          <X />
        </EditableCancelTrigger>
      </EditableControl>
    </Editable>
  )
}

function EditablePage() {
  return (
    <ShowcasePage
      title="Editable"
      description="Click-to-edit text with separate preview and edit states. Supports submit-on-blur, explicit save / cancel actions, and a controlled edit-mode prop."
    >
      <ShowcaseExample
        title="Inline title rename"
        code={`const [title, setTitle] = useState("Untitled document")

<Editable
  value={title}
  onValueCommit={(d) => setTitle(d.value)}
  placeholder="Document title"
>
  <EditableLabel>Document title</EditableLabel>
  <EditableArea>
    <EditableInput />
    <EditablePreview />
  </EditableArea>
  <EditableControl>
    <EditableEditTrigger aria-label="Rename document">
      <Pencil />
    </EditableEditTrigger>
  </EditableControl>
</Editable>`}
      >
        <InlineRenameExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Submit on blur"
        code={`<Editable
  value={value}
  onValueCommit={(d) => setValue(d.value)}
  submitOnBlur
>
  <EditableLabel>Inline note</EditableLabel>
  <EditableArea>
    <EditableInput />
    <EditablePreview />
  </EditableArea>
</Editable>`}
      >
        <SubmitOnBlurExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Explicit save and cancel"
        code={`<Editable
  value={name}
  onValueCommit={(d) => setName(d.value)}
  submitOnBlur={false}
>
  <EditableLabel>Display name</EditableLabel>
  <EditableArea>
    <EditableInput />
    <EditablePreview />
  </EditableArea>
  <EditableControl>
    <EditableEditTrigger aria-label="Edit name"><Pencil /></EditableEditTrigger>
    <EditableSubmitTrigger aria-label="Save name"><Check /></EditableSubmitTrigger>
    <EditableCancelTrigger aria-label="Cancel edit"><X /></EditableCancelTrigger>
  </EditableControl>
</Editable>`}
      >
        <ExplicitSaveCancelExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
