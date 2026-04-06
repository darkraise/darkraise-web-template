# Phase 1 — Component Showcase Expansion Design

Enrich the existing component library showcase with real-world composition recipes, custom variant extensions, and new demo pages that cover gaps in the current 21-page, 78-example library.

## Context

This is Phase 1 of a three-phase expansion of the demo app:

1. **Phase 1 (this spec):** Component Showcase Expansion — compositions, customization patterns, new pages
2. **Phase 2:** E-Commerce Use-Case Pages — reviews, coupons, inventory, user profile, shipping, refunds
3. **Phase 3:** UI Pattern Use-Case Pages — kanban, calendar, file manager, notification center, wizard, pricing, activity timeline, empty/error states

Phase 1 establishes the building blocks that later phases draw from.

## Goals

- Show how primitives combine in realistic contexts, not just in isolation
- Teach the CVA/Tailwind customization pattern so template users can extend components themselves
- Cover the toast/feedback primitives that are installed (Sonner) but not demonstrated
- Maintain the existing `ShowcaseExample` pattern with live preview and copyable code snippets

## Non-Goals

- No new UI primitives added to `src/core/components/ui/` (only new showcase examples)
- No changes to existing component APIs — the customization page demonstrates extension patterns using self-contained inline component copies within the showcase page, not by modifying the base components in `core/components/ui/`
- No demo data or store changes (that belongs to Phases 2–3)
- The recipes page includes small empty/error state snippets as composition examples; the full dedicated Empty & Error States page with illustrations and complete coverage is part of Phase 3

## Architecture

All changes live in `src/routes/_authenticated/components/`. Each existing page gains new `ShowcaseExample` blocks appended after the current examples. Three new route files are added for the new pages. The sidebar nav in `src/routes/_authenticated.tsx` gains three entries under the Components group.

### File Changes

**Modified files (existing pages gaining new examples):**

| File                           | New examples added                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `components/buttons.tsx`       | Button group, Split button, Icon toolbar, Toggle button bar                                |
| `components/cards.tsx`         | Stat summary card, Media card, User profile card, Notification card                        |
| `components/badges.tsx`        | Closable badge, Animated pulse dot, Badge list (tag cloud), Badge in table cell            |
| `components/dialogs.tsx`       | Multi-step dialog, Confirmation with form, Full-screen dialog, Sheet with validation       |
| `components/inputs.tsx`        | Prefix/suffix input, Clearable input, Password visibility toggle, Character count textarea |
| `components/tabs.tsx`          | Tabs with icons and count badges, Vertical tabs, Tabs with per-tab actions                 |
| `components/accordion.tsx`     | Accordion with icons and badges, Nested accordion, Settings-style with controls            |
| `components/dropdown-menu.tsx` | Context menu, Dropdown with search, Avatar-trigger dropdown                                |
| `components/avatar.tsx`        | Online status dot, Group with "+N" overflow, Avatar with tooltip                           |
| `components/form-fields.tsx`   | Conditional fields, Inline edit, Dependent selects                                         |
| `components/data-table.tsx`    | Expandable row detail, Bulk actions toolbar, Faceted filters                               |
| `components/charts.tsx`        | Period toggle (7d/30d/90d), Loading skeleton, Empty state                                  |
| `components/dashboard.tsx`     | Metric comparison, Compact stat row, Grid layout variations                                |
| `components/skeleton.tsx`      | Data-table skeleton, Dashboard skeleton                                                    |
| `components/command.tsx`       | Recent searches, Async search results                                                      |

**New files:**

| File                           | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `components/customization.tsx` | CVA extension patterns — teaching variant customization |
| `components/recipes.tsx`       | Cross-component composition recipes                     |
| `components/feedback.tsx`      | Toast (Sonner) and inline alert/banner demos            |

**Pages not modified** (already well-covered): `table.tsx` (10 examples), `typography.tsx` (6), `colors.tsx` (5), `separator.tsx` (4), `scroll-area.tsx` (3).

### Nav Changes

Three new entries in `src/routes/_authenticated.tsx` under the Components group:

