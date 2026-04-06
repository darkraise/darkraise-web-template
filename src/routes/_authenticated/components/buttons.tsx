import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  Mail,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  ChevronRight,
  List,
  LayoutGrid,
  Kanban,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
} from "lucide-react"
import { Button } from "@/core/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu"
import { Separator } from "@/core/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/core/components/ui/toggle-group"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/buttons")({
  component: ButtonsPage,
})

function ButtonsPage() {
  const [viewMode, setViewMode] = useState<"list" | "grid" | "board">("list")
  const [period, setPeriod] = useState<"1D" | "1W" | "1M" | "1Y">("1M")

  return (
    <ShowcasePage
      title="Buttons"
      description="Interactive trigger elements with multiple visual variants, sizes, and states."
    >
      <ShowcaseExample
        title="Variants"
        code={`<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Sizes"
        code={`<Button size="lg">Large</Button>
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="icon"><TrendingUp className="h-4 w-4" /></Button>`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Large</Button>
          <Button size="default">Default</Button>
          <Button size="sm">Small</Button>
          <Button size="icon">
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="With icons"
        code={`<Button><Mail className="mr-2 h-4 w-4" />Email</Button>
<Button variant="outline"><Plus className="mr-2 h-4 w-4" />New Item</Button>
<Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
<Button variant="secondary">Continue<ChevronRight className="ml-2 h-4 w-4" /></Button>`}
      >
        <div className="flex flex-wrap gap-3">
          <Button>
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Item
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="secondary">
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Loading state"
        code={`<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Saving...
</Button>
<Button variant="outline" disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading
</Button>`}
      >
        <div className="flex flex-wrap gap-3">
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </Button>
          <Button variant="outline" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled state"
        code={`<Button disabled>Disabled Default</Button>
<Button variant="outline" disabled>Disabled Outline</Button>
<Button variant="destructive" disabled>Disabled Destructive</Button>
<Button variant="secondary" disabled>Disabled Secondary</Button>
<Button variant="ghost" disabled>Disabled Ghost</Button>`}
      >
        <div className="flex flex-wrap gap-3">
          <Button disabled>Disabled Default</Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
          <Button variant="destructive" disabled>
            Disabled Destructive
          </Button>
          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>
          <Button variant="ghost" disabled>
            Disabled Ghost
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Button group"
        code={`const [viewMode, setViewMode] = useState("list")

<div className="inline-flex">
  <Button
    variant={viewMode === "list" ? "secondary" : "outline"}
    className="rounded-r-none"
    onClick={() => setViewMode("list")}
  >
    <List className="mr-2 h-4 w-4" />List
  </Button>
  <Button
    variant={viewMode === "grid" ? "secondary" : "outline"}
    className="rounded-none border-x-0"
    onClick={() => setViewMode("grid")}
  >
    <LayoutGrid className="mr-2 h-4 w-4" />Grid
  </Button>
  <Button
    variant={viewMode === "board" ? "secondary" : "outline"}
    className="rounded-l-none"
    onClick={() => setViewMode("board")}
  >
    <Kanban className="mr-2 h-4 w-4" />Board
  </Button>
</div>`}
      >
        <div className="inline-flex">
          <Button
            variant={viewMode === "list" ? "secondary" : "outline"}
            className="rounded-r-none"
            onClick={() => setViewMode("list")}
          >
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "outline"}
            className="rounded-none border-x-0"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "board" ? "secondary" : "outline"}
            className="rounded-l-none"
            onClick={() => setViewMode("board")}
          >
            <Kanban className="mr-2 h-4 w-4" />
            Board
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Split button"
        code={`<div className="inline-flex">
  <Button className="rounded-r-none">Save</Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="rounded-l-none border-l-0 px-2">
        <ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Save as Draft</DropdownMenuItem>
      <DropdownMenuItem>Save &amp; Publish</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>`}
      >
        <div className="inline-flex">
          <Button className="rounded-r-none">Save</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-l-none border-l-0 px-2">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Save as Draft</DropdownMenuItem>
              <DropdownMenuItem>Save &amp; Publish</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Icon toolbar"
        code={`<div className="inline-flex items-center gap-1">
  <Button variant="ghost" size="icon"><Bold className="h-4 w-4" /></Button>
  <Button variant="ghost" size="icon"><Italic className="h-4 w-4" /></Button>
  <Button variant="ghost" size="icon"><Underline className="h-4 w-4" /></Button>
  <Separator orientation="vertical" className="h-6" />
  <Button variant="ghost" size="icon"><AlignLeft className="h-4 w-4" /></Button>
  <Button variant="ghost" size="icon"><AlignCenter className="h-4 w-4" /></Button>
  <Button variant="ghost" size="icon"><AlignRight className="h-4 w-4" /></Button>
  <Separator orientation="vertical" className="h-6" />
  <Button variant="ghost" size="icon"><Undo className="h-4 w-4" /></Button>
  <Button variant="ghost" size="icon"><Redo className="h-4 w-4" /></Button>
</div>`}
      >
        <div className="inline-flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Underline className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="ghost" size="icon">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toggle button bar"
        code={`const [period, setPeriod] = useState("1M")

<ToggleGroup type="single" value={period} onValueChange={(v) => { if (v) setPeriod(v as typeof period) }}>
  <ToggleGroupItem value="1D">1D</ToggleGroupItem>
  <ToggleGroupItem value="1W">1W</ToggleGroupItem>
  <ToggleGroupItem value="1M">1M</ToggleGroupItem>
  <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
</ToggleGroup>`}
      >
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(v) => {
            if (v) setPeriod(v as typeof period)
          }}
        >
          <ToggleGroupItem value="1D">1D</ToggleGroupItem>
          <ToggleGroupItem value="1W">1W</ToggleGroupItem>
          <ToggleGroupItem value="1M">1M</ToggleGroupItem>
          <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
        </ToggleGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
