# Translatable component labels and a self-contained font import

**Date:** 2026-08-13
**Status:** Approved, ready for implementation planning

## Summary

`darkraise-ui` renders user-facing English text that a consuming app cannot
change. Any app in another language is therefore permanently half-translated:
the app's own strings are localised while the data table says "Rows per page",
the user menu says "Log out", and the sidebar's search palette says "Type a
command or search…". This adds a labels override mechanism so a consumer can
supply its own strings once, for the whole tree, without forking components.

Separately, the published stylesheet issues a runtime `@import` to Google Fonts
for a face used by exactly one theme preset. Every page load of every consuming
app makes an outbound request to Google regardless of the active preset. This
makes that import conditional.

Both changes ship as `darkraise-ui` 4.1.0 and are additive: apps that pass
nothing keep today's English text and today's fonts.

The immediate driver is a Vietnamese-language app being built on the kit, but
nothing here is specific to that app or that language.

## Current state

### Strings are literals inside component bodies

There is no strings, labels, or locale mechanism anywhere in the package — a
grep for `i18n`, `locale`, or a `labels` prop finds only the Calendar and
NumberInput components, which delegate formatting to `Intl`. Every other
user-facing string is a literal in JSX.

The strings a consuming app cannot currently reach:

| Component                                                             | Strings                                                                                                                                                                                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-table/components/data-table-toolbar/DataTableToolbar.tsx`       | `"Reset"` (the `searchPlaceholder` prop already exists and stays)                                                                                                                                                                |
| `data-table/components/data-table-pagination/DataTablePagination.tsx` | `"{n} of {m} row(s) selected"`, `"Rows per page"`, `"Page {n} of {m}"`                                                                                                                                                           |
| `data-table/components/data-table-empty/DataTableEmpty.tsx`           | `"No results found"`                                                                                                                                                                                                             |
| `data-table/components/column-visibility/ColumnVisibility.tsx`        | `"Columns"`, `"Toggle columns"`                                                                                                                                                                                                  |
| `layout/user-menu/UserMenu.tsx`                                       | `"Profile"`, `"Settings"`, `"Log out"`                                                                                                                                                                                           |
| `layout/search-command/SearchCommand.tsx`                             | `"Search…"`, `"Search ({shortcut})"`, `"Type a command or search…"`, `"No results found."`, `"Navigation"`                                                                                                                       |
| `layout/sidebar/SidebarLayout.tsx`                                    | `"Expand sidebar"` / `"Collapse sidebar"` aria labels                                                                                                                                                                            |
| `theme/theme-switcher/*`                                              | `"Theme settings"`, `"Customize theme"`, `"Open appearance settings"`, the section labels (`"Mode"`, `"Appearance"`, `"Color"`, `"Background"`, `"Layout"`, `"Depth"`, …), and the axis values `"Light"` / `"Dark"` / `"System"` |
| `errors/*`                                                            | `"Page not found"`, `"Server error"`, `"Something went wrong"`, `"An unexpected error occurred."`, `"Under maintenance"`                                                                                                         |

`SkipLink` is the one component that already got this right — it accepts
`children` with `"Skip to content"` as the default. The gap is that
`SidebarLayout` renders `<SkipLink />` internally with no way to pass through.
That pattern generalises badly anyway: threading a prop per string through
`SidebarLayout` → `LayoutHeader` → `UserMenu` would add a dozen props to the
layout surface for strings the layout has no opinion about.

### The stylesheet imports Google Fonts unconditionally

`packages/ui/dist/styles.css` line 8 carries
`@import url("https://fonts.googleapis.com/css2?family=Orbitron…")`, produced
because `scripts/build-css.ts` inlines only relative `@import`s and passes
absolute URLs through verbatim. Orbitron is used solely by the Sci-fi preset.

Consequences for consumers: an outbound request to a third party on every page
load, a render-blocking request that fails slowly on isolated networks, and a
privacy footprint that some deployments cannot accept. The first app to hit
this handles Vietnamese health-insurance claim data on a network where Google
is not reachable.

## Design

### A labels context, not per-component props

New entry point `darkraise-ui/labels` exporting three things:

```ts
export interface UiLabels {
  /* grouped by area — see below */
}
export const defaultLabels: UiLabels // today's English, verbatim
export function UiLabelsProvider(props: {
  value: DeepPartial<UiLabels>
  children: ReactNode
}): ReactElement
export function useUiLabels(): UiLabels // merged; usable with no provider
```

Components call `useUiLabels()` and read the group they need. With no provider
mounted the hook returns `defaultLabels`, so every existing consumer is
unaffected and no component needs a provider to render.

The provider takes a deep partial and merges it over `defaultLabels` once, in a
`useMemo` keyed on the incoming object, so an app overriding three strings
writes three strings. Nested providers merge over the nearest ancestor's merged
result rather than over `defaultLabels`, which lets a subtree override a
subset.

Context is the right shape here because the components that own these strings
are mounted _internally_ by layouts and by `DataTable`. A prop-based API would
have to be threaded through components whose responsibility is layout, not
copy. Where an explicit prop already exists — `searchPlaceholder` on
`DataTableToolbar`, `children` on `SkipLink` — it keeps working and wins over
the context value, since it is the more specific instruction.

### Label shape

Grouped by component area, with functions for anything interpolated:

```ts
interface UiLabels {
  dataTable: {
    search: string
    reset: string
    columns: string
    toggleColumns: string
    empty: string
    rowsPerPage: string
    pageInfo: (page: number, pageCount: number) => string
    rowsSelected: (selected: number, total: number) => string
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
  userMenu: { profile: string; settings: string; logout: string }
  theme: {
    title: string
    triggerLabel: string
    sections: Record<ThemeSectionKey, string>
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
    backHome: string
    retry: string
  }
}
```

Interpolated strings are functions rather than templates with placeholder
tokens. This keeps the kit out of the formatting business entirely: a language
that orders the operands differently, or needs a plural form, expresses that in
its own function body. `pageInfo: (p, n) => \`Trang ${p} / ${n}\`` is the whole
of the Vietnamese implementation.

`ThemeSectionKey` is the existing union already used by
`useThemeSettingsSections`; reusing it means adding a theme axis in a later
version is a compile error in `defaultLabels` rather than a silently untranslated
section.

Theme _preset_ names (Brutalist, Playful, Glow, Sci-fi) are deliberately
excluded — they are product names for the presets, not UI copy.

### Font import

`scripts/build-css.ts` stops emitting the absolute `@import` into the top of
the bundle. The Orbitron face moves behind the preset that uses it, loaded only
when that preset is active, via a `@font-face` whose `src` is applied under the
Sci-fi preset selector. Apps that never enable Sci-fi make no outbound request.

If scoping the load proves impossible without a runtime hook, the fallback is
to drop the import entirely and document that Sci-fi requires the consumer to
provide Orbitron. That degrades one preset's typography rather than imposing a
third-party request on every consumer, which is the correct trade.

## Testing

Unit tests per component group, asserting: the default English renders with no
provider; a partial override changes only the overridden string; nested
providers merge; and the existing `searchPlaceholder` / `SkipLink` `children`
props still beat the context value.

A merge test covers the deep-partial behaviour directly, including that
overriding one key in `dataTable` leaves the sibling keys at their defaults.

The existing `ThemeSwitcher` unit and e2e suites are the regression net for the
theme section — they assert on English text today and must keep passing
untouched, which is the clearest proof the change is additive.

For the stylesheet: a build-output assertion that `dist/styles.css` contains no
`@import url("http` — cheap, and it prevents the next absolute import from
silently reappearing.

## Compatibility

Additive and backwards-compatible; no existing prop changes meaning and no
default string changes. Ships as a minor, 4.1.0.

## Out of scope

- A locale/language mechanism inside the kit. The kit takes strings; it does
  not know what a locale is, does not ship translations, and does not pick one.
  Consumers already own that decision.
- Date, number, and currency formatting, which already delegate to `Intl`.
- RTL layout support.
- Translating Storybook stories or the template app's demo copy.
