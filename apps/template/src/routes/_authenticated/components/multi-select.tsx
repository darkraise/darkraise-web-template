import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import { MultiSelect } from "darkraise-ui/components/multi-select"
import type { MultiSelectItem } from "darkraise-ui/components/multi-select"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/multi-select")(
  {
    component: MultiSelectPage,
  },
)

const FRUITS: MultiSelectItem[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "blueberry", label: "Blueberry" },
  { value: "grape", label: "Grape" },
  { value: "mango", label: "Mango" },
  { value: "orange", label: "Orange" },
  { value: "pear", label: "Pear" },
  { value: "pineapple", label: "Pineapple" },
  { value: "strawberry", label: "Strawberry" },
  { value: "watermelon", label: "Watermelon" },
]

const TAGS: MultiSelectItem[] = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "design", label: "Design" },
  { value: "infra", label: "Infrastructure" },
  { value: "qa", label: "Quality Assurance" },
  { value: "docs", label: "Documentation" },
  { value: "deprecated", label: "Deprecated", disabled: true },
]

function MultiSelectPage() {
  const [selectedFruits, setSelectedFruits] = useState<string[]>([
    "apple",
    "mango",
  ])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  return (
    <ShowcasePage
      title="Multi Select"
      description="Combobox-based picker for choosing many items from a predefined catalog. Renders the picked items as removable chips inside the trigger and keeps the panel open across selections."
    >
      <ShowcaseExample
        title="Basic"
        code={`const FRUITS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  // …
]

const [selected, setSelected] = useState<string[]>([])

<MultiSelect
  items={FRUITS}
  value={selected}
  onValueChange={(details) => setSelected(details.value)}
  placeholder="Pick some fruit…"
/>`}
      >
        <div className="max-w-md">
          <Field>
            <FieldLabel>Favourite fruit</FieldLabel>
            <MultiSelect
              items={FRUITS}
              value={selectedFruits}
              onValueChange={(d) => setSelectedFruits(d.value)}
              placeholder="Pick some fruit…"
            />
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="With disabled item"
        code={`const TAGS = [
  { value: "frontend", label: "Frontend" },
  { value: "deprecated", label: "Deprecated", disabled: true },
  // …
]

<MultiSelect
  items={TAGS}
  value={selected}
  onValueChange={(details) => setSelected(details.value)}
  placeholder="Tag this issue…"
/>`}
      >
        <div className="max-w-md">
          <Field>
            <FieldLabel>Issue tags</FieldLabel>
            <MultiSelect
              items={TAGS}
              value={selectedTags}
              onValueChange={(d) => setSelectedTags(d.value)}
              placeholder="Tag this issue…"
            />
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled"
        code={`<MultiSelect
  items={FRUITS}
  defaultValue={["banana", "pear"]}
  disabled
/>`}
      >
        <div className="max-w-md">
          <MultiSelect
            items={FRUITS}
            defaultValue={["banana", "pear"]}
            disabled
          />
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
