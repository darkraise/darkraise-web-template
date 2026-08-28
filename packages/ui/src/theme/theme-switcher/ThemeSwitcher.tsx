import type * as React from "react"
import { Palette } from "lucide-react"
import { cn } from "@lib/utils"
import { Button } from "@components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@components/popover"
import { useUiLabels } from "@labels"
import { ThemeSettingsPanel } from "./ThemeSettingsPanel"
import { useThemeSettingsSections } from "./useThemeSettingsSections"
import "./theme-switcher.css"

export interface ThemeSwitcherProps {
  /** Trap focus in the popover and restore it to the trigger on close. */
  modal?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onCloseAutoFocus?: (event: Event) => void
  side?: React.ComponentProps<typeof PopoverContent>["side"]
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  /** Applied to the popover content. */
  className?: string
  /** Role of the popover content. Defaults to `dialog`. */
  role?: string
  /** Accessible name of the popover content. */
  "aria-label"?: string
  /** Accessible name of the trigger button. */
  triggerLabel?: string
}

export function ThemeSwitcher({
  modal,
  open,
  defaultOpen,
  onOpenChange,
  onCloseAutoFocus,
  side,
  align = "end",
  className,
  role = "dialog",
  "aria-label": ariaLabel,
  triggerLabel,
}: ThemeSwitcherProps = {}) {
  const labels = useUiLabels()
  const resolvedAriaLabel = ariaLabel ?? labels.theme.title
  const resolvedTriggerLabel = triggerLabel ?? labels.theme.triggerLabel
  const visibleSections = useThemeSettingsSections()

  if (visibleSections.length === 0) return null

  return (
    <Popover
      modal={modal}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="size-[var(--icon-size)]" aria-hidden="true" />
          <span className="sr-only">{resolvedTriggerLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        /* Static width, sized for the worst case rather than the common one:
           the panel does not resize as the user drags the font-size or
           density sliders, which is what makes those axes feel stable to
           adjust. 34rem clears the widest measured content (spacious +
           extra-large, ~510px) with headroom; the viewport cap keeps it on
           screen on narrow displays. */
        className={cn("w-[34rem] max-w-[calc(100vw-2rem)]", className)}
        side={side}
        align={align}
        role={role}
        aria-label={resolvedAriaLabel}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <ThemeSettingsPanel />
      </PopoverContent>
    </Popover>
  )
}
