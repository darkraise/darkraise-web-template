# Merge Surface Color with Dark-Glass gradient — Design

**Status:** approved, pending implementation plan

**Goal:** Unify the 18-color Surface Color theme axis with the Dark-Glass three-radial-blob gradient recipe. Today these are two separate systems: `generateGradient` emits a single-layer 135deg linear for the body canvas, while `.dr-surface` uses the three-blob radial recipe for region-scoped tinting. After this change, the same blob recipe drives both body canvas and `.dr-surface` regions, with hue anchors derived from the user's Surface Color selection.

**Why now:** Post-Phase 6 audit found that dark mode surface-color expressiveness is uniformly dim across all 18 colors because the linear tint uses shade-950 at 0.4 alpha over near-black ink. The blob recipe with shade-500 at 38% mix reads strongly in dark mode. Bonus: deduplicates the gradient architecture between body and accent surfaces.

**Non-goals:** Not touching the six semantic `.dr-surface-*` variants (brand, cyan, success, warning, danger, info) — they continue to override `--sf-hue*` locally and work as-is. Not changing Phase 1–6 work (glass tiers, fog ramp, AA primary, hue-tinted buttons, noise overlay, ink anchor).

---

## Architecture

### Three global hue anchors driven by Surface Color

`generate-tokens.ts` emits three CSS custom properties at the root, derived from the user's Surface Color pick:

- `--sf-hue` — `hsl(${color[500]})` (vivid mid-tone of selected color)
- `--sf-hue-2` — `hsl(${neighbor[500]})` where `neighbor = ACCENT_COLORS[(index + 3) % 17]` (matches the existing wheel pattern)
- `--sf-hue-3` — `hsl(${color[300]})` (lighter pastel)

Tokens are `transparent` when `backgroundStyle === "solid"` so the blob layers paint nothing in solid mode.

### Slate special case

Slate has no color-wheel neighbor. Hard-branch to same-palette shades:

- Dark: `hsl(${slate[500]})`, `hsl(${slate[400]})`, `hsl(${slate[300]})`.
- Light: same. (Same values both modes; the ink/paper anchor is what differs.)

Result reads as "slate surface" — a pale cool gray gradient — without pretending to be chromatic. Consistent with today's slate handling in `generateGradient:46-51`.

### Four gradient-string tokens composed at the root

```css
:root {
  --canvas-blob-a: radial-gradient(
    1200px 800px at 15% 0%,
    color-mix(in oklab, var(--sf-hue) 38%, transparent),
    transparent 60%
  );
  --canvas-blob-b: radial-gradient(
    900px 700px at 100% 20%,
    color-mix(in oklab, var(--sf-hue-2) 28%, transparent),
    transparent 60%
  );
  --canvas-blob-c: radial-gradient(
    1000px 900px at 50% 120%,
    color-mix(in oklab, var(--sf-hue-3) 22%, transparent),
    transparent 60%
  );
  --canvas-ink: linear-gradient(
    180deg,
    color-mix(in oklab, var(--sf-hue) 18%, #05060a) 0%,
    color-mix(in oklab, var(--sf-hue) 12%, #0a0c14) 100%
  );
}

[data-mode="light"] {
  --canvas-blob-a: radial-gradient(
    1200px 800px at 15% 0%,
    color-mix(in oklab, var(--sf-hue) 18%, transparent),
    transparent 60%
  );
  --canvas-blob-b: radial-gradient(
    900px 700px at 100% 20%,
    color-mix(in oklab, var(--sf-hue-2) 12%, transparent),
    transparent 60%
  );
  --canvas-blob-c: radial-gradient(
    1000px 900px at 50% 120%,
    color-mix(in oklab, var(--sf-hue-3) 8%, transparent),
    transparent 60%
  );
  --canvas-ink: linear-gradient(
    180deg,
    color-mix(in oklab, var(--sf-hue) 4%, #ffffff) 0%,
    color-mix(in oklab, var(--sf-hue) 6%, #f3f5fb) 100%
  );
}
```

Dark uses ~2× the mix intensity of light because saturated colors read much louder over a white base than over near-black. Matches the Dark-Glass reference exactly.

Both modes also tint the ink anchor itself with a tiny amount of `--sf-hue` (18/12% dark, 4/6% light). This is how `.dr-surface` works today. Phase 6's "pure neutral inks" intent was about avoiding opaque tinted slate clobbering the blob tint — `color-mix` at these low percentages preserves the blob-on-top principle because the blob layers paint above the ink.

### Two consumers compose the same four layers

```css
[data-background-style="gradient"] body {
  background:
    var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c),
    var(--canvas-ink);
  background-color: hsl(var(--background));
}

.dr-surface {
  background:
    var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c),
    var(--canvas-ink);
  position: relative;
  isolation: isolate;
  /* plus existing token overrides: --border, --input, --ring, --card, --card-border, --glow-surface, fog ramp re-emit */
}
```

Body paints the stack only in gradient mode. `.dr-surface` paints it unconditionally (explicit opt-in wrapper).

Sidebar consumes the same four-layer composition — details below.

### Cascade resolution for `--sf-hue`

