import { useState } from "react"
import { useRouterAdapter } from "@router"
import { Search } from "lucide-react"
import { useKeyboardEvent } from "@hooks"
import { useUiLabels } from "@labels"
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
  /**
   * Render as an icon-only square, for the collapsed sidebar rail. Passed
   * explicitly rather than read from sidebar context: this component also
   * renders in the header of the layouts that have no sidebar at all, where
   * `useSidebar()` would throw.
   *
   * @default false
   */
  collapsed?: boolean
}

// Detect Mac so the keyboard shortcut hint matches the actual modifier.
// `navigator.platform` is deprecated and returns "" in modern Chrome; prefer
// `userAgentData.platform`, then a userAgent regex, then the legacy
// `platform` string as a last resort. Falls back to Ctrl on the server or
// when no platform can be identified.
const detectMac = (): boolean => {
  if (typeof navigator === "undefined") return false
  const uaData = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData
  if (uaData?.platform) return /mac/i.test(uaData.platform)
  if (typeof navigator.userAgent === "string") {
    if (/(Mac|iPhone|iPad|iPod)/i.test(navigator.userAgent)) return true
  }
  return /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform || "")
}
const isMac = detectMac()
const SHORTCUT_LABEL = isMac ? "⌘K" : "Ctrl K"

export function SearchCommand({
  navItems = [],
  collapsed = false,
}: SearchCommandProps) {
  const labels = useUiLabels()
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
        size={collapsed ? "icon" : undefined}
        className="dr-search-command-trigger"
        data-collapsed={collapsed ? "true" : undefined}
        onClick={() => setOpen(true)}
        aria-label={
          collapsed
            ? labels.layout.searchWithShortcut(SHORTCUT_LABEL)
            : undefined
        }
        title={
          collapsed
            ? labels.layout.searchWithShortcut(SHORTCUT_LABEL)
            : undefined
        }
      >
        <Search className="size-[var(--icon-size)]" aria-hidden="true" />
        {!collapsed && (
          <>
            <span>{labels.layout.search}</span>
            <kbd className="dr-search-command-shortcut">{SHORTCUT_LABEL}</kbd>
          </>
        )}
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={labels.layout.searchDialogPlaceholder} />
        <CommandList>
          <CommandEmpty>{labels.layout.searchEmpty}</CommandEmpty>
          {navItems.length > 0 && (
            <CommandGroup heading={labels.layout.navigationHeading}>
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
