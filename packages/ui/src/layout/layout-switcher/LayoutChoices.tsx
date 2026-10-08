import { useUiText } from "../../i18n/useUiText"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@components/dropdown-menu"
import { useLayoutStore } from "@layout/layoutStore"
import { SHELL_STYLES, type ShellStyle } from "@theme/types"
import { useUiLabels } from "@labels"
import type { LayoutSwitcherProps } from "./LayoutSwitcher"
import { layoutEntries } from "./layoutEntries"

/**
 * The layout and shell-style choices, rendered inside a menu. The header's
 * LayoutSwitcher and the user menu's Layout submenu show the same items.
 */
export function LayoutChoices({
  variants,
  shellStylePinned = false,
  currentShellStyle,
}: LayoutSwitcherProps) {
  const uiText = useUiText()
  const { themeOptions } = useUiLabels()
  const { layout, setLayout, shellStyle, setShellStyle } = useLayoutStore()

  return (
    <>
      {layoutEntries(variants).map(({ value, label, icon: Icon }) => (
        <DropdownMenuItem
          key={value}
          onClick={() => setLayout(value)}
          className="dr-layout-switcher-item"
          data-active={layout === value ? "true" : undefined}
        >
          <Icon className="dr-layout-switcher-item-icon" />
          {uiText(label)}
        </DropdownMenuItem>
      ))}
      {!shellStylePinned && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{uiText("Shell style")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={currentShellStyle ?? shellStyle ?? undefined}
            onValueChange={(value) => setShellStyle(value as ShellStyle)}
          >
            {SHELL_STYLES.map((style) => (
              <DropdownMenuRadioItem key={style} value={style}>
                {themeOptions[style]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </>
      )}
    </>
  )
}