- Root in gradient mode: global `--sf-hue*` from Surface Color → body canvas, sidebar, and any plain `.dr-surface` inherit it.
- Semantic variant (`.dr-surface-danger`, `.dr-surface-warning`, …): overrides `--sf-hue*` at the element → that region repaints with the semantic hue regardless of the page's Surface Color.
- Root in solid mode: global `--sf-hue*` are `transparent` → body rule is skipped by the `[data-background-style]` gate; plain `.dr-surface` in solid mode paints ink-only (degraded case; users wanting color should apply a semantic variant).

The existing `.dr-surface` base rule's `--sf-hue: hsl(var(--primary))` default is deleted so global inheritance works correctly. Semantic variants still set their own anchors and win.

---

## Sidebar migration

Sidebar today reads `var(--sidebar-gradient)` which was emitted from `generateGradient(surfaceColor, mode)`. After migration, the sidebar composes the same four-layer canvas stack:

```css
[data-background-style="gradient"] .sidebar-gradient-overlay::before {
  background:
    var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c),
    var(--canvas-ink);
}
```

Sidebar geometry is ~240px wide × 100vh tall. The blob positions are sized for viewport-scale layouts:

- Blob A at `15% 0%` with 1200×800 radius → shows as a top-left corner glow in the narrow column.
- Blob B at `100% 20%` with 900×700 radius → mostly off-sidebar, contributes a soft right-edge fade.
- Blob C at `50% 120%` with 1000×900 radius → mostly below the fold.

Net effect: sidebar reads as a gentle top-to-bottom gradient tint with a warm right-edge kiss. Playwright verification during implementation confirms acceptability. If it looks off, sidebar falls back to ink-only (no blobs) — documented as a one-liner override.

`--sidebar-gradient` token is deleted from `generate-tokens.ts`.

---

## Content overlay migration

`--content-gradient-overlay` serves different roles across four `(backgroundStyle × surfaceStyle)` permutations. Each needs specific handling:

- **`gradient + default`** → emit `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-ink)` (same four-layer stack). The overlay is a fixed 300px strip at the top of content; the three blobs crop to the top portion of their composition (mostly blob A visible, sliver of blob B, blob C below fold). Adds color expression to the top of main content when glass isn't active.
- **`solid + glass`** → keep the existing linear accent fade: `linear-gradient(135deg, hsl(${accent[mode === "light" ? 200 : 800]} / 0.2) 0%, transparent 70%)`. This permutation needs tint-for-glass-to-blur; the blob recipe can't provide it because `--sf-hue*` are transparent in solid mode. Load-bearing for the glass aesthetic in solid mode. Preserved verbatim from the current behavior.
- **`gradient + glass`** → `none`. Body canvas already paints blobs, glass naturally blurs them.
- **`solid + default`** → `none`.

Emission logic in `generate-tokens.ts`:

```ts
"--content-gradient-overlay":
  backgroundStyle === "gradient" && surfaceStyle !== "glassmorphism"
    ? `var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-ink)`
    : surfaceStyle === "glassmorphism" && backgroundStyle === "solid"
      ? `linear-gradient(135deg, hsl(${accent[mode === "light" ? 200 : 800]} / 0.2) 0%, transparent 70%)`
      : "none"
```

Two of the four permutations keep their current output; two migrate to the blob recipe.

---

## Data attribute addition

`theme-provider.tsx` currently sets `data-mode` (Phase 0 baseline) and `data-surface-style` (Phase 5 addition). This design adds `data-background-style`:

```ts
document.documentElement.setAttribute("data-background-style", bgStyle)
```

Placed next to the other two setters inside `applyTheme`. One-line change. Required for the body-background gate `[data-background-style="gradient"] body { … }`.

---

## Files changed

### `packages/ui/src/theme/engine/generate-tokens.ts`

- Delete `generateGradient` function entirely (lines 41–63).
- Delete `--bg-gradient` token emission.
- Delete `--sidebar-gradient` token emission.
- Emit three new global tokens: `--sf-hue`, `--sf-hue-2`, `--sf-hue-3` with the shade-500/neighbor-500/shade-300 pattern per the matrix above. Transparent in solid mode. Slate hard-branch.
- Rewrite `--content-gradient-overlay` emission per the four-permutation logic above.

### `packages/ui/src/styles/theme.css`

