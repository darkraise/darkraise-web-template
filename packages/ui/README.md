# darkraise-ui

React 19 UI kit with themed components, reusable hooks, configurable themes,
and layout variants, styled with Tailwind CSS 4. Primitives are implemented
in-house, with Floating UI for positioning and TanStack Table for table behavior.
The package does not depend on Radix UI.

## Accessibility

The kit does the parts a component library can do on its own, and names the
parts it cannot.

**Handled for you.** Dialog, AlertDialog, Sheet and Drawer trap focus, restore
it on close, lock page scroll and wire `aria-modal` / `aria-labelledby`.
Slider implements the full ARIA slider pattern including Home, End and
PageUp/PageDown. Progress, Spinner and the toast stack carry correct live-region
semantics. Menus, selects, comboboxes and the command palette draw a real focus
ring rather than relying on a background tint. Every pointer target clears the
WCAG 2.2 minimum of 24x24 CSS px, small controls via a transparent hit area that
leaves their visual size alone. Colour contrast is computed rather than eyeballed
— muted text targets 7:1, and focus, primary and status colours are unit-tested
at 3:1 or better across every accent in both modes.

**Motion.** A single guard in `theme.css` neutralises animation and transition
duration under `prefers-reduced-motion`. Motion that CSS cannot reach — smooth
scrolling, Carousel autoplay — reads the preference through the exported
`useReducedMotion` hook.

**Your part.**

- `<ChartContainer description="...">` — a chart is a picture of data with no
  text alternative of its own, and recharts exposes values only on hover. Write
  the insight, not the chart type. `loading` and `empty` replace the axis frame
  recharts would otherwise draw over an empty dataset.
- `<CarouselAutoplayToggle />` — autoplay pauses on hover, focus, a hidden tab
  and reduced motion, but WCAG 2.2.2 asks for a control the reader can operate.
  Place one whenever you pass `autoplay`. It renders nothing when you do not.
- `<FormErrorSummary errors={...} submitCount={...} />` — inline field errors
  stay where they are; this focuses a linked summary after a failed submit.
- `required` on a field marks the label and sets `aria-required` on the control.
- Router adapters must put `aria-current="page"` on the active link. Routers
  that do this themselves (TanStack Router among them) satisfy it as long as
  your adapter spreads its remaining props onto the anchor.
- `<Button loading>` disables the button, marks it `aria-busy` and shows a
  spinner. Under `asChild` the spinner is not injected — Slot renders a single
  child — but the semantics still apply.
- Layouts move focus to `<main id="main-content">` after a route change. Use
  `useRouteFocus` directly if you compose your own layout.

## Layout choices and virtual tables

Layout shells accept `layoutVariants` to limit the header switcher to variants
the application renders, for example `["sidebar", "top-nav", "stacked"]`.
Omitting it retains all four variants.

Virtualized `DataTable` rows use the configured `rowHeight` as a fixed height.
Cell content is clipped to preserve scroll geometry. Choose a height that fits
your content, or use pagination when rows need variable heights.

## Dialog sizing and overflow

`DialogContent` caps its height at the viewport and scrolls internally.
Rendering a `<DialogBody>` switches to a pinned layout where the header and
footer hold still and only the body scrolls. `size` takes `sm | default | lg |
xl | full`; `default` is the historical width.

## Translating component text

Components render English by default. To supply your own strings, mount
`UiLabelsProvider` anywhere above them and override only the keys you need:

```tsx
import { UiLabelsProvider } from "darkraise-ui/labels"

const labels = {
  dataTable: { rowsPerPage: "Số dòng mỗi trang", pageInfo: (p, n) => `Trang ${p}/${n}` },
  userMenu: { logout: "Đăng xuất" },
}

<UiLabelsProvider value={labels}>
  <App />
</UiLabelsProvider>
```

Interpolated labels are functions, so a language that orders the operands
differently or needs a plural form expresses that in its own function body.
Nested providers merge over the nearest ancestor, so a subtree can override a
subset. Components render correctly with no provider mounted.

Undefined overrides preserve inherited defaults; empty strings intentionally
replace them. Pagination navigation names can be overridden through
`dataTable.firstPage`, `previousPage`, `nextPage`, and `lastPage`.

For maintained English and Vietnamese translations and coordinated formatting,
use the controlled locale provider. English is built in; other packs are imported
explicitly and do not enter a core-only bundle:

