import { cn } from "@lib/utils"
import { Separator } from "@components/separator"
import { useUiLabels } from "@labels"
import {
  useThemeSettingsSections,
  type ThemeSettingsGroup,
} from "./useThemeSettingsSections"
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
  const labels = useUiLabels()
  const sections = useThemeSettingsSections()

  if (sections.length === 0) return null

  if (layout === "page") {
    /* labels.theme.groupLabels is typed as a full Record<ThemeSettingsGroup,
       string> (see labels/types.ts), so adding a group to ThemeSettingsGroup
       without a label there is a compile error rather than a section
       silently dropped from the page layout. Object spread in mergeLabels
       preserves the base's key order, so this stays theme/color/background/
       layout/depth even after a partial override. */
    const groupOrder = Object.entries(labels.theme.groupLabels) as [
      ThemeSettingsGroup,
      string,
    ][]
    const groups = groupOrder
      .map(([group, label]) => ({
        group,
        label,
        sections: sections.filter((section) => section.group === group),
      }))
      .filter((entry) => entry.sections.length > 0)

    return (
      <div
        data-layout="page"
        className={cn("dr-theme-settings", "dr-theme-settings-page", className)}
      >
        {groups.map((entry) => (
          <section key={entry.group} className="dr-theme-settings-group">
            <h3 className="dr-theme-settings-group-heading">{entry.label}</h3>
            <div className="dr-theme-settings-group-body">
              {entry.sections.map((section) => (
                <div key={section.key}>{section.node}</div>
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

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
