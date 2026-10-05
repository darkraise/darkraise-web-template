import { createRoot } from "react-dom/client"
import type { ColumnDef } from "@tanstack/react-table"
import { Check, ChevronDown } from "lucide-react"
import { Badge } from "darkraise-ui/components/badge"
import { AngleSlider } from "darkraise-ui/components/angle-slider"
import { Button, type ButtonVariant } from "darkraise-ui/components/button"
import { Calendar } from "darkraise-ui/components/calendar"
import { Card, CardContent } from "darkraise-ui/components/card"
import { Checkbox } from "darkraise-ui/components/checkbox"
import {
  ColorPicker,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerSwatchItem,
} from "darkraise-ui/components/color-picker"
import {
  CascadeSelect,
  type CascadeOption,
} from "darkraise-ui/components/cascade-select"
import {
  Combobox,
  ComboboxControl,
  ComboboxInput,
  ComboboxTrigger,
} from "darkraise-ui/components/combobox"
import { DateInput } from "darkraise-ui/components/date-input"
import {
  FileUpload,
  FileUploadTrigger,
} from "darkraise-ui/components/file-upload"
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
import { Slider } from "darkraise-ui/components/slider"
import { Switch } from "darkraise-ui/components/switch"
import {
  TagsInput,
  TagsInputControl,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemPreview,
  TagsInputItemText,
} from "darkraise-ui/components/tags-input"
import { TimePicker } from "darkraise-ui/components/time-picker"
import { Toggle } from "darkraise-ui/components/toggle"
import { ColumnHeader, DataTable } from "darkraise-ui/data-table"
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

const REGIONS: CascadeOption[] = [
  {
    value: "us",
    label: "United States",
    children: [{ value: "ny", label: "New York" }],
  },
]

interface Invoice {
  name: string
  total: number
}

const INVOICES: Invoice[] = [
  { name: "Acme", total: 1200 },
  { name: "Globex", total: 85.5 },
  { name: "Initech", total: 4 },
]

// Name is sortable (a ghost button in the header); Total is a plain,
// end-aligned header, the reference the sortable one must match.
const INVOICE_COLUMNS: ColumnDef<Invoice>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
  },
  { accessorKey: "total", header: "Total", meta: { align: "end" } },
]

// Every control sits in a `data-probe` wrapper so the spec can find it
// without relying on props each component may not forward.
function Controls() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
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
        <MultiSelect
          items={ITEMS}
          defaultValue={["apple"]}
          placeholder="Pick"
        />
      </div>
      <div data-probe="date-input">
        <DateInput aria-label="Date" />
      </div>
      <div data-probe="number-input" style={{ width: 160 }}>
        <NumberInput defaultValue={1}>
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
      <div data-probe="otp-invalid">
        <InputOTP maxLength={3} aria-invalid aria-label="Invalid code">
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

// Probes for control states. They sit after the table so the edge probes
// above keep their positions on screen.
function ControlStates() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div data-probe="select-long" style={{ width: 160 }}>
        <Select defaultValue="long">
          <SelectTrigger aria-label="Long fruit">
            <SelectValue placeholder="Fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="long">
              Supercalifragilisticexpialidocious
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div data-probe="cascade">
        <CascadeSelect options={REGIONS} placeholder="Region" />
      </div>
      <div data-probe="time-picker">
        <TimePicker />
      </div>
      <div data-probe="time-picker-empty">
        <TimePicker value="" placeholder="Time" />
      </div>
      <div data-probe="input-group-invalid" style={{ width: 200 }}>
        <Input aria-label="Invalid amount" aria-invalid prefix="$" />
      </div>
      <div
        data-probe="input-group-disabled"
        style={{ width: 200, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <Input aria-label="Disabled amount" disabled prefix="$" />
        <Input aria-label="Disabled name" disabled />
      </div>
      <div data-probe="file-upload">
        <FileUpload>
          <FileUploadTrigger>Browse</FileUploadTrigger>
        </FileUpload>
      </div>
      <div data-probe="swatches" style={{ width: 200 }}>
        <ColorPicker defaultValue="#2563eb">
          <ColorPickerSwatchGroup>
            <ColorPickerSwatchItem value="#ffffff" />
            <ColorPickerSwatchItem value="#000000" />
            <ColorPickerSwatchItem value="#2563eb" />
          </ColorPickerSwatchGroup>
          <ColorPickerSwatch />
        </ColorPicker>
      </div>
      <div data-probe="angle">
        <AngleSlider defaultValue={45} aria-label="Angle" />
      </div>
      <div data-probe="slider-vertical" style={{ width: 40, height: 160 }}>
        <Slider
          orientation="vertical"
          defaultValue={[25, 75]}
          aria-label="Vertical range"
        />
      </div>
      <div data-probe="checkbox-states" style={{ display: "flex", gap: 8 }}>
        <Checkbox aria-label="Checked" defaultChecked />
        <Checkbox aria-label="Indeterminate" defaultChecked="indeterminate" />
      </div>
      <div data-probe="badge-icon">
        <Badge variant="secondary">
          <Check className="size-3" />
          Verified
        </Badge>
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
      <div
        data-probe="edge-page"
        style={{ width: 200, marginTop: 24, paddingBottom: 12 }}
      >
        <Input aria-label="On page" placeholder="On page" />
      </div>
      <Card style={{ width: 280, marginTop: 24 }}>
        <CardContent>
          <div data-probe="edge-card" style={{ paddingBottom: 12 }}>
            <Input aria-label="On card" placeholder="On card" />
          </div>
          <div
            data-probe="chips-card"
            style={{ display: "grid", gap: 8, paddingBottom: 12 }}
          >
            <MultiSelect items={ITEMS} defaultValue={["apple"]} />
            <TagsInput defaultValue={["react"]}>
              <TagsInputControl>
                <TagsInputItem index={0} value="react">
                  <TagsInputItemPreview>
                    <TagsInputItemText>react</TagsInputItemText>
                  </TagsInputItemPreview>
                </TagsInputItem>
                <TagsInputInput aria-label="Tags" />
              </TagsInputControl>
            </TagsInput>
          </div>
        </CardContent>
      </Card>
      <div data-probe="table" style={{ width: 360, marginTop: 24 }}>
        <DataTable columns={INVOICE_COLUMNS} data={INVOICES} />
      </div>
      <div style={{ marginTop: 24 }}>
        <ControlStates />
      </div>
    </div>
  </ThemeProvider>,
)
