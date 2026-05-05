import { useState } from "react"
import { useRouterAdapter } from "../../router"
import { Search } from "lucide-react"
import { useKeyboardEvent } from "../../hooks"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/command"
import { Button } from "../../components/button"

interface SearchCommandProps {
  navItems?: Array<{ label: string; href: string }>
}

export function SearchCommand({ navItems = [] }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const navigate = useRouterAdapter().useNavigate()

  useKeyboardEvent(
    "k",
    (e) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    },
    [],
    { eventOptions: { passive: false } },
  )

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground relative h-9 w-full justify-start gap-2 text-sm md:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="bg-muted pointer-events-none ml-auto hidden rounded border px-1.5 font-mono text-xs sm:inline-block">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {navItems.length > 0 && (
            <CommandGroup heading="Navigation">
              {navItems.map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => {
                    navigate(item.href)
                    setOpen(false)
                  }}
                >
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
