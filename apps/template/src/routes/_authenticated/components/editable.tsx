import { createFileRoute } from "@tanstack/react-router"
import { Check, Pencil, X } from "lucide-react"
import { useEffect, useState, type Ref } from "react"
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
  useEditableContext,
} from "darkraise-ui/components/editable"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputTriggerGroup,
} from "darkraise-ui/components/number-input"
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

// ── Custom-slot helpers shared by the generic-T demos below. ────────────────
//
// `Editable<T>` is value-type agnostic. The bundled `EditableInput` is
// specialised for `T = string`. For other value types you write a small slot
// component that reads `useEditableContext<T>()` and wires the editor of your
// choice — a textarea, a number input, a tags input, a custom widget — to the
// shared submit / cancel / blur / focus contract.
//
// Each slot below renders only while `state === "edit"` and forwards:
//   • inputRef          → so Editable focuses the editor on edit-enter
//   • setDraft          → updates the draft (typed as T)
//   • Enter / Escape    → submit / cancel via `submitOnEnter` / `cancelOnEscape`
//   • blur              → submit via `submitOnBlur`, gated by `cancelledRef`
//
// The cancelledRef gate ensures clicking the explicit Cancel button doesn't
// race with input blur to commit the abandoned draft.

function TextareaSlot({ rows = 4 }: { rows?: number }) {
  const {
    state,
    draft,
    placeholder,
    setDraft,
    submit,
    cancel,
    inputRef,
    fieldId,
    submitOnBlur,
    submitOnEnter,
    cancelOnEscape,
    cancelledRef,
    disabled,
    readOnly,
    maxLength,
  } = useEditableContext<string>("TextareaSlot")
  if (state !== "edit") return null
  return (
    <textarea
      ref={inputRef as Ref<HTMLTextAreaElement>}
      id={fieldId}
      className="dr-input dr-editable-input min-h-[6rem] w-full resize-y"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      rows={rows}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        // Cmd/Ctrl+Enter submits — plain Enter inserts a newline so the
        // textarea behaves naturally for multi-line text.
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && submitOnEnter) {
          e.preventDefault()
          submit()
        } else if (e.key === "Escape" && cancelOnEscape) {
          e.preventDefault()
          cancel()
        }
      }}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false
          return
        }
        if (submitOnBlur) submit()
      }}
    />
  )
}

function NumberSlot({
  step = 1,
  min,
  max,
}: {
  step?: number
  min?: number
  max?: number
}) {
  const {
    state,
    draft,
    setDraft,
    submit,
    cancel,
    inputRef,
    fieldId,
    submitOnEnter,
    cancelOnEscape,
    disabled,
    readOnly,
  } = useEditableContext<number>("NumberSlot")
  if (state !== "edit") return null
  return (
    <NumberInput
      value={draft}
      onValueChange={(d) =>
        setDraft(Number.isFinite(d.valueAsNumber) ? d.valueAsNumber : 0)
      }
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
      className="w-36"
    >
      <NumberInputControl>
        <NumberInputField
          ref={inputRef as Ref<HTMLInputElement>}
          id={fieldId}
          onKeyDown={(e) => {
            // Run our submit/cancel before NumberInput's own Enter→commit so
            // we capture the up-to-date draft (already synced via
            // onValueChange on every keystroke) without racing the commit.
            if (e.key === "Enter" && submitOnEnter) {
              e.preventDefault()
              submit()
            } else if (e.key === "Escape" && cancelOnEscape) {
              e.preventDefault()
              cancel()
            }
          }}
        />
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
      </NumberInputControl>
    </NumberInput>
  )
}

