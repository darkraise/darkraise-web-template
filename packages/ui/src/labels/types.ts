import type { ThemeConfig } from "@theme/themeConfig"
import type { ThemeSettingsGroup } from "@theme/theme-switcher/useThemeSettingsSections"

/** Every axis the theme switcher can show, derived from the config type so a
 *  new axis is a compile error in `defaultLabels` rather than English text
 *  leaking into a translated app. */
export type ThemeAxisName = keyof ThemeConfig["switcher"]["axes"]

export interface UiLabels {
  dataTable: {
    search: string
    reset: string
    columns: string
    toggleColumns: string
    empty: string
    rowsPerPage: string
    pageInfo: (page: number, pageCount: number) => string
    rowsSelected: (selected: number, total: number) => string
    filterBy: (column: string) => string
  }
  layout: {
    skipToContent: string
    search: string
    searchWithShortcut: (shortcut: string) => string
    searchDialogPlaceholder: string
    searchEmpty: string
    navigationHeading: string
    expandSidebar: string
    collapseSidebar: string
  }
  userMenu: {
    profile: string
    settings: string
    logout: string
  }
  passwordInput: {
    show: string
    hide: string
    visible: string
    hidden: string
  }
  theme: {
    title: string
    triggerLabel: string
    groupLabels: Record<ThemeSettingsGroup, string>
    axisLabels: Record<ThemeAxisName, string>
    modes: { light: string; dark: string; system: string }
  }
  errors: {
    notFoundTitle: string
    notFoundDescription: string
    serverErrorTitle: string
    serverErrorDescription: string
    genericTitle: string
    genericDescription: string
    maintenanceTitle: string
    maintenanceDescription: string
    goBack: string
    backHome: string
    tryAgain: string
    retry: string
  }
}

/** Deep-partial that stops at functions — a label function is replaced whole,
 *  never recursed into. */
export type DeepPartialLabels<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? DeepPartialLabels<T[K]>
      : T[K]
}
