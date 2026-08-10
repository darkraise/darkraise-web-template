import { cn } from "@lib/utils"
import { Separator } from "@components/separator"
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

/* Typed as a full Record so adding a group to ThemeSettingsGroup without a
   label here is a compile error rather than a section silently dropped from
   the page layout. Declaration order is the render order. */
const GROUP_LABELS: Record<ThemeSettingsGroup, string> = {
  theme: "Theme",
  color: "Color",
  background: "Background",
  layout: "Layout",
  depth: "Depth",
}

const GROUP_ORDER = (
  Object.entries(GROUP_LABELS) as [ThemeSettingsGroup, string][]
).map(([group, label]) => ({ group, label }))

export function ThemeSettingsPanel({
  layout = "compact",
  className,
}: ThemeSettingsPanelProps = {}) {
  const sections = useThemeSettingsSections()

  if (sections.length === 0) return null

  if (layout === "page") {
    const groups = GROUP_ORDER.map((entry) => ({
      ...entry,
      sections: sections.filter((section) => section.group === entry.group),
    })).filter((entry) => entry.sections.length > 0)

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