function TagsSlot() {
  const {
    state,
    draft,
    setDraft,
    submit,
    cancel,
    inputRef,
    fieldId,
    submitOnBlur,
    submitOnEnter,
    cancelOnEscape,
    cancelledRef,
    disabled,
    readOnly,
  } = useEditableContext<string[]>("TagsSlot")
  // Local string mirror of the draft array so the user can type commas and
  // spaces freely; we serialize on every keystroke and the array view is
  // recomputed by the parent `Editable` only at submit time.
  const [text, setText] = useState(() => draft.join(", "))
  useEffect(() => {
    if (state === "edit") setText(draft.join(", "))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
  if (state !== "edit") return null
  return (
    <input
      ref={inputRef as Ref<HTMLInputElement>}
      id={fieldId}
      type="text"
      className="dr-input dr-editable-input w-full"
      value={text}
      placeholder="tag1, tag2, tag3"
      disabled={disabled}
      readOnly={readOnly}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        setDraft(
          next
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && submitOnEnter) {
          e.preventDefault()
          submit()
        } else if (e.key === "Escape" && cancelOnEscape) {
          e.preventDefault()
          cancel()
        }
      }}
      onBlur={() => {
        if (cancelledRef.current) {
          cancelledRef.current = false
          return
        }
        if (submitOnBlur) submit()
      }}
    />
  )
}

