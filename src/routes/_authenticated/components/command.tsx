import { createFileRoute } from "@tanstack/react-router"
import { useState, useEffect } from "react"
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
  Clock,
  Star,
  Loader2,
} from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/core/components/ui/command"
import { Button } from "@/core/components/ui/button"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/command")({
  component: CommandPage,
})

function CommandPage() {
  return (
    <ShowcasePage
      title="Command"
      description="Searchable command palette with grouped results. Typically triggered with ⌘K."
    >
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
        <Command className="border-border rounded-lg border shadow-sm">
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
        <Command className="border-border rounded-lg border shadow-sm">
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

      <ShowcaseExample
        title="Recent searches dialog"
        code={`function RecentSearchesDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open recent searches</Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandGroup heading="Recent">
            <CommandItem><Clock className="mr-2 h-4 w-4" />Dashboard settings</CommandItem>
            <CommandItem><Clock className="mr-2 h-4 w-4" />User management</CommandItem>
            <CommandItem><Clock className="mr-2 h-4 w-4" />API documentation</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Suggestions">
            <CommandItem><Star className="mr-2 h-4 w-4" />Create new project</CommandItem>
            <CommandItem><Star className="mr-2 h-4 w-4" />Invite team members</CommandItem>
            <CommandItem><Star className="mr-2 h-4 w-4" />View analytics</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}`}
      >
        <RecentSearchesDemo />
      </ShowcaseExample>

      <ShowcaseExample
        title="Async search results"
        code={`function AsyncSearchDemo() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!query) { setLoading(false); return }
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [query])

  const results = ["Dashboard overview", "User settings", "API keys"].filter(r =>
    r.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>Search with loading</Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." value={query} onValueChange={setQuery} />
        <CommandList>
          {loading ? (
            <CommandItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </CommandItem>
          ) : query && results.length > 0 ? (
            <CommandGroup heading="Results">
              {results.map(r => <CommandItem key={r}>{r}</CommandItem>)}
            </CommandGroup>
          ) : (
            <CommandEmpty>{query ? "No results found." : "Start typing to search."}</CommandEmpty>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}`}
      >
        <AsyncSearchDemo />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

function RecentSearchesDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open recent searches</Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Recent">
            <CommandItem>
              <Clock className="mr-2 h-4 w-4" />
              Dashboard settings
            </CommandItem>
            <CommandItem>
              <Clock className="mr-2 h-4 w-4" />
              User management
            </CommandItem>
            <CommandItem>
              <Clock className="mr-2 h-4 w-4" />
              API documentation
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Suggestions">
            <CommandItem>
              <Star className="mr-2 h-4 w-4" />
              Create new project
            </CommandItem>
            <CommandItem>
              <Star className="mr-2 h-4 w-4" />
              Invite team members
            </CommandItem>
            <CommandItem>
              <Star className="mr-2 h-4 w-4" />
              View analytics
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

function AsyncSearchDemo() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!query) {
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(t)
  }, [query])

  const allResults = ["Dashboard overview", "User settings", "API keys"]
  const results = allResults.filter((r) =>
    r.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <>
      <Button onClick={() => setOpen(true)}>Search with loading</Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <CommandItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </CommandItem>
          ) : query && results.length > 0 ? (
            <CommandGroup heading="Results">
              {results.map((r) => (
                <CommandItem key={r}>{r}</CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandEmpty>
              {query ? "No results found." : "Start typing to search."}
            </CommandEmpty>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
