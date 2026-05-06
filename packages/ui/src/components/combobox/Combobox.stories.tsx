import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import {
  Combobox,
  ComboboxClearTrigger,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
  type ComboboxItemData,
} from "./Combobox"

const meta: Meta<typeof Combobox> = {
  title: "UI/Combobox",
  component: Combobox,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Combobox>

const COUNTRIES: ComboboxItemData[] = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "br", label: "Brazil" },
  { value: "uk", label: "United Kingdom" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
]

function useFiltered(items: ComboboxItemData[], query: string) {
  return React.useMemo(
    () =>
      items.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  )
}

export const Default: Story = {
  render: () => {
    const [query, setQuery] = React.useState("")
    const [selected, setSelected] = React.useState<string | null>(null)
    const filtered = useFiltered(COUNTRIES, query)

    return (
      <div className="w-80">
        <Combobox
          items={filtered}
          inputValue={query}
          onInputValueChange={(d) => setQuery(d.value)}
          value={selected}
          onValueChange={(d) => setSelected(d.value[0] ?? null)}
          placeholder="Search a country..."
        >
          <ComboboxLabel>Country</ComboboxLabel>
          <ComboboxControl>
            <ComboboxInput />
            <ComboboxClearTrigger>
              <X className="h-3.5 w-3.5" />
            </ComboboxClearTrigger>
            <ComboboxTrigger>
              <ChevronDown className="h-3.5 w-3.5" />
            </ComboboxTrigger>
          </ComboboxControl>
          <ComboboxContent>
            <ComboboxList>
              {filtered.map((item) => (
                <ComboboxItem key={item.value} item={item}>
                  <ComboboxItemText>{item.label}</ComboboxItemText>
                  <ComboboxItemIndicator>
                    <Check className="h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              ))}
            </ComboboxList>
            <ComboboxEmpty>No countries match.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  },
}

const LANGUAGES: ComboboxItemData[] = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rs", label: "Rust" },
  { value: "java", label: "Java" },
]

export const Multiple: Story = {
  render: () => {
    const [query, setQuery] = React.useState("")
    const [selected, setSelected] = React.useState<string[]>([])
    const filtered = useFiltered(LANGUAGES, query)

    return (
      <div className="w-80 space-y-3">
        <Combobox
          items={filtered}
          inputValue={query}
          onInputValueChange={(d) => setQuery(d.value)}
          value={selected}
          onValueChange={(d) => setSelected(d.value)}
          multiple
          placeholder="Pick languages..."
        >
          <ComboboxLabel>Languages</ComboboxLabel>
          <ComboboxControl>
            <ComboboxInput />
            <ComboboxTrigger>
              <ChevronDown className="h-3.5 w-3.5" />
            </ComboboxTrigger>
          </ComboboxControl>
          <ComboboxContent>
            <ComboboxList>
              {filtered.map((item) => (
                <ComboboxItem key={item.value} item={item}>
                  <ComboboxItemText>{item.label}</ComboboxItemText>
                  <ComboboxItemIndicator>
                    <Check className="h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              ))}
            </ComboboxList>
            <ComboboxEmpty>No matches.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
        <div className="flex flex-wrap gap-1">
          {selected.map((value) => (
            <span
              key={value}
              className="bg-accent text-accent-foreground rounded-sm px-2 py-0.5 text-xs"
            >
              {LANGUAGES.find((l) => l.value === value)?.label}
            </span>
          ))}
        </div>
      </div>
    )
  },
}

interface User {
  value: string
  label: string
  role: string
}

const USERS: User[] = [
  { value: "alex", label: "Alex Carter", role: "Designer" },
  { value: "blair", label: "Blair Howe", role: "Engineer" },
  { value: "casey", label: "Casey Lin", role: "PM" },
  { value: "drew", label: "Drew Patel", role: "Engineer" },
]

export const CustomItem: Story = {
  render: () => {
    const [query, setQuery] = React.useState("")
    const [selected, setSelected] = React.useState<string | null>(null)
    const filtered = React.useMemo(
      () =>
        USERS.filter((u) =>
          u.label.toLowerCase().includes(query.toLowerCase()),
        ),
      [query],
    )

    return (
      <div className="w-80">
        <Combobox
          items={filtered}
          inputValue={query}
          onInputValueChange={(d) => setQuery(d.value)}
          value={selected}
          onValueChange={(d) => setSelected(d.value[0] ?? null)}
          placeholder="Assign to..."
        >
          <ComboboxLabel>Assignee</ComboboxLabel>
          <ComboboxControl>
            <ComboboxInput />
            <ComboboxTrigger>
              <ChevronDown className="h-3.5 w-3.5" />
            </ComboboxTrigger>
          </ComboboxControl>
          <ComboboxContent>
            <ComboboxList>
              {filtered.map((item) => (
                <ComboboxItem key={item.value} item={item}>
                  <div className="flex flex-col">
                    <ComboboxItemText>{item.label}</ComboboxItemText>
                    <span className="text-muted-foreground text-xs">
                      {item.role}
                    </span>
                  </div>
                  <ComboboxItemIndicator>
                    <Check className="h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              ))}
            </ComboboxList>
            <ComboboxEmpty>No users.</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  },
}
