import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Field, FieldLabel } from "darkraise-ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/select")({
  component: SelectPage,
})

function SelectPage() {
  const [value, setValue] = useState("")

  return (
    <ShowcasePage
      title="Select"
      description="Native-feeling single-select dropdown with keyboard navigation and search-by-letter. Use Combobox or VirtualizedDropdownMenu when the option list is large or filterable."
    >
      <ShowcaseExample
        title="Single value"
        code={`const [value, setValue] = useState("")

<Field>
  <FieldLabel htmlFor="basic-select">Plan</FieldLabel>
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger id="basic-select">
      <SelectValue placeholder="Pick an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="alpha">Alpha</SelectItem>
      <SelectItem value="beta">Beta</SelectItem>
      <SelectItem value="gamma">Gamma</SelectItem>
    </SelectContent>
  </Select>
</Field>`}
      >
        <div className="max-w-xs">
          <Field>
            <FieldLabel htmlFor="basic-select">Plan</FieldLabel>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger id="basic-select">
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpha">Alpha</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="gamma">Gamma</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled"
        code={`<Field>
  <FieldLabel>Region</FieldLabel>
  <Select disabled>
    <SelectTrigger>
      <SelectValue placeholder="Disabled" />
    </SelectTrigger>
  </Select>
</Field>`}
      >
        <div className="max-w-xs">
          <Field>
            <FieldLabel>Region</FieldLabel>
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Disabled" />
              </SelectTrigger>
            </Select>
          </Field>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