```tsx
import { UiI18nProvider } from "darkraise-ui/i18n"
import { vi } from "darkraise-ui/locales/vi"

;<UiI18nProvider
  locale="vi-VN"
  locales={[vi]}
  labels={{ userMenu: { logout: "Thoát" } }}
>
  <App />
</UiI18nProvider>
```

Consumers can register any language with a partial message catalog. Missing keys
fall back to English. `UiLocaleDefinition` checks the keys and function signatures:

```tsx
import type { UiLocaleDefinition } from "darkraise-ui/i18n"

const fr = {
  locale: "fr", label: "Français", dir: "ltr",
  messages: { dataTable: { empty: "Aucun résultat" } },
} satisfies UiLocaleDefinition

<UiI18nProvider locale="fr-CA" locales={[fr]}><App /></UiI18nProvider>
```

Message precedence is explicit component props, nearest `UiLabelsProvider`,
locale-provider labels, registered pack, then English. An explicit nested locale
starts a new message boundary; omitting `locale` inherits its parent's messages.
Regional requests use the exact registered pack, then its base language, then
English. Formatting retains the requested valid locale even when messages fall
back; invalid locale strings fall back to `en`.

`useUiLocale()` exposes `locale`, `messageLocale`, `dir`, and whether a provider
is mounted. `useUiFormatters()` supplies `number`, `date`, `calendarDate`, `time`,
`relativeTime`, and `plural`. Explicit component formatting wins. Currency remains
explicit and is never converted. `formats.timeZone` applies to timestamps;
`calendarDate` and calendar interactions use local Gregorian dates. DatePicker
still needs a consumer `parse` function for editable input. NumberInput keeps its
draft's original parsing convention when the language changes during editing.

Core providers perform no storage or document mutation. Portal content receives
the active `lang` and `dir`. The maintained packs are left-to-right; complete
right-to-left layout and keyboard support is not promised.

### Optional application translations

Install `i18next` and `react-i18next` only when using the adapter entry. Core UI
imports and their declarations do not require them.

```tsx
import { AppI18nProvider, createDarkraiseI18n, resolveBrowserLocale }
  from "darkraise-ui/i18n/react-i18next"
import { en } from "darkraise-ui/locales/en"
import { vi } from "darkraise-ui/locales/vi"

const locales = [en, vi]
const storageKey = "my-app.language"
const instance = await createDarkraiseI18n({
  locale: resolveBrowserLocale({ locales, storageKey }),
  locales,
  resources: {
    en: { translation: { welcome: "Welcome" } },
    vi: { translation: { welcome: "Chào mừng" } },
  },
})

<AppI18nProvider instance={instance} locales={locales} storageKey={storageKey}
  syncDocument><App /></AppI18nProvider>
```

Use normal `useTranslation()` hooks and i18next resource typing for app namespaces.
The factory returns an isolated initialized instance. A supplied initialized
instance also works; the provider does not reinitialize it. `changeAppLanguage`
loads resources before changing language and serializes repeated requests.
Handle its rejected promise and keep the switcher pending until it settles.

`LocaleSwitcher` from `darkraise-ui/components/locale-switcher` is controlled via
`value`, `options` (`{ locale, label }`), and `onValueChange`; `pending` and
`disabled` prevent activation. It works without the optional adapter.

Each `LocaleSwitcherOption` also accepts an optional decorative `icon`, rendered
beside its label in both the trigger and dropdown. Supply any React node for
additional languages; no component changes or country registration are needed:

```tsx
import {
  LocaleSwitcher, UnitedStatesFlagIcon, VietnamFlagIcon,
  type LocaleSwitcherOption,
} from "darkraise-ui/components/locale-switcher"

const options = [
  { locale: "en", label: "English", icon: <UnitedStatesFlagIcon /> },
  { locale: "vi", label: "Tiếng Việt", icon: <VietnamFlagIcon /> },
  { locale: "fr", label: "Français", icon: <img src="/flags/fr.svg" alt="" /> },
] satisfies LocaleSwitcherOption[]

<LocaleSwitcher value={locale} options={options} onValueChange={setLocale} />
```

The application chooses which flag represents each language. Register its message
pack separately with the locale provider. Options without an icon stay text-only;
icons should contain no interactive elements.

Browser preference resolution is explicit initial locale, saved supported
preference, browser preference, then English (or the first configured language
when English is unavailable). Storage failures are tolerated. Use an application
specific storage key. Document synchronization is opt-in and has one owner per
document. For server rendering, initialize an instance per request and supply the
same locale on server and client; defer browser detection until after hydration.

Existing `UiLabelsProvider` consumers need no changes. To migrate, place the
locale provider outside existing label providers and keep their overrides.

