import { useUiText } from "../../i18n/useUiText"
import { Button } from "@components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@components/dropdown-menu"
import { useLayoutStore, type LayoutVariant } from "@layout/layoutStore"
import type { ShellStyle } from "@theme/types"
import { LayoutChoices } from "./LayoutChoices"
import { DEFAULT_LAYOUT, layoutEntries } from "./layoutEntries"

export interface LayoutSwitcherProps {
  /**
   * Which variants this app can render. `split-panel` needs a `panel`, so an
   * app without one leaves it out rather than offering a shell it cannot
   * build. Defaults to all four.
   */
  variants?: LayoutVariant[]
  /**
   * Hides the shell-style choice. A layout sets it when its `shellStyle` prop
   * pins the style, because a stored pick could not change that shell.
   *
   * @default false
   */
  shellStylePinned?: boolean
  /**
   * The style the layout resolved and painted, so the choice shows it checked
   * even when nothing is stored. Outside a layout, the stored pick is checked.
   */
  currentShellStyle?: ShellStyle
}

export function LayoutSwitcher({
  variants,
  shellStylePinned = false,
  currentShellStyle,
}: LayoutSwitcherProps = {}) {
  const uiText = useUiText()
  const { layout } = useLayoutStore()
  const current =
    layoutEntries(variants).find((l) => l.value === layout) ?? DEFAULT_LAYOUT
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="dr-layout-switcher-trigger"
        >
          <CurrentIcon className="size-[var(--icon-size)]" />
          <span className="sr-only">{uiText("Switch layout")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <LayoutChoices
          variants={variants}
          shellStylePinned={shellStylePinned}
          currentShellStyle={currentShellStyle}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
