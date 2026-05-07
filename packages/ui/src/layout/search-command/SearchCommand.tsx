import { useState } from "react"
import { useRouterAdapter } from "@router"
import { Search } from "lucide-react"
import { useKeyboardEvent } from "@hooks"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@components/command"
import { Button } from "@components/button"

interface SearchCommandProps {
  navItems?: Array<{ label: string; href: string }>
}

// Detect Mac so the keyboard shortcut hint matches the actual modifier.
// Falls back to Ctrl on the server / unknown platforms where navigator
// is unavailable or doesn't expose a recognizable platform string.
const isMac =
  typeof navigator !== "undefined" &&
  /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || "")
const SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl K"

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
        className="dr-search-command-trigger"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="dr-search-command-shortcut">{SHORTCUT_LABEL}</kbd>
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