Common control wording is available through `labels.controls`, for example
`labels={{ controls: { Loading: "Please wait" } }}`. Consumer-provided preset
labels and explicit component content retain their original wording.

`Calendar`'s `locale` prop covers only the strings `Intl` produces — weekday
names, month names, the day cell's accessible name. Its navigation chrome
(`previousMonth`, `nextMonth`, `chooseMonth`, `chooseYear`, the year and decade
arrows, the week-number header and the two view-switch captions) comes from
`labels.calendar`, and `DatePicker`'s trigger and preset group from
`labels.datePicker`, so a translated calendar needs both:

```tsx
<UiLabelsProvider
  value={{
    calendar: { previousMonth: "Tháng trước", nextMonth: "Tháng sau" },
    datePicker: { trigger: "Mở lịch" },
  }}
>
  <Calendar locale="vi-VN" />
</UiLabelsProvider>
```

An explicit `aria-label` on `DatePickerTrigger` or `DatePickerPresets` still
wins over the provider.

`theme.axisLabels.presetAxes` is a reserved key with no current effect —
translating it will not change anything rendered today; it is kept so that a
future wiring stays backward-compatible for anyone already providing a
complete `UiLabels`.

## Shell styles

All four layouts accept `notificationSlot`. Omit it for the default bell, pass
`null` to hide notifications, or pass a React node for your own notification
control. `headerSlot` remains available for other header content.

Every app shell structure — `SidebarLayout`, `TopNavLayout`, `StackedLayout`
and `SplitPanelLayout` — is laid out on one CSS grid whose regions carry
`data-region`. The `shellStyle` theme axis repaints those regions without
changing which structure is in use:

| Style      | Treatment                                                               |
| ---------- | ----------------------------------------------------------------------- |
| `classic`  | Regions welded, hairline rules, no gutter. The default.                 |
| `inset`    | Chrome stays welded; only the content area detaches as a rounded panel. |
| `island`   | Every region is a detached card on the app ground.                      |
| `floating` | Content runs full-bleed; chrome hovers over it with blur.               |
| `framed`   | The whole shell insets from the viewport as a window.                   |
| `flat`     | No rules; regions separated by background tone alone.                   |

Set it globally through `themeConfig.defaults.shellStyle` or
`useTheme().setShellStyle`, or pin one shell with the prop:

```tsx
<SidebarLayout nav={nav} shellStyle="island">
  <Outlet />
</SidebarLayout>
```

A layout resolves `prop ?? theme value` and stamps the result on its own root,
so a pinned shell ignores the axis without any CSS specificity fight.

## Sidebar indicator

`sidebarActiveBar` is a theme axis with four values. `default` leaves each
preset's own indicator alone (glass draws a ring and a rail, sci-fi a ring,
everything else a rail); `bar`, `ring` and `both` force one look everywhere.
It appears in the theme panel as **Sidebar Indicator**, with `default`
labelled "Auto".

`SidebarLayout` resolves it most-specific-first: the `activeBar` prop pins it,
otherwise the header toggle's value once someone has used it, otherwise the
theme axis.

```tsx
// Follows the axis:
<SidebarLayout nav={nav} />

// Pins one sidebar, ignoring the axis:
<SidebarLayout nav={nav} activeBar="ring" />
```

## Server rendering the layout variant

`useLayoutStore` reads `localStorage` when the module initialises. In a
browser-only app the first render is already correct. Under SSR the server has
no `localStorage`, so it returns the default `sidebar` and the client swaps
after hydration. If you server-render, read the persisted variant in your
document template and hand it to `useLayoutStore.setState` before the app
mounts, the way the scaffolder's inline theme script does for theme axes.

## Sci-fi preset font

Orbitron is no longer fetched or bundled. The Sci-fi preset renders it only
when the host system or the consuming app already provides the font;
otherwise it falls through to the rest of the stack (Rajdhani and the
generic families after it). This removes a third-party network request from
every page load of every consuming app. An app that wants Sci-fi's intended
typography must supply Orbitron itself.

## Migrating to 2.0.0

Component DOM now carries `dr-*` classes plus `data-variant` /
`data-size` / state `data-*` attributes. Consumers using
`cn(buttonVariants({ variant, size }), extra)` rewrite as either:

- `<Button variant={...} size={...} className={extra} />`, or
- on a non-button element: `className={cn("dr-btn", extra)}` plus
  `data-variant={...}` and `data-size={...}` attributes directly.

`class-variance-authority` is no longer a dependency of this package.
Consumers that imported it transitively must depend on it directly.
