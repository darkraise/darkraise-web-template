import { useState } from "react"
import { createRoot } from "react-dom/client"
import type { ColumnDef } from "@tanstack/react-table"
import { Check, ChevronDown, Info } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "darkraise-ui/components/accordion"
import {
  Alert,
  AlertTitle,
  type AlertVariant,
} from "darkraise-ui/components/alert"
import { Badge } from "darkraise-ui/components/badge"
import { Banner } from "darkraise-ui/components/banner"
import { AngleSlider } from "darkraise-ui/components/angle-slider"
import { Button, type ButtonVariant } from "darkraise-ui/components/button"
import { Calendar } from "darkraise-ui/components/calendar"
import { Card, CardContent } from "darkraise-ui/components/card"
import { Checkbox } from "darkraise-ui/components/checkbox"
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerControl,
  ColorPickerEyeDropperTrigger,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerSwatchGroup,
  ColorPickerSwatchItem,
  ColorPickerTrigger,
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
  DatePicker,
  DatePickerControl,
  DatePickerInput,
  DatePickerTrigger,
} from "darkraise-ui/components/date-picker"
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
} from "darkraise-ui/components/editable"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "darkraise-ui/components/field"
import { Fieldset, FieldsetLegend } from "darkraise-ui/components/fieldset"
import {
  FileUpload,
  FileUploadClearTrigger,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDeleteTrigger,
  FileUploadItemGroup,
  FileUploadItemName,
  FileUploadTrigger,
} from "darkraise-ui/components/file-upload"
import { Input } from "darkraise-ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "darkraise-ui/components/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "darkraise-ui/components/input-otp"
import { Kbd } from "darkraise-ui/components/kbd"
import { Listbox, ListboxItem } from "darkraise-ui/components/listbox"
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
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
  TagsInputClearTrigger,
  TagsInputControl,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDeleteTrigger,
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

const NOTE = new File(["notes"], "notes.txt", { type: "text/plain" })

// A disabled picker whose popover the test opens: its parts render in a
// portal, outside the faded root, and must fade on their own. Closed until
// asked, so it never covers another probe.
function PortalledPicker() {
  const [open, setOpen] = useState(false)
  return (
    <div data-case="color-picker-portal">
      <button type="button" onClick={() => setOpen(true)}>
        Open portalled picker
      </button>
      <ColorPicker defaultValue="#3b82f6" disabled open={open}>
        <ColorPickerControl>
          <ColorPickerSwatch />
          <ColorPickerTrigger>Pick</ColorPickerTrigger>
        </ColorPickerControl>
        <ColorPickerContent className="compound-portal">
          <ColorPickerArea />
          <ColorPickerSwatchGroup>
            <ColorPickerSwatchItem value="#ef4444" />
          </ColorPickerSwatchGroup>
          <ColorPickerEyeDropperTrigger aria-label="Pick from screen" />
        </ColorPickerContent>
      </ColorPicker>
    </div>
  )
}

