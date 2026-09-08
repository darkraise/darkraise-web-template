# UI package, demo review, and multilingual design

Date: 2026-09-08. Reviewed revision: `874874f`.
Status: defect remediation and the multilingual implementation are complete
locally; release remains pending.

## Multilingual implementation — 2026-09-08

- Core: controlled locale/message providers, English and Vietnamese packs,
  regional fallback, partial consumer overrides, custom language registration,
  shared formatting, and portal language/direction. Existing `UiLabels` objects
  and no-provider consumers remain supported.
- Optional app integration: isolated or supplied i18next instances, shared UI/app
  switching, explicit storage/document synchronization, preload failure handling,
  queued changes, and a controlled LocaleSwitcher.
- Demo: shared language preferences, reactive navigation/forms/tables/errors,
  localized dates/numbers, retained edit/filter state, and 615 showcase heading
  and description keys. Technical API names and illustrative data remain source
  content. Showcase catalogs load before rendering in separate chunks.
- Starter: opt-in `--multilingual` setup with application-specific persistence
  keys. Optional engines are installed only when this option is selected.
- Consumer integration: `notificationSlot` supports the built-in bell by default,
  `null` to omit it, or a React node to replace it in every layout.

Additional verification caught and corrected consumer preset labels being
translated accidentally, timeline rail months ignoring locale, provider number
defaults not reaching NumberInput, incomplete app sentence translations, and
stale Calendar/ImageEditor showcase descriptions. The shared showcase copy button
now uses the package Clipboard component, including failure handling and cleanup.

Maintained packs cover left-to-right English and Vietnamese. Portal direction
propagation is tested for both directions; a complete right-to-left layout and
keyboard release is outside this delivery. The entire browser/theme matrix and
remote CI have not been run. Local validation results are recorded in the plan.

Final local validation passed: 2,993 UI tests, 28 demo tests, 65 Chromium
integration tests, fresh production builds, recursive typechecking, and lint.
Both generated starter modes build from the packed artifact; core server
rendering and exported consumer types pass without optional translation engines.
The local preview is `dist/previews/2026-09-08-multilingual/darkraise-ui-6.8.2.tgz`.

## Defect remediation — 2026-09-08

R1–R7 and R10–R16 have corrective changes and regression coverage where applicable.
R8 and R9 now have shared multilingual infrastructure and a functional language
control. Other simulated settings remain clearly identified as demo behavior.

Browser verification also exposed virtual rows growing beyond their configured
height when cells wrapped. Virtual cells now preserve that fixed height, and a
browser regression checks long content, the final row, and filtering after scroll.

The findings and initial validation below describe the reviewed revision before
these fixes. Final remediation validation is recorded separately below.

Initial defect-only validation, before the multilingual implementation:

- Fresh UI and demo production builds passed.
- Full unit suites passed: 2,956 UI tests and 26 demo tests.
- Chromium suites `01-auth`, `06-overlays`, `08-data-display`, and
  `11-review-regressions` passed: 60 tests, including real virtual-table geometry.
- Typechecking and lint passed without lint warnings.
- The demo build still reports its existing large icon-chunk warning. Test
  output includes Node storage warnings and a jsdom navigation limitation.
- The full browser matrix, packed-package consumer check, and remote CI execution
  were not run. No release was published.

## Assessment and evidence

Extend the existing `darkraise-ui/labels` foundation. It already provides English defaults, function-valued messages, partial overrides, and nested providers. The missing capabilities are maintained translations, shared locale and formatting, complete component coverage, and optional application translation infrastructure.

The requested scope includes UI translations **and optional application infrastructure**, confirmed during this review. English and Vietnamese are proposed initial languages. Consumer applications should supply their business copy and configuration, without copying the UI dictionaries or rebuilding locale management.

The earlier `docs/specs/2026-08-13-component-label-overrides-design.md` explicitly excluded locales, shipped translations, formatting, right-to-left support, and demo translation. This proposal expands that boundary; those omissions were deliberate in the earlier design.

Validation performed:

- UI: 194 test files, 2,938 tests passed with `pnpm --filter darkraise-ui test --maxWorkers=2`.
- Demo: four test files, 13 tests passed with `pnpm --filter darkraise-web-template test --maxWorkers=2`.
- `pnpm -r typecheck` passed.
- `pnpm lint` passed with two warnings: `Tour.tsx:88` omits `reducedMotion` from effect dependencies; `labels/context.tsx:28` mixes a component and hook export for Fast Refresh.
- Small runtime probes used the actual number helpers, installed TanStack filter, and transpiled Button source to reproduce findings R1–R3.
- The initial UI test launch failed with Vite `spawn EPERM` inside the sandbox. The same command passed outside it.
- A fresh production build, packed-package consumer build, visual browser review, and Playwright suite were not run. Demo checks resolved the existing `dist` artifacts. Passing unit tests therefore do not certify the published package or visual behavior.