```
{ label: "Customization", href: "/components/customization", icon: Wrench }
{ label: "Recipes", href: "/components/recipes", icon: CookingPot }
{ label: "Feedback", href: "/components/feedback", icon: MessageSquare }
```

Also update the component index page (`components/index.tsx`) with cards for the three new pages.

---

## Detailed Page Designs

### Enriched Existing Pages

Each new example follows the existing `ShowcaseExample` component pattern: a title, a live rendered demo, and a collapsible code snippet. New examples are appended after the current examples on each page.

#### buttons.tsx — 4 new examples

**Button group:** A row of related buttons with shared border radius (first button gets left radius, last gets right radius, middle buttons have none). Shows a "View" mode selector: List | Grid | Board.

**Split button:** Primary action button paired with a small dropdown trigger button sharing the same visual container. The dropdown shows alternative actions. Example: "Save" primary with dropdown for "Save as Draft" and "Save & Publish."

**Icon toolbar:** A horizontal row of icon-only buttons grouped together with separator dividers between logical groups. Example: text formatting toolbar (Bold, Italic, Underline | Align Left, Center, Right | Undo, Redo).

**Toggle button bar:** Mutually exclusive selection across 3-4 options using buttons styled to indicate the active choice. Example: time range selector (1D | 1W | 1M | 1Y) with the active option highlighted.

#### cards.tsx — 4 new examples

**Stat summary card:** Card containing a label, large numeric value, trend indicator (green up / red down arrow with percentage), and a small sparkline area. Composed of Card + badge for trend + inline SVG sparkline.

**Media card:** Card with an image at the top (using a placeholder gradient), title, description, and a footer with actions. Demonstrates image-first card layout.

**User profile card:** Avatar centered at top, name, role/title, short bio, and a row of action buttons (Message, Follow). Shows centered card composition.

**Notification card:** Horizontal layout with icon on the left, message text with timestamp, and a dismiss button on the right. Shows a compact, actionable card variant.

#### badges.tsx — 4 new examples

**Closable badge:** Badge with a small "x" button that removes it. Shows interactive badge pattern for tag management.

**Animated pulse dot:** A small dot badge with a CSS pulse animation, used for "live" or "new" indicators. Pure CSS animation using Tailwind's `animate-pulse`.

**Badge list (tag cloud):** A flex-wrap container of badges representing tags or skills, demonstrating multi-badge layout with mixed variants.

**Badge in table context:** A mini table (3-4 rows) where one column uses badges for status values, showing how badges integrate with tabular data.

#### dialogs.tsx — 4 new examples

**Multi-step dialog:** A dialog with step indicator (Step 1 of 3), content area that changes per step, and Back/Next navigation buttons. Demonstrates wizard-in-modal pattern with local state.

**Confirmation with inline form:** Destructive confirmation dialog that requires the user to type the item name to confirm deletion. Shows form validation inside a dialog.

**Full-screen dialog:** A dialog that takes the full viewport on mobile but remains a standard modal on desktop. Demonstrates responsive dialog sizing.

**Sheet with form + validation:** A right-side Sheet containing a form with multiple fields and Zod validation, demonstrating the common "edit panel" pattern.

#### inputs.tsx — 4 new examples

**Prefix/suffix input:** Input with a fixed prefix label (e.g., "https://") or suffix (e.g., ".com"), and a currency input with "$" prefix and ".00" suffix.

**Clearable input:** Text input with an "x" clear button that appears when the field has content.

**Password visibility toggle:** Password input with an eye icon button that toggles between masked and visible text.

**Character count textarea:** Textarea with a character counter below showing "42 / 280" that changes color as the limit approaches.

#### tabs.tsx — 3 new examples

**Tabs with icons and count badges:** Each tab trigger has an icon and a small numeric badge showing item count. Example: Inbox (12) | Drafts (3) | Sent.

**Vertical tabs:** Tabs rendered vertically on the left with content on the right, demonstrating the vertical orientation for settings-style layouts.