const STATUS_VARIANTS: AlertVariant[] = [
  "default",
  "info",
  "success",
  "warning",
  "destructive",
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
      <div data-probe="alerts" style={{ width: 320, display: "grid", gap: 8 }}>
        {STATUS_VARIANTS.map((variant) => (
          <div key={variant} style={{ display: "grid", gap: 8 }}>
            <Alert variant={variant}>
              <Info />
              <AlertTitle>Alert</AlertTitle>
            </Alert>
            <Banner variant={variant} icon={<Info />}>
              Banner
            </Banner>
          </div>
        ))}
      </div>
      <div
        data-probe="kbd"
        style={{ display: "flex", gap: 8, alignItems: "center", padding: 4 }}
      >
        <Kbd size="sm">Ctrl</Kbd>
        <Kbd>K</Kbd>
        <Kbd size="lg">Esc</Kbd>
      </div>
      <div
        data-probe="disabled-states"
        style={{ display: "flex", flexDirection: "column", gap: 8, width: 240 }}
      >
        <div data-case="accordion">
          <Accordion type="single" collapsible>
            <AccordionItem value="locked" disabled>
              <AccordionTrigger>Locked section</AccordionTrigger>
              <AccordionContent>Hidden</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div data-case="date-input">
          <DateInput disabled aria-label="Disabled date" />
        </div>
        <div data-case="number-input">
          <NumberInput defaultValue={1} disabled>
            <NumberInputControl>
              <NumberInputField aria-label="Disabled quantity" />
              <NumberInputTriggerGroup>
                <NumberInputIncrementTrigger />
                <NumberInputDecrementTrigger />
              </NumberInputTriggerGroup>
            </NumberInputControl>
          </NumberInput>
        </div>
        <div data-case="editable-read-only">
          <Editable defaultValue="Read-only title" readOnly>
            <EditableArea>
              <EditablePreview />
              <EditableInput aria-label="Read-only title" />
            </EditableArea>
          </Editable>
        </div>
        <div data-case="editable-locked">
          <Editable defaultValue="Locked title" readOnly disabled>
            <EditableArea>
              <EditablePreview />
              <EditableInput aria-label="Locked title" />
            </EditableArea>
          </Editable>
        </div>
        <div data-case="resizable">
          <ResizablePanelGroup orientation="horizontal" style={{ height: 40 }}>
            <ResizablePanel defaultSize={50}>A</ResizablePanel>
            <ResizableHandle disabled />
            <ResizablePanel defaultSize={50}>B</ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <div data-case="select">
          <Select disabled>
            <SelectTrigger aria-label="Disabled fruit">
              <SelectValue placeholder="Fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div data-case="cascade">
          <CascadeSelect options={REGIONS} placeholder="Region" disabled />
        </div>
        <div data-case="time-picker">
          <TimePicker disabled />
        </div>
      </div>
      <div
        data-probe="compound-disabled"
        style={{ display: "flex", flexDirection: "column", gap: 8, width: 280 }}
      >
        <div data-case="color-picker">
          <ColorPicker defaultValue="#3b82f6" disabled>
            <ColorPickerControl>
              <ColorPickerSwatch />
              <ColorPickerInput aria-label="Disabled colour" />
              <ColorPickerTrigger>Pick</ColorPickerTrigger>
            </ColorPickerControl>
            <ColorPickerArea />
            <ColorPickerSwatchGroup>
              <ColorPickerSwatchItem value="#10b981" />
            </ColorPickerSwatchGroup>
            <ColorPickerEyeDropperTrigger aria-label="Pick from screen" />
          </ColorPicker>
        </div>
        <div data-case="color-picker-input-one">
          <ColorPicker defaultValue="#3b82f6">
            <ColorPickerControl>
              <ColorPickerSwatch />
              <ColorPickerInput disabled aria-label="Locked colour" />
            </ColorPickerControl>
          </ColorPicker>
        </div>
        <PortalledPicker />
        <div data-case="combobox">
          <Combobox items={ITEMS} disabled placeholder="Search">
            <ComboboxControl>
              <ComboboxInput aria-label="Disabled search" />
              <ComboboxTrigger>
                <ChevronDown className="h-3.5 w-3.5" />
              </ComboboxTrigger>
            </ComboboxControl>
          </Combobox>
        </div>
        <div data-case="combobox-input-one">
          <Combobox items={ITEMS} placeholder="Search">
            <ComboboxControl>
              <ComboboxInput disabled aria-label="Locked search" />
              <ComboboxTrigger>
                <ChevronDown className="h-3.5 w-3.5" />
              </ComboboxTrigger>
            </ComboboxControl>
          </Combobox>
        </div>
        <div data-case="multi-select">
          <MultiSelect items={ITEMS} defaultValue={["apple"]} disabled />
        </div>
        <div data-case="date-picker">
          <DatePicker disabled>
            <DatePickerControl>
              <DatePickerInput aria-label="Disabled due date" />
              <DatePickerTrigger>Pick</DatePickerTrigger>
            </DatePickerControl>
          </DatePicker>
        </div>
        <div data-case="date-picker-input-one">
          <DatePicker>
            <DatePickerControl>
              <DatePickerInput disabled aria-label="Locked due date" />
              <DatePickerTrigger>Pick</DatePickerTrigger>
            </DatePickerControl>
          </DatePicker>
        </div>
        <div data-case="file-upload">
          <FileUpload disabled defaultAcceptedFiles={[NOTE]}>
            <FileUploadDropzone>
              Drop files
              <FileUploadTrigger>Choose file</FileUploadTrigger>
            </FileUploadDropzone>
            <FileUploadItemGroup>
              <FileUploadItem file={NOTE}>
                <FileUploadItemName />
                <FileUploadItemDeleteTrigger>×</FileUploadItemDeleteTrigger>
              </FileUploadItem>
            </FileUploadItemGroup>
            <FileUploadClearTrigger>Clear</FileUploadClearTrigger>
          </FileUpload>
        </div>
        <div data-case="file-upload-one">
          <FileUpload>
            <FileUploadDropzone>
              Drop files
              <FileUploadTrigger disabled>Choose file</FileUploadTrigger>
            </FileUploadDropzone>
          </FileUpload>
        </div>
        <div data-case="segment">
          <SegmentGroup defaultValue="day" disabled aria-label="Disabled range">
            <SegmentGroupIndicator />
            <SegmentGroupItem value="day">Day</SegmentGroupItem>
            <SegmentGroupItem value="week">Week</SegmentGroupItem>
          </SegmentGroup>
        </div>
        <div data-case="segment-one">
          <SegmentGroup defaultValue="day" aria-label="Range with one disabled">
            <SegmentGroupIndicator />
            <SegmentGroupItem value="day">Day</SegmentGroupItem>
            <SegmentGroupItem value="week" disabled>
              Week
            </SegmentGroupItem>
          </SegmentGroup>
        </div>
        <div data-case="tags">
          <TagsInput defaultValue={["react"]} disabled>
            <TagsInputControl>
              <TagsInputItem index={0} value="react">
                <TagsInputItemPreview>
                  <TagsInputItemText>react</TagsInputItemText>
                  <TagsInputItemDeleteTrigger>×</TagsInputItemDeleteTrigger>
                </TagsInputItemPreview>
              </TagsInputItem>
              <TagsInputInput aria-label="Disabled tags" />
            </TagsInputControl>
          </TagsInput>
        </div>
        <div data-case="tags-one">
          <TagsInput defaultValue={["react"]}>
            <TagsInputControl>
              <TagsInputItem index={0} value="react" disabled>
                <TagsInputItemPreview>
                  <TagsInputItemText>react</TagsInputItemText>
                  <TagsInputItemDeleteTrigger>×</TagsInputItemDeleteTrigger>
                </TagsInputItemPreview>
              </TagsInputItem>
              <TagsInputInput aria-label="Tags with one disabled" />
            </TagsInputControl>
          </TagsInput>
        </div>
        <div data-case="tags-read-only">
          <TagsInput defaultValue={["react"]} readOnly>
            <TagsInputControl>
              <TagsInputItem index={0} value="react">
                <TagsInputItemPreview>
                  <TagsInputItemText>react</TagsInputItemText>
                </TagsInputItemPreview>
              </TagsInputItem>
              <TagsInputInput aria-label="Read-only tags" />
              <TagsInputClearTrigger>×</TagsInputClearTrigger>
            </TagsInputControl>
          </TagsInput>
        </div>
        <div data-case="otp">
          <InputOTP
            maxLength={3}
            variant="separate"
            disabled
            aria-label="Disabled code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <div data-case="fieldset">
          <Fieldset disabled>
            <FieldsetLegend>Shipping</FieldsetLegend>
            <Input aria-label="Fieldset name" />
            <Button>Save</Button>
            <Combobox items={ITEMS} disabled placeholder="Search">
              <ComboboxControl>
                <ComboboxInput aria-label="Fieldset search" />
              </ComboboxControl>
            </Combobox>
          </Fieldset>
        </div>
        <div data-case="field">
          <Field data-disabled="true">
            <FieldLabel htmlFor="compound-field-name">Name</FieldLabel>
            <Input id="compound-field-name" disabled />
          </Field>
        </div>
        <div data-case="field-choice">
          <Field data-disabled="true">
            <FieldLabel>
              <Checkbox disabled aria-label="Accept terms" />
              <FieldContent>
                <FieldTitle>Accept terms</FieldTitle>
              </FieldContent>
            </FieldLabel>
          </Field>
        </div>
        <div data-case="listbox">
          <Listbox disabled aria-label="Disabled fruit">
            <ListboxItem value="apple">Apple</ListboxItem>
            <ListboxItem value="banana" disabled>
              Banana
            </ListboxItem>
          </Listbox>
        </div>
        <div data-case="listbox-one">
          <Listbox aria-label="Fruit with one disabled">
            <ListboxItem value="apple">Apple</ListboxItem>
            <ListboxItem value="banana" disabled>
              Banana
            </ListboxItem>
          </Listbox>
        </div>
      </div>
      <div data-probe="button-as-child" style={{ display: "flex", gap: 8 }}>
        <Button asChild disabled>
          <a href="#docs">Docs</a>
        </Button>
        <Button asChild disabled variant="link">
          <a href="#more">More</a>
        </Button>
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
      {(["low", "medium", "high"] as const).map((level) => (
        <Card
          key={level}
          elevation={level}
          style={{ width: 280, marginTop: 24 }}
        >
          <CardContent>
            <div
              data-probe={`edge-card-${level}`}
              style={{ paddingBottom: 12 }}
            >
              <Input
                aria-label={`On a ${level} card`}
                placeholder={`On a ${level} card`}
              />
            </div>
          </CardContent>
        </Card>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" style={{ marginTop: 24 }}>
            Open field popover
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div data-probe="edge-popover" style={{ paddingBottom: 12 }}>
            <Input aria-label="In a popover" placeholder="In a popover" />
          </div>
        </PopoverContent>
      </Popover>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" style={{ marginTop: 24 }}>
            Open field dialog
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Field dialog</DialogTitle>
          <div data-probe="edge-dialog" style={{ paddingBottom: 12 }}>
            <Input aria-label="In a dialog" placeholder="In a dialog" />
          </div>
        </DialogContent>
      </Dialog>
      <div data-probe="table" style={{ width: 360, marginTop: 24 }}>
        <DataTable columns={INVOICE_COLUMNS} data={INVOICES} />
      </div>
      <div style={{ marginTop: 24 }}>
        <ControlStates />
      </div>
    </div>
  </ThemeProvider>,
)