This is a source and automated-test review of the main package/demo integration paths, not an exhaustive correctness audit of every component and hook.

## Findings

Paths below are relative to the repository root. P1 warrants the first corrective changes; P2 is a functional or accessibility defect; P3 is cleanup or a verification gap. Capability gaps are distinguished from defects.

### R1 — P1: number formatting and parsing disagree

`packages/ui/src/components/number-input/useNumberInput.ts:59,113,131` derives locale separators even when display formatting falls back to `value.toString()`. With `locale="de-DE"` and no `formatOptions`, `1.5` displays as `1.5`, but parsing that display produces `15`. The same source probe could not round-trip Arabic digits (`١٬٢٣٤٫٥`) or negative accounting currency (`($12.00)`). This can change or discard user-entered values. Share a formatting/parsing contract and test actual editing and blur, not just display text.

### R2 — P1: facet filtering matches substrings and crashes on scalar values

`packages/ui/src/data-table/components/data-table/DataTable.tsx:81` assigns TanStack's `arrIncludesSome` to scalar columns. Its `.includes()` call makes selecting `active` also match `inactive`; numeric and boolean values throw. `DataTableFacet.tsx:29` also turns every selected value into a string. Preserve raw values and use exact membership for scalar facets. Existing tests use non-overlapping strings, so they miss both failures.

### R3 — P2: loading does not always disable a button

`packages/ui/src/components/button/Button.tsx:60` uses `disabled ?? loading`. `<Button loading disabled={false}>` renders an enabled native button; a source rendering probe confirmed there is no `disabled` attribute. This contradicts the loading contract and permits repeated actions. Under `asChild`, only `aria-disabled` is supplied; activation remains possible for an anchor. Cover native buttons and slotted interactive children separately.

### R4 — P2: date constraints only protect calendar selection

`packages/ui/src/components/date-picker/DatePicker.tsx:343,599` commits parsed input and preset values without checking root `min`/`max`. Those bounds are applied only to the calendar's disabled matcher. A consumer supplying `parse` can accept a date that the calendar forbids; presets have the same inconsistency. Apply root constraints to every user-driven commit path, including range presets. Component-specific calendar matchers need an explicitly documented scope.

### R5 — P2: data-table pagination has unnamed controls

`packages/ui/src/data-table/components/data-table-pagination/DataTablePagination.tsx:50,70` renders four icon-only navigation buttons whose icons are hidden from assistive technology, with no text alternative. The page-size trigger is not associated with the adjacent “Rows per page” paragraph. Add translated accessible names and an actual label association. Empty data also renders “Page 1 of 0” at line 64; define a consistent empty-page display.

### R6 — P2: virtualized tables can lose their visible rows after filtering

`packages/ui/src/data-table/components/data-table/DataTable.tsx:108` retains the old scroll offset when filtering or replacing data. With a scroll offset near row 1,000 and a result set of two rows, `first` exceeds `last`, the window is empty, and the top spacer remains large. Clamp the window and reconcile the DOM scroll offset after row-model changes. At line 134, the declared total excludes header rows while row indices include them; the final row can have an index greater than the total. Multiple header groups also all receive index 1. The current row-count test encodes the incorrect total and should be corrected.

### R7 — P2: an explicit undefined override removes label fallbacks

`packages/ui/src/labels/mergeLabels.ts:8` spreads overrides directly. A valid optional override such as `{ dataTable: { pageInfo: undefined } }` replaces the function with `undefined`; pagination then calls it. Ignore undefined leaves while preserving empty strings and whole-function replacement. Preserve current nested-provider behavior.

### R8 — capability gap: translations and formatting are fragmented

`packages/ui/src/labels/types.ts` covers only eight areas. Hardcoded defaults remain in pagination, overlays, notifications, layout switching, comboboxes, number/date/time inputs, upload controls, toasts, image editing, timelines, tours, and other components. `theme-switcher/useThemeSettingsSections.tsx` translates headings but still has English option labels, including “Solid,” “Gradient,” and sidebar indicator choices. ImageCropper has a separate `translations` contract.

`DatePicker.tsx:101` formats through English month tables in `lib/date.ts`; passing a Vietnamese locale to `DatePickerCalendar` does not translate the selected input value. Calendar and NumberInput take independent locale props, while charts and timeline helpers use environment defaults. Calendar and Tabs default direction to `ltr`; there is no shared direction contract. Full multilingual support requires more than filling the existing labels object.

### R9 — demo gap: language and other preferences are local mock controls

