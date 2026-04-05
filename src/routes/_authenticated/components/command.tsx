import { createFileRoute } from "@tanstack/react-router"
import {
  Home,
  Package,
  BarChart3,
  ShoppingCart,
  Users,
  Plus,
  Download,
  UserPlus,
  Settings,
  Search,
} from "lucide-react"
import { PageHeader } from "@/core/layout"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/core/components/ui/command"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/command")({
  component: CommandPage,
})

function CommandPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Command" },
        ]}
        title="Command"
        description="Searchable command palette with grouped results. Typically triggered with ⌘K."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Basic command palette"
          code={`<Command className="rounded-lg border border-border shadow-sm">
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Pages">
      <CommandItem>Dashboard</CommandItem>
      <CommandItem>Analytics</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Actions">
      <CommandItem>Create Product</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>`}
        >
          <Command className="rounded-lg border border-border shadow-sm">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Pages">
                <CommandItem>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </CommandItem>
                <CommandItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </CommandItem>
                <CommandItem>
                  <Package className="mr-2 h-4 w-4" />
                  Products
                </CommandItem>
                <CommandItem>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </CommandItem>
                <CommandItem>
                  <Users className="mr-2 h-4 w-4" />
                  Customers
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Actions">
                <CommandItem>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Product
                </CommandItem>
                <CommandItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </CommandItem>
                <CommandItem>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </ShowcaseExample>

        <ShowcaseExample
          title="With keyboard shortcuts"
          code={`<CommandItem>
  <Home className="mr-2 h-4 w-4" />
  Dashboard
  <CommandShortcut>⌘H</CommandShortcut>
</CommandItem>
<CommandItem>
  <Settings className="mr-2 h-4 w-4" />
  Settings
  <CommandShortcut>⌘,</CommandShortcut>
</CommandItem>
<CommandItem>
  <Search className="mr-2 h-4 w-4" />
  Search
  <CommandShortcut>⌘K</CommandShortcut>
</CommandItem>`}
        >
          <Command className="rounded-lg border border-border shadow-sm">
            <CommandInput placeholder="Search commands..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Navigation">
                <CommandItem>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                  <CommandShortcut>⌘H</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                  <CommandShortcut>⌘K</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                  <CommandShortcut>⌘,</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Quick actions">
                <CommandItem>
                  <Plus className="mr-2 h-4 w-4" />
                  New document
                  <CommandShortcut>⌘N</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <CommandShortcut>⌘E</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </ShowcaseExample>
      </div>
    </div>
  )
}
