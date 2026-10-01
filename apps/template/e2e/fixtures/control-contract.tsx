import { createRoot } from "react-dom/client"
import { ChevronDown } from "lucide-react"
import { Button, type ButtonVariant } from "darkraise-ui/components/button"
import { Calendar } from "darkraise-ui/components/calendar"
import { Card, CardContent } from "darkraise-ui/components/card"
import {
  Combobox,
  ComboboxControl,
  ComboboxInput,
  ComboboxTrigger,
} from "darkraise-ui/components/combobox"
import { DateInput } from "darkraise-ui/components/date-input"
import { Input } from "darkraise-ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "darkraise-ui/components/input-otp"
import { MultiSelect } from "darkraise-ui/components/multi-select"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputTriggerGroup,
} from "darkraise-ui/components/number-input"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "darkraise-ui/components/segment-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import { Switch } from "darkraise-ui/components/switch"
import { Toggle } from "darkraise-ui/components/toggle"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const VARIANTS: ButtonVariant[] = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
]

const ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
]

// Every control sits in a `data-probe` wrapper so the spec can find it
// without relying on props each component may not forward.
function Controls() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
      <div data-probe="buttons" style={{ display: "flex", gap: 8 }}>
        {VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div data-probe="toggles" style={{ display: "flex", gap: 8 }}>
        <Toggle aria-label="Bold">B</Toggle>
        <Toggle variant="outline" aria-label="Italic">
          I
        </Toggle>
      </div>
      <div data-probe="input" style={{ width: 200 }}>
        <Input aria-label="Name" placeholder="Name" />
      </div>
      <div data-probe="select" style={{ width: 160 }}>
        <Select>
          <SelectTrigger aria-label="Fruit">
            <SelectValue placeholder="Fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div data-probe="combobox" style={{ width: 200 }}>
        <Combobox items={ITEMS} placeholder="Search">
          <ComboboxControl>
            <ComboboxInput aria-label="Search" />
            <ComboboxTrigger>
              <ChevronDown className="h-3.5 w-3.5" />
            </ComboboxTrigger>
          </ComboboxControl>
        </Combobox>
      </div>
      <div data-probe="multi-select" style={{ width: 240 }}>
        <MultiSelect items={ITEMS} defaultValue={["apple"]} placeholder="Pick" />
      </div>
      <div data-probe="date-input">
        <DateInput aria-label="Date" />
      </div>
      <div data-probe="number-input" style={{ width: 160 }}>
        <NumberInput defaultValue="1">
          <NumberInputControl>
            <NumberInputField aria-label="Quantity" />
            <NumberInputTriggerGroup>
              <NumberInputIncrementTrigger />
              <NumberInputDecrementTrigger />
            </NumberInputTriggerGroup>
          </NumberInputControl>
        </NumberInput>
      </div>
      <div data-probe="otp">
        <InputOTP maxLength={3} aria-label="Code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div data-probe="segment">
        <SegmentGroup defaultValue="day" aria-label="Range">
          <SegmentGroupIndicator />
          <SegmentGroupItem value="day">Day</SegmentGroupItem>
          <SegmentGroupItem value="week">Week</SegmentGroupItem>
        </SegmentGroup>
      </div>
      <div data-probe="switch">
        <Switch aria-label="Notifications" />
      </div>
      <div data-probe="calendar">
        <Calendar mode="single" />
      </div>
    </div>
  )
}

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div style={{ padding: 24 }}>
      <div
        data-testid="control-height"
        style={{ height: "var(--control-height)", width: 1 }}
      />
      <div
        data-testid="control-height-xl"
        style={{ height: "var(--control-height-xl)", width: 1 }}
      />
      <Controls />
      <div data-probe="edge-page" style={{ width: 200, marginTop: 24, paddingBottom: 12 }}>
        <Input aria-label="On page" placeholder="On page" />
      </div>
      <Card style={{ width: 280, marginTop: 24 }}>
        <CardContent>
          <div data-probe="edge-card" style={{ paddingBottom: 12 }}>
            <Input aria-label="On card" placeholder="On card" />
          </div>
        </CardContent>
      </Card>
    </div>
  </ThemeProvider>,
)