function MultilineDescriptionExample() {
  const [bio, setBio] = useState(
    "Senior engineer passionate about distributed systems and design.",
  )
  return (
    <Editable
      value={bio}
      onValueCommit={(d) => setBio(d.value)}
      placeholder="Tell us about yourself"
      submitOnBlur={false}
    >
      <EditableLabel>Bio (Cmd/Ctrl+Enter to save)</EditableLabel>
      <EditableArea className="block w-full">
        <TextareaSlot rows={4} />
        <EditablePreview className="block w-full whitespace-pre-wrap">
          {bio}
        </EditablePreview>
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit bio">
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
}

function NumericCountExample() {
  const [count, setCount] = useState<number>(42)
  return (
    <Editable
      value={count}
      onValueCommit={(d: { value: number }) => setCount(d.value)}
      submitOnBlur={false}
    >
      <EditableLabel>Item count</EditableLabel>
      <EditableArea>
        <NumberSlot step={1} min={0} max={9999} />
        <EditablePreview>{`${count.toLocaleString()} items`}</EditablePreview>
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit count">
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
}

function TagsExample() {
  const [tags, setTags] = useState<string[]>([
    "react",
    "typescript",
    "tailwind",
  ])
  return (
    <Editable
      value={tags}
      onValueCommit={(d: { value: string[] }) => setTags(d.value)}
      submitOnBlur={false}
    >
      <EditableLabel>Skills</EditableLabel>
      <EditableArea className="block w-full">
        <TagsSlot />
        <EditablePreview className="flex w-full flex-wrap items-center gap-1.5">
          {tags.length === 0 ? (
            <span className="text-muted-foreground">No skills listed</span>
          ) : (
            tags.map((tag) => (
              <span
                key={tag}
                className="bg-muted text-foreground inline-flex items-center rounded-md px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))
          )}
        </EditablePreview>
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit skills">
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
}

function EditablePage() {
  return (
    <ShowcasePage
      title="Editable"
      description="Click-to-edit text with separate preview and edit states. Generic over the value type — wire it to a textarea, number input, tags array, or any custom widget via a slot that consumes useEditableContext()."
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
        title="Multi-line bio (custom <textarea> slot)"
        code={`// Editable<T> defaults to T = string. Build a slot that reads
// useEditableContext<string>() and renders a <textarea>. Wire setDraft,
// inputRef, and the submit / cancel / blur contract to match the
// EditableInput pattern. Cmd/Ctrl+Enter submits so plain Enter inserts
// a newline.

function TextareaSlot() {
  const {
    state, draft, placeholder, setDraft, submit, cancel,
    inputRef, fieldId, submitOnBlur, submitOnEnter, cancelOnEscape,
    cancelledRef, disabled, readOnly, maxLength,
  } = useEditableContext<string>("TextareaSlot")
  if (state !== "edit") return null
  return (
    <textarea
      ref={inputRef as React.Ref<HTMLTextAreaElement>}
      id={fieldId}
      className="dr-input dr-editable-input min-h-[6rem] w-full"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      maxLength={maxLength}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && submitOnEnter) {
          e.preventDefault(); submit()
        } else if (e.key === "Escape" && cancelOnEscape) {
          e.preventDefault(); cancel()
        }
      }}
      onBlur={() => {
        if (cancelledRef.current) { cancelledRef.current = false; return }
        if (submitOnBlur) submit()
      }}
    />
  )
}

<Editable value={bio} onValueCommit={(d) => setBio(d.value)}>
  <EditableArea>
    <TextareaSlot />
    <EditablePreview>{bio}</EditablePreview>
  </EditableArea>
  ...
</Editable>`}
      >
        <MultilineDescriptionExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Numeric count (Editable<number> + NumberInput)"
        code={`// Editable<number> wired to the in-house NumberInput compound for
// stepper buttons, min/max clamping, formatted display, and arrow-key
// support. NumberInput's onValueChange fires on every keystroke, so the
// Editable draft stays in sync. We override Enter / Escape on the field
// to drive Editable.submit / Editable.cancel; NumberInput's own
// Enter→commit is intentionally short-circuited.

function NumberSlot({ step = 1, min, max }: { step?: number; min?: number; max?: number }) {
  const {
    state, draft, setDraft, submit, cancel, inputRef, fieldId,
    submitOnEnter, cancelOnEscape, disabled, readOnly,
  } = useEditableContext<number>("NumberSlot")
  if (state !== "edit") return null
  return (
    <NumberInput
      value={draft}
      onValueChange={(d) => setDraft(Number.isFinite(d.valueAsNumber) ? d.valueAsNumber : 0)}
      step={step} min={min} max={max}
      disabled={disabled} readOnly={readOnly}
      className="w-36"
    >
      <NumberInputControl>
        <NumberInputField
          ref={inputRef as Ref<HTMLInputElement>}
          id={fieldId}
          onKeyDown={(e) => {
            if (e.key === "Enter" && submitOnEnter) { e.preventDefault(); submit() }
            else if (e.key === "Escape" && cancelOnEscape) { e.preventDefault(); cancel() }
          }}
        />
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
      </NumberInputControl>
    </NumberInput>
  )
}

const [count, setCount] = useState<number>(42)

<Editable value={count} onValueCommit={(d) => setCount(d.value)} submitOnBlur={false}>
  <EditableArea>
    <NumberSlot step={1} min={0} max={9999} />
    <EditablePreview>{\`\${count.toLocaleString()} items\`}</EditablePreview>
  </EditableArea>
  ...
</Editable>`}
      >
        <NumericCountExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Skills (Editable<string[]> with chip preview)"
        code={`// Editable<string[]>: the draft is the parsed array, but the input
// itself is a comma-separated text field — local string state mirrors
// the draft so the user can type commas + spaces freely. EditablePreview
// renders chip elements for each tag through the children slot.

function TagsSlot() {
  const {
    state, draft, setDraft, submit, cancel, inputRef, fieldId,
    submitOnBlur, submitOnEnter, cancelOnEscape, cancelledRef,
  } = useEditableContext<string[]>("TagsSlot")
  const [text, setText] = useState(() => draft.join(", "))
  React.useEffect(() => {
    if (state === "edit") setText(draft.join(", "))
  }, [state])
  if (state !== "edit") return null
  return (
    <input
      ref={inputRef as React.Ref<HTMLInputElement>}
      id={fieldId}
      type="text"
      className="dr-input dr-editable-input w-full"
      value={text}
      placeholder="tag1, tag2, tag3"
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        setDraft(next.split(",").map((s) => s.trim()).filter(Boolean))
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && submitOnEnter) { e.preventDefault(); submit() }
        else if (e.key === "Escape" && cancelOnEscape) { e.preventDefault(); cancel() }
      }}
      onBlur={() => {
        if (cancelledRef.current) { cancelledRef.current = false; return }
        if (submitOnBlur) submit()
      }}
    />
  )
}

const [tags, setTags] = useState<string[]>(["react", "typescript", "tailwind"])

<Editable value={tags} onValueCommit={(d) => setTags(d.value)}>
  <EditableArea>
    <TagsSlot />
    <EditablePreview>
      {tags.map((tag) => (
        <span key={tag} className="bg-muted rounded-md px-2 py-0.5 text-xs">
          {tag}
        </span>
      ))}
    </EditablePreview>
  </EditableArea>
  ...
</Editable>`}
      >
        <TagsExample />
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