`apps/template/src/routes/_authenticated/_settings/-preferences-section.tsx:61` stores language in local `useState`. Selecting a language neither translates the app nor persists after remounting. Landing page, page size, and autosave controls are similarly local. The language menu advertises six languages despite having no catalogs. Settings save handlers only delay and display success; these are demo interactions, not persistence. Make language functional in this project and clearly identify the remaining mock preferences.

### R10 — P2: the demo offers a layout it cannot render

`packages/ui/src/layout/layout-header/LayoutHeader.tsx:76` renders `<LayoutSwitcher />` with all four variants. `apps/template/src/routes/_authenticated.tsx:477` implements only sidebar, top navigation, and stacked. Selecting Split Panel persists `split-panel`, but the route falls through to SidebarLayout. Forward the switcher's existing `variants` option through the shell/header and configure the demo's three supported variants, or implement a real panel before offering the fourth.

### R11 — P2: settings save buttons do not subscribe to form state

`apps/template/src/routes/_authenticated/settings.tsx:137,251` reads `form.state.canSubmit` and `form.state.isSubmitting` directly. The installed `useForm` returns a getter, without subscribing the containing component to those fields. Button availability and “Saving…” text do not reliably update. The login form already demonstrates the appropriate `form.Subscribe` pattern. This concerns displayed state; the form library may still reject an invalid submission internally.

### R12 — P2: API client mishandles valid request options

`apps/template/src/lib/api-client.ts:24,35` spreads `HeadersInit` as an object, which does not preserve `Headers` instances and turns tuple arrays into numeric object properties. It also drops valid JSON bodies `false`, `0`, `""`, and `null` because it tests truthiness. Normalize through `new Headers(customHeaders)` and distinguish an omitted body from a supplied JSON value. Its unguarded storage read also aborts requests when browser storage is unavailable.

### R13 — P2: storage failure prevents auth state updates

`apps/template/src/features/auth/store.ts:35,41` guards reads but not writes/removals. A storage exception during logout occurs before clearing in-memory authentication. A failed write during login likewise prevents the state update. Test unavailable storage and preserve in-memory state transitions. Authentication is intentionally mocked; this finding does not imply the demo is a production authentication system.

### R14 — P3: repository gates miss demo behavior

The root `test` script filters `./packages/*`. `.github/workflows/release.yml:182` runs that script, so the demo's unit tests do not gate release. The only checked-in workflow triggers on main-branch/tag pushes and manual dispatch, not pull requests. Playwright is absent from it. Two browser tests silently skip when expected controls disappear (`06-overlays.spec.ts:202`, `08-data-display.spec.ts:73`). Add explicit demo gates and make disappearing required controls fail. Remote branch-protection settings were not inspected.

### R15 — P3: documentation and demo polish have drifted

The package description still claims 65 components, 38 hooks, and six theme axes, while the repository advertises a substantially expanded inventory. Both READMEs claim no runtime UI dependencies despite dependencies including Floating UI and TanStack Table. `apps/template/index.html:5` references `/vite.svg`, but the checked-in public asset is `logo.svg`. Correct the inventory and dependency wording and use a shipped favicon.

### R16 — P3: lint warnings remain

Resolve or explicitly justify the Tour effect dependency warning after checking whether an open tour should respond to a changed motion preference. Separate the labels hook/context from the provider export when expanding that module. These were warnings, not failing checks; neither was used as proof of a broader runtime defect.

## Proposed architecture

### Alternatives

1. **Recommended: library-owned locale packs and formatters, with an optional i18next integration.** Existing consumers retain the current labels API; applications get a maintained setup path when they want one.
2. Make i18next mandatory for every UI component. This provides one message engine but adds a runtime and lifecycle requirement to all consumers and risks interference with existing app instances.
3. Expand label overrides only. This is smaller but leaves consumers maintaining translations, synchronization, formatting, and persistence, so it does not meet the confirmed scope.

