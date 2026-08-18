import type { UiLabels } from "./types"

export const defaultLabels: UiLabels = {
  dataTable: {
    search: "Search...",
    reset: "Reset",
    columns: "Columns",
    toggleColumns: "Toggle columns",
    empty: "No results found",
    rowsPerPage: "Rows per page",
    pageInfo: (page, pageCount) => `Page ${page} of ${pageCount}`,
    rowsSelected: (selected, total) =>
      `${selected} of ${total} row(s) selected`,
  },
  layout: {
    skipToContent: "Skip to content",
    search: "Search...",
    searchWithShortcut: (shortcut) => `Search (${shortcut})`,
    searchDialogPlaceholder: "Type a command or search...",
    searchEmpty: "No results found.",
    navigationHeading: "Navigation",
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
  },
  userMenu: {
    profile: "Profile",
    settings: "Settings",
    logout: "Log out",
  },
  passwordInput: {
    show: "Show password",
    hide: "Hide password",
    visible: "Password visible",
    hidden: "Password hidden",
  },
  theme: {
    title: "Theme settings",
    triggerLabel: "Customize theme",
    groupLabels: {
      theme: "Theme",
      color: "Color",
      background: "Background",
      layout: "Layout",
      depth: "Depth",
    },
    axisLabels: {
      mode: "Mode",
      accentColor: "Accent Color",
      surfaceColor: "Surface Color",
      preset: "Preset",
      backgroundStyle: "Background",
      backgroundIntensity: "Background Intensity",
      gradientPattern: "Gradient Pattern",
      density: "Density",
      elevation: "Elevation",
      buttonElevation: "Button Elevation",
      surfaceIntensity: "Surface Intensity",
      radius: "Radius",
      fontSize: "Font Size",
      accentVibrancy: "Accent Vibrancy",
      /* Currently unused: the "preset-axes" section has no fixed heading
         of its own — it renders only dynamic per-preset axisDef.label
         values from ThemePreset definitions, which live outside UiLabels.
         Also note the section's `key` is kebab-case "preset-axes" while
         this axis name is camelCase `presetAxes`, so they don't match by
         string equality even if a heading were added here later. */
      presetAxes: "Preset options",
    },
    modes: { light: "Light", dark: "Dark", system: "System" },
  },
  errors: {
    notFoundTitle: "Page not found",
    notFoundDescription:
      "The page you're looking for doesn't exist or has been moved.",
    serverErrorTitle: "Server error",
    serverErrorDescription:
      "Something went wrong on our end. Please try again later.",
    genericTitle: "Something went wrong",
    genericDescription: "An unexpected error occurred.",
    maintenanceTitle: "Under maintenance",
    maintenanceDescription:
      "We're performing scheduled maintenance. We'll be back shortly.",
    goBack: "Go back",
    backHome: "Back to home",
    tryAgain: "Try again",
    retry: "Retry",
  },
}
