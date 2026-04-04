import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import type { ColumnDef } from "@tanstack/react-table"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Textarea } from "@/core/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
import { Checkbox } from "@/core/components/ui/checkbox"
import { Switch } from "@/core/components/ui/switch"
import { Label } from "@/core/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Badge } from "@/core/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { Separator } from "@/core/components/ui/separator"
import { Skeleton } from "@/core/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/core/components/ui/command"
import {
  StatCard,
  KPICard,
  ProgressCard,
  ActivityFeed,
  MetricGrid,
} from "@/features/dashboard"
import type { ActivityItem } from "@/features/dashboard"
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ChartCard,
} from "@/features/charts"
import { DataTable, ColumnHeader } from "@/features/data-table"
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  FormSection,
  FormActions,
} from "@/features/forms"

export const Route = createFileRoute("/_authenticated/components")({
  component: ComponentShowcasePage,
})

const SECTIONS = [
  { id: "buttons", label: "Buttons" },
  { id: "inputs", label: "Inputs & Form Controls" },
  { id: "cards", label: "Cards" },
  { id: "badges", label: "Badges" },
  { id: "dialogs", label: "Dialogs & Overlays" },
  { id: "dropdown", label: "Dropdown Menu" },
  { id: "accordion", label: "Accordion" },
  { id: "tabs", label: "Tabs" },
  { id: "avatar", label: "Avatar" },
  { id: "separator", label: "Separator" },
  { id: "skeleton", label: "Skeleton" },
  { id: "table", label: "Table" },
  { id: "scroll-area", label: "Scroll Area" },
  { id: "command", label: "Command Palette" },
  { id: "dashboard", label: "Dashboard Components" },
  { id: "charts", label: "Charts" },
  { id: "data-table", label: "Data Table" },
  { id: "form-fields", label: "Form Fields" },
  { id: "typography", label: "Typography" },
  { id: "colors", label: "Colors & Surfaces" },
]

const monthlyData = [
  { month: "Jan", revenue: 4200, orders: 120 },
  { month: "Feb", revenue: 5800, orders: 165 },
  { month: "Mar", revenue: 4900, orders: 140 },
  { month: "Apr", revenue: 6700, orders: 190 },
  { month: "May", revenue: 7200, orders: 210 },
  { month: "Jun", revenue: 6100, orders: 175 },
]

const pieData = [
  { name: "Electronics", value: 4200 },
  { name: "Clothing", value: 3100 },
  { name: "Food", value: 2400 },
  { name: "Books", value: 1800 },
]

const activityItems: ActivityItem[] = [
  {
    id: "1",
    user: { name: "Alice Johnson" },
    action: "placed a new order #1042",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    user: { name: "Bob Smith" },
    action: "updated product listing for Widget Pro",
    timestamp: "15 minutes ago",
  },
  {
    id: "3",
    user: { name: "Carol White" },
    action: "processed refund for order #987",
    timestamp: "1 hour ago",
  },
]

interface ShowcaseProduct {
  id: string
  name: string
  category: string
  price: number
  stock: number
}

const tableData: ShowcaseProduct[] = [
  {
    id: "1",
    name: "Widget Pro",
    category: "Electronics",
    price: 49.99,
    stock: 142,
  },
  {
    id: "2",
    name: "Basic Tee",
    category: "Clothing",
    price: 19.99,
    stock: 380,
  },
  { id: "3", name: "Coffee Blend", category: "Food", price: 12.5, stock: 75 },
  {
    id: "4",
    name: "TypeScript Handbook",
    category: "Books",
    price: 34.0,
    stock: 60,
  },
  {
    id: "5",
    name: "Smart Plug",
    category: "Electronics",
    price: 24.99,
    stock: 210,
  },
]

