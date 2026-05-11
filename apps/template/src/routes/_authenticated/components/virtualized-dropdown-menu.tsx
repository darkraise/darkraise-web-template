import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import {
  VirtualizedDropdownMenu,
  VirtualizedDropdownMenuContent,
  VirtualizedDropdownMenuItem,
  VirtualizedDropdownMenuTrigger,
} from "darkraise-ui/components/virtualized-dropdown-menu"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/virtualized-dropdown-menu",
)({
  component: VirtualizedDropdownMenuPage,
})

function VirtualizedDropdownExample({ count }: { count: number }) {
  const items = useMemo(
    () => Array.from({ length: count }, (_, i) => `Item ${i + 1}`),
    [count],
  )
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="flex items-center gap-4">
      <VirtualizedDropdownMenu>
        <VirtualizedDropdownMenuTrigger asChild>
          <Button variant="outline">
            {selected ?? "Pick an item"}{" "}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </VirtualizedDropdownMenuTrigger>
        <VirtualizedDropdownMenuContent
          items={items}
          estimateSize={32}
          className="w-[220px]"
          onItemSelect={(item) => setSelected(item)}
        >
          {(item, { isActive }) => (
            <VirtualizedDropdownMenuItem isActive={isActive}>
              {item}
            </VirtualizedDropdownMenuItem>
          )}
        </VirtualizedDropdownMenuContent>
      </VirtualizedDropdownMenu>
      {selected && (
        <span className="text-muted-foreground text-sm">
          Selected: {selected}
        </span>
      )}
    </div>
  )
}

function VirtualizedDropdownMenuPage() {
  return (
    <ShowcasePage
      title="Virtualized Dropdown Menu"
      description="Drop-in alternative to DropdownMenu that renders only the visible rows. Use when the option list is too large to mount eagerly — autocomplete catalogs, country pickers, log entries."
    >
      <ShowcaseExample
        title="10,000 items"
        code={`const items = Array.from({ length: 10000 }, (_, i) => \`Item \${i + 1}\`)
const [selected, setSelected] = useState<string | null>(null)

<VirtualizedDropdownMenu>
  <VirtualizedDropdownMenuTrigger asChild>
    <Button variant="outline">
      {selected ?? "Pick an item"} <ChevronDown />
    </Button>
  </VirtualizedDropdownMenuTrigger>
  <VirtualizedDropdownMenuContent
    items={items}
    estimateSize={32}
    className="w-[220px]"
    onItemSelect={(item) => setSelected(item)}
  >
    {(item, { isActive }) => (
      <VirtualizedDropdownMenuItem isActive={isActive}>
        {item}
      </VirtualizedDropdownMenuItem>
    )}
  </VirtualizedDropdownMenuContent>
</VirtualizedDropdownMenu>`}
      >
        <VirtualizedDropdownExample count={10000} />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
