import { useMemo, useState } from "react"
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
import { Card, CardContent } from "darkraise-ui/components/card"
import { Label } from "darkraise-ui/components/label"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputLabel,
  NumberInputTriggerGroup,
} from "darkraise-ui/components/number-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import { Slider } from "darkraise-ui/components/slider"
import { FormSection } from "darkraise-ui/forms"

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "pt", label: "Portuguese" },
]

// Mirrors the app's real nav destinations (see the `nav` export in
// _authenticated.tsx) so the picker points at pages that actually exist.
const LANDING_PAGE_OPTIONS: ComboboxItemData[] = [
  { value: "/", label: "Dashboard" },
  { value: "/analytics", label: "Analytics" },
  { value: "/products", label: "Products" },
  { value: "/categories", label: "Categories" },
  { value: "/orders", label: "Orders" },
  { value: "/customers", label: "Customers" },
  { value: "/inbox", label: "Inbox" },
]

export function PreferencesSection() {
  const [language, setLanguage] = useState("en")
  const [landingQuery, setLandingQuery] = useState("")
  const [landingPage, setLandingPage] = useState<string | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [autosaveInterval, setAutosaveInterval] = useState([5])

  const filteredPages = useMemo(
    () =>
      LANDING_PAGE_OPTIONS.filter((page) =>
        page.label.toLowerCase().includes(landingQuery.toLowerCase()),
      ),
    [landingQuery],
  )

  return (
    <FormSection
      title="Preferences"
      description="Personal defaults for this dashboard, separate from the store configuration above."
    >
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preferences-language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="preferences-language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Combobox
              items={filteredPages}
              inputValue={landingQuery}
              onInputValueChange={(d) => setLandingQuery(d.value)}
              value={landingPage}
              onValueChange={(d) => setLandingPage(d.value[0] ?? null)}
              placeholder="Search pages..."
            >
              <ComboboxLabel>Default landing page</ComboboxLabel>
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
                  {filteredPages.map((page) => (
                    <ComboboxItem key={page.value} item={page}>
                      <ComboboxItemText>{page.label}</ComboboxItemText>
                      <ComboboxItemIndicator>
                        <Check className="h-4 w-4" />
                      </ComboboxItemIndicator>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
                <ComboboxEmpty>No pages match.</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="max-w-[200px] space-y-1.5">
            <NumberInput
              value={itemsPerPage}
              onValueChange={(d) => setItemsPerPage(d.valueAsNumber)}
              min={10}
              max={100}
              step={5}
              precision={0}
            >
              <NumberInputLabel>Items per page</NumberInputLabel>
              <NumberInputControl>
                <NumberInputField />
                <NumberInputTriggerGroup>
                  <NumberInputIncrementTrigger />
                  <NumberInputDecrementTrigger />
                </NumberInputTriggerGroup>
              </NumberInputControl>
            </NumberInput>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Autosave interval</span>
              <span className="text-muted-foreground text-sm">
                Every {autosaveInterval[0]} min
              </span>
            </div>
            <Slider
              aria-label="Autosave interval"
              value={autosaveInterval}
              onValueChange={setAutosaveInterval}
              min={1}
              max={30}
              step={1}
              className="w-full max-w-sm"
            />
          </div>
        </CardContent>
      </Card>
    </FormSection>
  )
}