const tableColumns: ColumnDef<ShowcaseProduct, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <ColumnHeader column={column} title="Category" />,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <ColumnHeader column={column} title="Price" />,
    cell: ({ row }) => `$${(row.getValue("price") as number).toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <ColumnHeader column={column} title="Stock" />,
  },
]

const showcaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string(),
  age: z.number().min(18, "Must be 18 or older").max(120),
  role: z.string().min(1, "Role is required"),
  agree: z.boolean().refine((v) => v === true, "You must agree"),
  notifications: z.boolean(),
  plan: z.enum(["free", "pro", "enterprise"]),
})

function SectionHeading({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <h2 id={id} className="scroll-mt-20 text-xl font-semibold text-foreground">
      {children}
    </h2>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <SectionHeading id={id}>{title}</SectionHeading>
      <div className="rounded-lg border border-border bg-card p-6">
        {children}
      </div>
    </div>
  )
}

function ShowcaseFormFields() {
  const form = useForm({
    defaultValues: {
      name: "",
      bio: "",
      age: 25,
      role: "",
      agree: false,
      notifications: true,
      plan: "free",
    },
    validators: {
      onChange: showcaseSchema,
    },
    onSubmit: ({ value }) => {
      alert(JSON.stringify(value, null, 2))
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-6"
    >
      <FormSection
        title="Basic Info"
        description="Personal details with inline validation."
      >
        <form.Field
          name="name"
          validators={{ onBlur: showcaseSchema.shape.name }}
        >
          {(field) => (
            <TextField field={field} label="Full Name" placeholder="Jane Doe" />
          )}
        </form.Field>
        <form.Field
          name="bio"
          validators={{ onBlur: showcaseSchema.shape.bio }}
        >
          {(field) => (
            <TextareaField
              field={field}
              label="Bio"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          )}
        </form.Field>
        <form.Field
          name="age"
          validators={{ onBlur: showcaseSchema.shape.age }}
        >
          {(field) => (
            <NumberField
              field={field}
              label="Age"
              placeholder="25"
              min={0}
              max={120}
            />
          )}
        </form.Field>
        <form.Field
          name="role"
          validators={{ onBlur: showcaseSchema.shape.role }}
        >
          {(field) => (
            <SelectField
              field={field}
              label="Role"
              placeholder="Select a role"
              options={[
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Viewer", value: "viewer" },
              ]}
            />
          )}
        </form.Field>
      </FormSection>
      <FormSection
        title="Preferences"
        description="Toggle and choice controls."
      >
        <form.Field
          name="notifications"
          validators={{ onBlur: showcaseSchema.shape.notifications }}
        >
          {(field) => (
            <SwitchField
              field={field}
              label="Email notifications"
              description="Receive updates about your account activity."
            />
          )}
        </form.Field>
        <form.Field
          name="plan"
          validators={{ onBlur: showcaseSchema.shape.plan }}
        >
          {(field) => (
            <RadioGroupField
              field={field}
              label="Plan"
              options={[
                { label: "Free", value: "free" },
                { label: "Pro", value: "pro" },
                { label: "Enterprise", value: "enterprise" },
              ]}
            />
          )}
        </form.Field>
        <form.Field
          name="agree"
          validators={{ onBlur: showcaseSchema.shape.agree }}
        >
          {(field) => (
            <CheckboxField
              field={field}
              label="I agree to the terms and conditions"
            />
          )}
        </form.Field>
      </FormSection>
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <FormActions
            canSubmit={canSubmit as boolean}
            isSubmitting={isSubmitting as boolean}
            submitLabel="Submit Demo Form"
            onCancel={() => form.reset()}
            cancelLabel="Reset"
          />
        )}
      </form.Subscribe>
    </form>
  )
}

function ComponentShowcasePage() {
  const [dropdownChecked, setDropdownChecked] = useState(true)
  const [dropdownRadio, setDropdownRadio] = useState("option-a")
  const [switchChecked, setSwitchChecked] = useState(false)
  const [checkboxChecked, setCheckboxChecked] = useState(false)
  const [selectValue, setSelectValue] = useState("")
  const [radioValue, setRadioValue] = useState("option-a")

  return (
    <div className="space-y-8">
      <PageHeader
        title="Component Showcase"
        description="All UI components with the current theme applied."
      />

      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 rounded-lg border border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {s.label}
          </a>
        ))}
      </div>

      <Section id="buttons" title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Large</Button>
            <Button size="default">Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon">
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Disabled Default</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
            <Button variant="destructive" disabled>
              Disabled Destructive
            </Button>
          </div>
        </div>
      </Section>

      <Section id="inputs" title="Inputs & Form Controls">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="demo-text">Text Input</Label>
            <Input id="demo-text" placeholder="Type something..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-disabled">Disabled Input</Label>
            <Input id="demo-disabled" placeholder="Disabled" disabled />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="demo-textarea">Textarea</Label>
            <Textarea
              id="demo-textarea"
              placeholder="Enter a longer message..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-select">Select</Label>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger id="demo-select">
                <SelectValue placeholder="Pick an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alpha">Alpha</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="gamma">Gamma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Checkbox
              id="demo-checkbox"
              checked={checkboxChecked}
              onCheckedChange={(v) => setCheckboxChecked(v === true)}
            />
            <Label htmlFor="demo-checkbox">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="demo-switch"
              checked={switchChecked}
              onCheckedChange={setSwitchChecked}
            />
            <Label htmlFor="demo-switch">Enable notifications</Label>
          </div>
          <div className="space-y-2">
            <Label>Radio Group</Label>
            <RadioGroup value={radioValue} onValueChange={setRadioValue}>
              {["option-a", "option-b", "option-c"].map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <RadioGroupItem value={v} id={`demo-radio-${v}`} />
                  <Label htmlFor={`demo-radio-${v}`}>
                    {v.replace("option-", "Option ")}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </Section>

      <Section id="cards" title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
              <CardDescription>
                A standard card with header, content, and footer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is the card body. It can contain any content.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <div className="space-y-3">
            <div className="rounded-lg bg-surface-base p-4 ring-1 ring-border">
              <p className="text-xs font-medium text-muted-foreground">
                surface-base
              </p>
              <p className="mt-1 text-sm">Base surface elevation</p>
            </div>
            <div className="rounded-lg bg-surface-raised p-4 ring-1 ring-border">
              <p className="text-xs font-medium text-muted-foreground">
                surface-raised
              </p>
              <p className="mt-1 text-sm">Raised surface — cards, panels</p>
            </div>
            <div className="rounded-lg bg-surface-sunken p-4 ring-1 ring-border">
              <p className="text-xs font-medium text-muted-foreground">
                surface-sunken
              </p>
              <p className="mt-1 text-sm">Sunken surface — inset areas</p>
            </div>
            <div className="rounded-lg bg-surface-overlay p-4 ring-1 ring-border">
              <p className="text-xs font-medium text-muted-foreground">
                surface-overlay
              </p>
              <p className="mt-1 text-sm">
                Overlay surface — dialogs, popovers
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="badges" title="Badges">
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </Section>

      <Section id="dialogs" title="Dialogs & Overlays">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is the dialog description. Use it to give context about
                  what the user is confirming or interacting with.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Dialog body content goes here. This can include forms, info, or
                any other content.
              </p>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Sheet Panel</SheetTitle>
                <SheetDescription>
                  A side panel for contextual actions or detailed views.
                </SheetDescription>
              </SheetHeader>
              <p className="mt-4 text-sm text-muted-foreground">
                Sheet content appears here. Typically used for filters, detail
                views, or settings panels.
              </p>
              <SheetFooter className="mt-4">
                <Button>Apply</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <p className="text-sm font-medium">Popover Title</p>
                <p className="text-xs text-muted-foreground">
                  Popovers appear anchored to their trigger element and float
                  above the page content.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover for Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Section>

      <Section id="dropdown" title="Dropdown Menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Open Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={dropdownChecked}
              onCheckedChange={setDropdownChecked}
            >
              Show Notifications
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={dropdownRadio}
              onValueChange={setDropdownRadio}
            >
              <DropdownMenuRadioItem value="option-a">
                Option A
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option-b">
                Option B
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
                <DropdownMenuItem>Sub Item 2</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section id="accordion" title="Accordion">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is this component?</AccordionTrigger>
            <AccordionContent>
              An Accordion lets users show and hide sections of related content
              on a page. Click any item to expand or collapse its content.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>When should I use it?</AccordionTrigger>
            <AccordionContent>
              Use accordions for FAQs, settings panels, or anywhere you want to
              progressively disclose information without requiring navigation.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can multiple items be open?</AccordionTrigger>
            <AccordionContent>
              With <code className="font-mono text-xs">type="multiple"</code>,
              yes. This showcase uses{" "}
              <code className="font-mono text-xs">type="single"</code> so only
              one item is open at a time.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Section>

      <Section id="tabs" title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <p className="text-sm text-muted-foreground">
              This is the Overview tab. Tabs are used to organize content into
              distinct sections within the same page context.
            </p>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <p className="text-sm text-muted-foreground">
              This is the Details tab. Each panel is only rendered when its tab
              is active, keeping the initial render lightweight.
            </p>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <p className="text-sm text-muted-foreground">
              This is the Settings tab. You can place forms, data, or any other
              components inside a tab panel.
            </p>
          </TabsContent>
        </Tabs>
      </Section>

      <Section id="avatar" title="Avatar">
        <div className="flex items-end gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">AJ</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarFallback>BS</AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">CW</AvatarFallback>
          </Avatar>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">DX</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      <Section id="separator" title="Separator">
        <div className="space-y-4">
          <div>
            <p className="text-sm">Content above</p>
            <Separator className="my-3" />
            <p className="text-sm">Content below (horizontal separator)</p>
          </div>
          <div className="flex h-10 items-center gap-4">
            <span className="text-sm">Left</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Right (vertical separator)</span>
          </div>
        </div>
      </Section>

      <Section id="skeleton" title="Skeleton">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </Section>

      <Section id="table" title="Table">
        <Table>
          <TableCaption>A sample product inventory table.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell className="text-right">
                  ${row.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">{row.stock}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total Items</TableCell>
              <TableCell className="text-right">
                {tableData.reduce((sum, r) => sum + r.stock, 0)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Section>

      <Section id="scroll-area" title="Scroll Area">
        <ScrollArea className="h-48 rounded-md border border-border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="rounded-md bg-muted px-3 py-2 text-sm">
                List item {i + 1} — scroll to see more content below
              </div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      <Section id="command" title="Command Palette">
        <Command className="rounded-lg border border-border shadow-sm">
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              <CommandItem>Dashboard</CommandItem>
              <CommandItem>Analytics</CommandItem>
              <CommandItem>Products</CommandItem>
              <CommandItem>Orders</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem>Create Product</CommandItem>
              <CommandItem>Export CSV</CommandItem>
              <CommandItem>Invite Team Member</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Section>

      <Section id="dashboard" title="Dashboard Components">
        <div className="space-y-6">
          <MetricGrid columns={4}>
            <StatCard
              label="Total Revenue"
              value="$34,200"
              icon={DollarSign}
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              label="Orders"
              value="1,240"
              icon={ShoppingCart}
              trend={{ value: 3.2, isPositive: false }}
            />
            <StatCard
              label="Customers"
              value="8,340"
              icon={Users}
              trend={{ value: 8.1, isPositive: true }}
            />
            <StatCard
              label="Growth"
              value="+22%"
              icon={TrendingUp}
              trend={{ value: 4.7, isPositive: true }}
            />
          </MetricGrid>

          <div className="grid gap-4 sm:grid-cols-2">
            <KPICard
              label="Monthly Revenue"
              value="$7,200"
              comparison="vs $6,100 last month"
              sparklineData={[4200, 5800, 4900, 6700, 7200, 6100]}
            />
            <ProgressCard
              label="Sales Target"
              value={72000}
              target={100000}
              unit="$"
            />
          </div>

          <ActivityFeed items={activityItems} title="Recent Activity" />
        </div>
      </Section>

      <Section id="charts" title="Charts">
        <div className="grid gap-6 sm:grid-cols-2">
          <ChartCard title="Revenue" description="Monthly revenue trend">
            <AreaChart
              data={monthlyData}
              xKey="month"
              yKeys={["revenue"]}
              height={200}
            />
          </ChartCard>
          <ChartCard title="Orders" description="Monthly order volume">
            <BarChart
              data={monthlyData}
              xKey="month"
              yKeys={["orders"]}
              height={200}
            />
          </ChartCard>
          <ChartCard
            title="Revenue vs Orders"
            description="Dual-axis line comparison"
          >
            <LineChart
              data={monthlyData}
              xKey="month"
              yKeys={["revenue", "orders"]}
              height={200}
            />
          </ChartCard>
          <ChartCard
            title="Category Breakdown"
            description="Revenue by category"
          >
            <PieChart data={pieData} height={200} innerRadius={40} />
          </ChartCard>
        </div>
      </Section>

      <Section id="data-table" title="Data Table">
        <DataTable
          columns={tableColumns}
          data={tableData}
          searchKey="name"
          searchPlaceholder="Search products..."
        />
      </Section>

      <Section id="form-fields" title="Form Fields">
        <ShowcaseFormFields />
      </Section>

      <Section id="typography" title="Typography">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Heading 1 — 4xl bold</h1>
          <h2 className="text-3xl font-semibold">Heading 2 — 3xl semibold</h2>
          <h3 className="text-2xl font-semibold">Heading 3 — 2xl semibold</h3>
          <h4 className="text-xl font-medium">Heading 4 — xl medium</h4>
          <Separator />
          <p className="text-base">
            Body text at base size. Used for most paragraphs and readable
            content throughout the application.
          </p>
          <p className="text-sm text-muted-foreground">
            Muted text at small size. Used for descriptions, captions, and
            supplementary information.
          </p>
          <p className="text-xs text-muted-foreground">
            Extra small text. Used for timestamps, labels, and metadata.
          </p>
          <p className="inline-block rounded bg-muted px-2 py-1 font-mono text-sm">
            Monospace / code text — const x = 42;
          </p>
        </div>
      </Section>

      <Section id="colors" title="Colors & Surfaces">
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Surface Elevations
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { token: "bg-surface-base", label: "surface-base" },
                { token: "bg-surface-raised", label: "surface-raised" },
                { token: "bg-surface-overlay", label: "surface-overlay" },
                { token: "bg-surface-sunken", label: "surface-sunken" },
                { token: "bg-surface-sidebar", label: "surface-sidebar" },
                { token: "bg-surface-header", label: "surface-header" },
              ].map(({ token, label }) => (
                <div
                  key={token}
                  className={`${token} rounded-lg p-4 ring-1 ring-border`}
                >
                  <p className="font-mono text-xs text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Semantic Colors
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-primary p-4">
                <p className="font-mono text-xs text-primary-foreground">
                  primary
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="font-mono text-xs text-secondary-foreground">
                  secondary
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="font-mono text-xs text-muted-foreground">muted</p>
              </div>
              <div className="rounded-lg bg-destructive p-4">
                <p className="font-mono text-xs text-destructive-foreground">
                  destructive
                </p>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <p className="font-mono text-xs text-accent-foreground">
                  accent
                </p>
              </div>
              <div className="rounded-lg bg-card p-4 ring-1 ring-border">
                <p className="font-mono text-xs text-card-foreground">card</p>
              </div>
              <div className="rounded-lg bg-background p-4 ring-1 ring-border">
                <p className="font-mono text-xs text-foreground">background</p>
              </div>
              <div className="rounded-lg bg-popover p-4 ring-1 ring-border">
                <p className="font-mono text-xs text-popover-foreground">
                  popover
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
