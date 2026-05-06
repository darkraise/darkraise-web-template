import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
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
} from "darkraise-ui/components/combobox"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/combobox")({
  component: ComboboxPage,
})

const COUNTRIES: ComboboxItemData[] = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "mx", label: "Mexico" },
  { value: "br", label: "Brazil" },
  { value: "uk", label: "United Kingdom" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
  { value: "nz", label: "New Zealand" },
]

const LANGUAGES: ComboboxItemData[] = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rs", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "kt", label: "Kotlin" },
  { value: "swift", label: "Swift" },
]

interface UserItem extends ComboboxItemData {
  role: string
}

const USERS: UserItem[] = [
  { value: "alex", label: "Alex Carter", role: "Designer" },
  { value: "blair", label: "Blair Howe", role: "Engineer" },
  { value: "casey", label: "Casey Lin", role: "Product Manager" },
  { value: "drew", label: "Drew Patel", role: "Engineer" },
  { value: "eve", label: "Eve Romero", role: "Researcher" },
]

function CountryPicker() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = useMemo(
    () =>
      COUNTRIES.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
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
  )
}

function AsyncPicker() {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<ComboboxItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!query) {
      setItems([])
      return
    }
    setLoading(true)
    const id = setTimeout(() => {
      if (cancelled) return
      const next = LANGUAGES.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase()),
      )
      setItems(next)
      setLoading(false)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [query])

  return (
    <Combobox
      items={items}
      inputValue={query}
      onInputValueChange={(d) => setQuery(d.value)}
      value={selected}
      onValueChange={(d) => setSelected(d.value[0] ?? null)}
      placeholder="Type to search languages..."
    >
      <ComboboxLabel>Language (async)</ComboboxLabel>
      <ComboboxControl>
        <ComboboxInput />
        <ComboboxTrigger>
          <ChevronDown className="h-3.5 w-3.5" />
        </ComboboxTrigger>
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxList>
          {items.map((item) => (
            <ComboboxItem key={item.value} item={item}>
              <ComboboxItemText>{item.label}</ComboboxItemText>
              <ComboboxItemIndicator>
                <Check className="h-4 w-4" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>
          {loading ? "Loading..." : query ? "No matches." : "Start typing."}
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

function MultiSelectChips() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const filtered = useMemo(
    () =>
      LANGUAGES.filter((it) =>
        it.label.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  const removeChip = (value: string) =>
    setSelected((prev) => prev.filter((v) => v !== value))

  return (
    <div className="flex flex-col gap-3">
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
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-xs">None selected</span>
        ) : (
          selected.map((value) => {
            const item = LANGUAGES.find((l) => l.value === value)
            return (
              <span
                key={value}
                className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs"
              >
                {item?.label}
                <button
                  type="button"
                  onClick={() => removeChip(value)}
                  aria-label={`Remove ${item?.label}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

function CustomItemRendering() {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = useMemo(
    () =>
      USERS.filter((u) => u.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  return (
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
  )
}

function ComboboxPage() {
  return (
    <ShowcasePage
      title="Combobox"
      description="A searchable input paired with a listbox dropdown. Consumer drives filtering, supports keyboard navigation, async loading, and multi-select."
    >
      <ShowcaseExample
        title="Country picker with filtering"
        code={`<Combobox
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
    <ComboboxClearTrigger><X className="h-3.5 w-3.5" /></ComboboxClearTrigger>
    <ComboboxTrigger><ChevronDown className="h-3.5 w-3.5" /></ComboboxTrigger>
  </ComboboxControl>
  <ComboboxContent>
    <ComboboxList>
      {filtered.map((item) => (
        <ComboboxItem key={item.value} item={item}>
          <ComboboxItemText>{item.label}</ComboboxItemText>
          <ComboboxItemIndicator><Check className="h-4 w-4" /></ComboboxItemIndicator>
        </ComboboxItem>
      ))}
    </ComboboxList>
    <ComboboxEmpty>No countries match.</ComboboxEmpty>
  </ComboboxContent>
</Combobox>`}
      >
        <CountryPicker />
      </ShowcaseExample>

      <ShowcaseExample
        title="Async-loading items with debounce"
        code={`useEffect(() => {
  const id = setTimeout(() => setItems(filterRemote(query)), 250)
  return () => clearTimeout(id)
}, [query])

<Combobox items={items} inputValue={query} onInputValueChange={(d) => setQuery(d.value)}>
  ...
  <ComboboxEmpty>{loading ? "Loading..." : "No matches."}</ComboboxEmpty>
</Combobox>`}
      >
        <AsyncPicker />
      </ShowcaseExample>

      <ShowcaseExample
        title="Multi-select with chip readout"
        code={`<Combobox multiple value={selected} onValueChange={(d) => setSelected(d.value)} ...>
  <ComboboxLabel>Languages</ComboboxLabel>
  <ComboboxControl>
    <ComboboxInput />
    <ComboboxTrigger><ChevronDown className="h-3.5 w-3.5" /></ComboboxTrigger>
  </ComboboxControl>
  <ComboboxContent>
    <ComboboxList>
      {filtered.map((item) => (
        <ComboboxItem key={item.value} item={item}>
          <ComboboxItemText>{item.label}</ComboboxItemText>
          <ComboboxItemIndicator><Check className="h-4 w-4" /></ComboboxItemIndicator>
        </ComboboxItem>
      ))}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
      >
        <MultiSelectChips />
      </ShowcaseExample>

      <ShowcaseExample
        title="Custom item rendering"
        code={`<ComboboxItem item={user}>
  <div className="flex flex-col">
    <ComboboxItemText>{user.label}</ComboboxItemText>
    <span className="text-muted-foreground text-xs">{user.role}</span>
  </div>
  <ComboboxItemIndicator><Check className="h-4 w-4" /></ComboboxItemIndicator>
</ComboboxItem>`}
      >
        <CustomItemRendering />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