**Tabs with per-tab actions:** Each tab panel has its own action button in the top-right corner. Example: a "Users" tab with an "Add User" button, a "Roles" tab with a "Create Role" button.

#### accordion.tsx — 3 new examples

**Accordion with icons and badges:** Each accordion trigger has a leading icon and a trailing badge. Example: FAQ categories with question counts.

**Nested accordion:** An accordion item whose content contains another accordion, demonstrating hierarchical collapsible sections.

**Settings-style accordion:** Each accordion panel contains form controls (switches, selects) rather than just text. Example: "Notification Settings" panel with toggles inside.

#### dropdown-menu.tsx — 3 new examples

**Context menu:** A bordered area that shows a DropdownMenu on right-click (using Radix's ContextMenu trigger pattern), demonstrating the right-click menu pattern.

**Dropdown with search:** A dropdown menu with a search/filter input at the top that narrows the visible items as you type.

**Avatar-trigger dropdown:** The user menu pattern — an avatar button that opens a dropdown with profile info, settings link, and sign-out action.

#### avatar.tsx — 3 new examples

**Online status dot:** Avatar with a small absolute-positioned dot in the corner (green for online, yellow for away, gray for offline).

**Group with "+N" overflow:** A row of overlapping avatars (negative margin) with a final circle showing "+5 more." Demonstrates the common team member display pattern.

**Avatar with tooltip:** Avatar that shows the user's full name and role on hover via Tooltip.

#### form-fields.tsx — 3 new examples

**Conditional fields:** A select field ("Account Type": Personal / Business) that shows/hides additional fields (Company Name, Tax ID) based on the selection. Demonstrates dynamic form layout.

**Inline edit:** A display value that, when clicked, transforms into an editable input with Save/Cancel buttons. Demonstrates the click-to-edit pattern.

**Dependent selects:** Two linked select fields where the second's options depend on the first's value (Country → City). Demonstrates cascading field dependencies.

#### data-table.tsx — 3 new examples

**Expandable row detail:** A table where clicking a row expands an inline detail panel below it, showing additional information without navigating away.

**Bulk actions toolbar:** A table with row checkboxes. When one or more rows are selected, a toolbar appears above the table with bulk action buttons (Delete Selected, Export Selected, Change Status).

**Faceted filters:** A table toolbar with multiple filter dropdowns (status, category, date range) that combine to filter the visible rows. Each active filter shows as a removable chip.

#### charts.tsx — 3 new examples

**Period toggle:** A chart with a button group above it (7D | 30D | 90D) that switches the displayed data range. Demonstrates interactive chart controls.

**Chart loading skeleton:** A ChartCard showing an animated skeleton placeholder that matches the chart's proportions. Demonstrates the loading state.

**Chart empty state:** A ChartCard with centered "No data available" message and an illustration placeholder. Demonstrates graceful empty states.

#### dashboard.tsx — 3 new examples

**Metric comparison:** Two stat values side by side (This Month vs Last Month) with a percentage change indicator between them. Shows comparative display.

**Compact stat row:** A horizontal bar of 4-5 small metrics in a single Card row, each separated by vertical dividers. More information-dense than the existing MetricGrid.

**Grid layout variations:** Three grid configurations shown: 2-column, 3-column, and 4-column MetricGrid layouts, demonstrating responsive dashboard arrangement.

#### skeleton.tsx — 2 new examples

**Data-table skeleton:** A skeleton that mimics the DataTable component's shape: header row, 5 body rows, pagination bar.

**Dashboard skeleton:** A skeleton matching the dashboard layout: 4 stat card placeholders, 2 chart card placeholders, and an activity feed placeholder.

#### command.tsx — 2 new examples

**Recent searches:** Command palette with a "Recent" section showing previously searched items, demonstrating persistent search history UI.

**Async search results:** Command palette with a simulated loading state (spinner + "Searching...") that resolves to results after a short delay. Demonstrates async search feedback.

---

### New Pages

#### customization.tsx — CVA Extension Patterns

Teaching page that shows how to create custom component variants. Each example shows the CVA variant definition code alongside the rendered result.

**6 examples:**

1. **Success & warning button variants:** Extending the Button component's CVA config with `variant: "success"` (green) and `variant: "warning"` (amber). Shows the exact code to add to `button.tsx`.

2. **Compact card variant:** A Card variant with reduced padding and smaller font sizes, suited for dense dashboards. Shows how to add a `size` axis to Card's CVA config.

3. **Closable badge variant:** Extending Badge with a `closable` boolean prop that renders an X button and accepts an `onClose` callback.

4. **Gradient button variant:** A button with a gradient background, demonstrating how to use arbitrary Tailwind classes within CVA variants.

5. **Input with built-in prefix/suffix slots:** Extending Input to accept `prefix` and `suffix` ReactNode props that render fixed content inside the input's visual boundary.

6. **The general extension pattern:** A summary example showing the three-step process (fork component → add CVA variant → export) with a minimal generic example.

#### recipes.tsx — Cross-Component Composition Recipes

Realistic UI snippets that combine multiple primitives. Each recipe is a self-contained `ShowcaseExample` with copyable code.

**8 examples:**

1. **Notification banner:** Full-width alert bar with icon, message text, action button, and dismiss X. Uses Card + Button + Badge for the type indicator (info/success/warning/error).

2. **User menu card:** A card-sized component with avatar, name, email, role badge, and quick-action buttons (Message, Follow, More). Combines Avatar + Card + Badge + Button + DropdownMenu.

3. **Search + filter toolbar:** Input with search icon, plus dropdown filter buttons for category and status, plus a grid/list view toggle. Combines Input + DropdownMenu + Button group.

4. **Stat comparison row:** Two KPI values side by side with "vs" connector and percentage change badge between them. Combines Card + Badge with custom layout.

5. **Empty state:** Centered layout with a large muted icon, heading ("No products yet"), description text, and a primary CTA button. Shows the canonical empty state pattern.

6. **Error state:** Similar centered layout with a destructive-colored icon, error heading, description, and a "Try Again" button. Complements the empty state.

7. **Confirmation prompt:** A self-contained confirmation UI with a warning icon, question text ("Are you sure you want to delete this?"), and two buttons (Cancel, Delete). Designed to be used inside dialogs or inline.

8. **File upload area:** A dashed-border drop zone with upload icon, "Drag files here or click to browse" text, accepted formats note, and a file list below showing uploaded items with size and remove button.

#### feedback.tsx — Toast & Inline Feedback

Demonstrates the Sonner toast system and inline feedback patterns.

**8 examples:**

1. **Toast variants:** Buttons that trigger success, error, warning, and info toasts. Shows `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`.

2. **Toast with action:** A toast with an "Undo" action button. Shows `toast("Item deleted", { action: { label: "Undo", onClick: ... } })`.

3. **Toast with description:** Multi-line toast with a title and description body. Shows `toast("Title", { description: "Longer detail text" })`.

4. **Promise toast:** A button that triggers an async operation with automatic loading → success/error toast transitions. Shows `toast.promise()`.

5. **Toast with custom duration:** Side-by-side comparison of short (2s), default (4s), and long (8s) duration toasts.

6. **Inline alert banner:** A non-dismissible banner component rendered inline within the page flow, showing info/success/warning/error variants with icon, title, and description.

7. **Dismissible inline alert:** Same as above but with a close button. Shows the dismissible pattern with local state.

8. **Progress feedback:** An inline progress bar with label and percentage, transitioning through states (idle → in progress → complete). Shows upload or processing feedback.

---

## Testing

No new unit tests for Phase 1. The showcase pages are visual demos with static/hardcoded data and no business logic. Existing component tests remain unchanged. Visual verification is done manually or via Storybook.

## Summary

| Category                             | Count                        |
| ------------------------------------ | ---------------------------- |
| Existing pages enriched              | 15                           |
| New examples added to existing pages | 48                           |
| New showcase pages                   | 3                            |
| New examples on new pages            | 22                           |
| **Total new examples**               | **70**                       |
| Post-expansion total                 | 148 examples across 24 pages |
