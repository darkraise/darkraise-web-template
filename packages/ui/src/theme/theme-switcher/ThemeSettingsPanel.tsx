import { ChevronRight } from "lucide-react"
import { cn } from "@lib/utils"
import { Separator } from "@components/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@components/collapsible"
import { useUiLabels } from "@labels"
import {
  useThemeSettingsSections,
  type ThemeSettingsGroup,
  type ThemeSettingsSection,
} from "./useThemeSettingsSections"
import "./theme-switcher.css"

export interface ThemeSettingsPanelProps {
  /** Arrangement. Defaults to "compact". */
  layout?: "compact" | "page"
  className?: string
}

function SectionList({ sections }: { sections: ThemeSettingsSection[] }) {
  return (
    <>
      {sections.map((section, i) => (
        <div key={section.key}>
          {section.node}
          {i < sections.length - 1 && <Separator className="mt-2" />}
        </div>
      ))}
    </>
  )
}

export function ThemeSettingsPanel({
  layout = "compact",
  className,
}: ThemeSettingsPanelProps = {}) {
  const labels = useUiLabels()
  const sections = useThemeSettingsSections()

  if (sections.length === 0) return null

  const brand = sections.filter((section) => section.group === "brand")
  const advanced = sections.filter((section) => section.group === "advanced")

  if (layout === "page") {
    const groups: {
      group: ThemeSettingsGroup
      label: string
      sections: ThemeSettingsSection[]
    }[] = [
      {
        group: "brand",
        label: labels.theme.groupLabels.brand,
        sections: brand,
      },
      {
        group: "advanced",
        label: labels.theme.groupLabels.advanced,
        sections: advanced,
      },
    ]

    return (
      <div
        data-layout="page"
        className={cn("dr-theme-settings", "dr-theme-settings-page", className)}
      >
        {groups
          .filter((entry) => entry.sections.length > 0)
          .map((entry) => (
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
      <SectionList sections={brand} />
      {brand.length > 0 && advanced.length > 0 && <Separator />}
      {advanced.length > 0 && (
        /* Uncontrolled, so it is closed whenever the popover mounts the panel. */
        <Collapsible>
          <CollapsibleTrigger className="dr-theme-settings-advanced-trigger">
            <ChevronRight
              className="dr-theme-settings-advanced-chevron"
              aria-hidden="true"
            />
            {labels.theme.groupLabels.advanced}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 pt-2">
              <SectionList sections={advanced} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}
