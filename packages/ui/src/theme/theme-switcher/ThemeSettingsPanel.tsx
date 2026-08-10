import { cn } from "@lib/utils"
import { Separator } from "@components/separator"
import { useThemeSettingsSections } from "./useThemeSettingsSections"
import "./theme-switcher.css"

export interface ThemeSettingsPanelProps {
  /** Arrangement. Defaults to "compact". */
  layout?: "compact" | "page"
  className?: string
}

export function ThemeSettingsPanel({
  layout = "compact",
  className,
}: ThemeSettingsPanelProps = {}) {
  const sections = useThemeSettingsSections()

  if (sections.length === 0) return null

  return (
    <div
      data-layout={layout}
      className={cn("dr-theme-settings", "space-y-2", className)}
    >
      {sections.map((section, i) => (
        <div key={section.key}>
          {section.node}
          {i < sections.length - 1 && <Separator className="mt-2" />}
        </div>
      ))}
    </div>
  )
}