- Add `--canvas-blob-a/b/c` and `--canvas-ink` at `:root`, with `[data-mode="light"]` override.
- Add body background rule gated on `[data-background-style="gradient"]` composing the four layers. Remove the existing body `background: var(--bg-gradient, none)` declaration.
- Rewrite `.sidebar-gradient-overlay::before` to compose the four layers (gated on `[data-background-style="gradient"]`).
- Update `main[data-content]::before` (content overlay) to keep its existing structure but change the `background` source from `var(--content-gradient-overlay)` to whatever `generate-tokens.ts` now emits (the gradient-string itself, so the consumer doesn't need to change — it reads the token as before).
- Simplify `.dr-surface` rule: remove inline `--ink-0`…`--ink-6`, remove inline `--blob-a/b/c` color declarations, remove inline multi-layer background. Replace with `background: var(--canvas-blob-a), var(--canvas-blob-b), var(--canvas-blob-c), var(--canvas-ink);`.
- Remove `--sf-hue: hsl(var(--primary))` default from `.dr-surface` base rule so global inherits.
- `[data-mode="light"] .dr-surface` block can be deleted — the ink/blob mode-swapping is now handled by the root-level `[data-mode="light"]` override of `--canvas-*` tokens, which `.dr-surface` inherits automatically.

### `packages/ui/src/theme/theme-provider.tsx`

- Add `document.documentElement.setAttribute("data-background-style", bgStyle)` inside `applyTheme`, next to the existing `data-mode` and `data-surface-style` setters.

### `packages/ui/src/theme/engine/generate-tokens.test.ts`

- Remove assertions against `--bg-gradient` and `--sidebar-gradient`.
- Add assertions that `--sf-hue`, `--sf-hue-2`, `--sf-hue-3` emit the expected HSL string for a sample surface color in gradient mode, and `transparent` in solid mode.
- Add slate-specific assertion: `--sf-hue-2` uses `slate[400]`, not a cross-palette neighbor.
- Adjust `--content-gradient-overlay` assertions to cover the four permutations.

---

## Testing

- **Unit:** existing 116 vitest cases continue to pass. Add ~6 new assertions for the three hue anchors and the revised content-overlay branches. Expected final count ~122.
- **Build:** `pnpm build` in `packages/ui`. Exit 0.
- **Playwright:** sweep all 18 surface colors in `dark + glass + gradient`, confirm three distinct blobs paint with the selected hue. Repeat in `light + glass + gradient`, `dark + default + gradient`, and `light + default + gradient` for full coverage. Regression screenshots in both solid modes to confirm no visual drift from the canvas (solid body just shows `bg-background`).

---

## Scope safety

- Phase 1 AA primary and blue-tinted light glass shadows — untouched.
- Phase 2 fog ramp emission — untouched. Fog tokens stay hue-neutral (white rgba).
- Phase 3a/3b glass tiers — untouched.
- Phase 4 `.dr-surface` structure is simplified but its contract is preserved: the six semantic variants, `.dr-surface--flat` opt-out, `::before` SVG noise, border/input/ring/card token overrides, and fog-ramp re-emit all continue to work.
- Phase 5 hue-tinted buttons — untouched. `--hue` for buttons is independent of `--sf-hue*`.
- Phase 6 `body::before` noise overlay and `--noise-opacity` — untouched. The ink anchor hex values fold from `generateGradient` into the new `--canvas-ink` token.

---

## Risk summary

| Risk                                              | Severity | Mitigation                                                                                                           |
| ------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| Sidebar composition looks wrong in narrow column  | Medium   | Playwright check during implementation; fall back to ink-only if needed.                                             |
| Content overlay branching complexity              | Medium   | Explicit four-permutation logic documented above. Unit tests cover each branch.                                      |
| Dark-mode over-expression with shade-500 at 38%   | Low      | Percentages match Dark-Glass reference which has been visually validated. Adjustable if dashboards read as too loud. |
| Plain `.dr-surface` in solid mode paints ink-only | Low      | Documented degraded case. Users apply semantic variant if they want color.                                           |
| Slate surface reads as "unbranded"                | Low      | Intentional — slate is the neutral opt-out. Consistent with today.                                                   |

---

## Success criteria

1. All 18 surface colors produce visibly distinct canvas tints in both dark and light mode when `backgroundStyle=gradient`. Dark mode is no longer uniformly dim.
2. Body canvas and any plain `.dr-surface` region read as the same design language (three blobs, same position, same shade semantics).
3. Semantic `.dr-surface-*` variants are byte-equivalent in visual output to today (they already use the same recipe internally; this change standardizes the source).
4. `solid + glass` continues to render the content-overlay tint so backdrop-blur has something to work against.
5. `backgroundStyle=solid` permutations look identical to pre-merge.
6. 122-ish vitest cases pass, `pnpm build` exit 0.

---

## Commit strategy

Single phase, one atomic commit:

`feat(theme): merge surface color with dark-glass gradient recipe`

All changes ship together because they are mutually dependent:

- `generate-tokens.ts`: delete `generateGradient`, delete `--bg-gradient` and `--sidebar-gradient` emissions, emit `--sf-hue*`, rewrite `--content-gradient-overlay`.
- `theme-provider.tsx`: add `data-background-style` attribute setter.
- `theme.css`: add `--canvas-*` tokens at root + light override; rewrite body, sidebar, content overlay, `.dr-surface` backgrounds; delete `[data-mode="light"] .dr-surface` override block; delete `--sf-hue: hsl(var(--primary))` default from `.dr-surface`.
- `generate-tokens.test.ts`: remove stale assertions, add new ones per the Testing section.

A two-commit split was considered (token emission first, consumers second) but rejected because deleting `--bg-gradient` emission without simultaneously rewriting the body rule that consumes it breaks the body canvas mid-commit. Atomic landing keeps the branch green commit-by-commit.