The optional integration should accept a supplied instance and create isolated instances only when requested. This is supported by [i18next's instance API](https://www.i18next.com/overview/api) and [react-i18next's provider model](https://react.i18next.com/latest/i18nextprovider), including component-library and server-rendering use cases.

### Core library contract

- Add `darkraise-ui/i18n`: `UiI18nProvider`, `useUiLocale`, `useUiFormatters`, and locale-definition types. Keep `darkraise-ui/labels` working.
- Add individually importable packs at `darkraise-ui/locales/en` and `darkraise-ui/locales/vi`. English is built in; other packs are explicitly registered. Do not import all packs from the root barrel.
- `UiI18nProvider` is controlled: the application supplies `locale`, registered locale definitions, and optional label/formatting overrides. It performs no storage or document mutation by default.
- Preserve the existing exported `UiLabels` type for consumers that construct complete objects. Introduce an expanded resolved message type rather than adding new required properties to that existing public interface. Existing provider values and `useUiLabels()` consumers remain valid.
- Resolve a canonical locale, then an exact registered pack, then its registered base language, then English. Keep the requested formatting locale separate from the fallback message language. Invalid locale input resolves to the documented English default rather than crashing render.
- Preserve the existing no-provider presentation. A mounted locale provider opts into coordinated locale formatting. Existing explicit `locale`, `dir`, `format`, `parse`, `placeholder`, `children`, `aria-label`, and component translation props take precedence.
- Within a locale boundary, precedence is component override, nearest `UiLabelsProvider` override, locale-provider override, locale-pack message, English default. Undefined is absent; empty strings are intentional. A nested explicit locale boundary starts from its own pack; a provider without a new locale inherits the current one.
- Core formatting uses `Intl` for numbers, dates, times, relative time, and plural selection. Currency is explicit; choosing Vietnamese must not convert USD amounts into VND. Timestamp time zones are explicit configuration, separate from calendar date values.
- Preserve DatePicker's current read-only behavior without `parse`. Do not introduce ambiguous free-text date parsing. DateInput can derive Gregorian segment order from locale when a provider is mounted, while explicit `format` wins. Locale switching preserves the selected date/value and uncommitted edits.
- Gregorian date arithmetic remains the supported Calendar model. Do not display another calendar system's years over Gregorian interaction logic merely because a locale extension requests it.
- Add direction metadata and inheritance through roots and portals. Initial supported packs are left-to-right. Full right-to-left support requires separate layout, keyboard, and portal verification before claiming support or shipping a right-to-left pack.

### Optional application infrastructure

Add a separate `darkraise-ui/i18n/react-i18next` entry with optional peer dependencies on `i18next` and `react-i18next`. Core imports, declarations, and bundles must not require these peers. Mark them external in the build.

Provide an asynchronous `createDarkraiseI18n(options)` factory and an `AppI18nProvider`. The factory accepts an initial locale, supported locales, application resources, and standard engine options; it awaits initialization and returns an isolated instance. Existing instances can be supplied directly to the provider without reinitialization. A reusable `LocaleSwitcher` remains a core controlled component with value, locale options, change callback, and pending/disabled props; it does not import the optional translation engine.

`AppI18nProvider` binds that instance to React and to `UiI18nProvider`; the engine is the single language owner. Consumers use normal `useTranslation` for their own namespaces. UI messages come from the package's locale packs, without a second set of copied app dictionaries.

Ship optional browser preference initialization and persistence with an application-specific storage key. Resolution is explicit initial locale, saved supported preference, supported browser preference, then English. Catch storage failures. Initialization occurs before client rendering; server-rendered consumers supply the same initial locale on server and client and enable browser detection only after hydration. No module-level singleton, browser access, or mutation of global Zod error configuration.

Document language/direction synchronization is an opt-in root concern. Multiple providers cannot silently compete for `<html>`. Portal roots receive the effective direction and language even when the locale provider is inside a subtree. Lazy resource initialization and failed language changes must not leave UI controls and business copy in different languages; test rapid repeated selection and unsubscribe on unmount.

### Demo integration and coverage

Use the optional app infrastructure in the demo with English and Vietnamese catalogs. Connect the existing settings selector and a shared LocaleSwitcher to the same instance. Show only languages with complete registered catalogs, using autonyms.

Translate app-owned navigation, headings, breadcrumbs, actions, validation errors, empty states, toast messages, and status display labels. Keep product/customer data, route paths, field IDs, enum values, and technical code examples stable. Build locale-dependent navigation, columns, and schemas in reactive functions so switching languages updates already-mounted screens without clearing forms or tables.

Cover authentication, dashboard, analytics, products and their detail/editor routes, categories, orders, customers, inbox, settings, and showcase surrounding copy. Code identifiers and component product names remain technical names; they are not untranslated business UI. Locale/date-format switches preserve data and do not reinterpret currency.

Place the root locale provider high enough to cover route errors and loading states as well as normal pages. The current provider composition lives inside the root route; split router-dependent adapters from global locale setup where necessary.

### Consumer adoption and release

The CLI constructs starter source in `create-app/bin/create.mjs`; it does not copy the demo. Add an explicit multilingual scaffold option that imports the new helpers, creates only app-owned catalogs/configuration, and includes optional peers only when selected. Updating the demo alone would leave new consumers repeating setup.

Release defect fixes independently where possible, then the additive internationalization API, optional integration, and demo/scaffold adoption. Check declaration compatibility with existing labels consumers before choosing a minor release. Do not change old default formatting or require new fields on existing public types in a minor release.

Acceptance requires no-provider compatibility, complete English/Vietnamese pack parity, nested overrides, region fallback, plural cases, locale changes while editing, storage denial, server/client initialization consistency, portal language propagation, optional-peer isolation, and a clean consumer build from a packed artifact.
