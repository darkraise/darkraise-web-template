## Verdict

verdict: ship
scores: coverage 18 / fidelity 17 / states 16 / deviations 18

Disputed items: 0.

## What I opened

- The criteria, the report's Delta (UX-1 to UX-5, UI-1, OP-1) and its Results table.
- All 48 screenshots under `.dforge/ui-ux/select-open-highlight/` (UX-1: 8, UX-2: 8, UX-3: 4, UX-4: 12, UX-5: 4, UI-1: 8), viewed one by one.
- `results-1280x800-light.json`, `results-375x812-dark.json` in full; the other two results files for geometry, axe, console and overflow keys and for the `focusVisible` and `highlighted` values.
- `proof.spec.ts`, `run.log`, `Select.tsx` (the open effect, `openFromKeyboard`, `revealInScrollport`) and the "Select opening highlights the selected option" block of `Select.test.tsx` (six tests, lines 346-435).

## Per-item findings

- **UX-1 (pass, evidenced).** At both viewports and both themes, the open shot shows the Africa/Cairo row (the checked row) with the highlight and focus ring. The arrowdown shot moves the ring to Africa/Johannesburg, the next row. The JSON `highlighted` and `role: option` values match, and the spec asserts `hl` text and focus. The unit test "Enter on the trigger highlights the selected option, ArrowDown moves past it" matches.
- **UX-2 (pass, evidenced).** The open shot shows Johannesburg highlighted, with the check on the same row. The arrowup shot moves the ring to Cairo, the previous row. Unit test "ArrowUp on the trigger also starts from the selected option" matches. All four combinations were seen.
- **UX-3 (pass, evidenced).** After a click the Cairo row carries the fill and no outline (`focusVisible` false in every combination), and it is the only highlighted row. The unit test "a click open highlights the selected option" matches. In dark the fill (rgb 39,39,42) is faint against the list surface, but it is visible in both dark shots and `data-highlighted` is set.
- **UX-4 (pass, evidenced).**
  - Pointer open on the empty Plan select: no highlight, and the listbox itself is focused (JSON `role: listbox`, `highlighted: []`).
  - Enter highlights Alpha, the first option.
  - ArrowUp highlights Gamma, the last option.
  - All twelve shots agree. The demo runs under StrictMode, and the report says the first run exposed the Enter failure.
  - The code keeps the `openEnd` request until close, and the StrictMode unit test matches.
- **UX-5 (pass, evidenced).** The committed shots show no listbox, the trigger reading Africa/Johannesburg, and a focus ring on the trigger. The ring is faint in light and clear in dark, as the report states. JSON shows `listboxes: 0`, `role: combobox`, `focusVisible: true`.
- **UI-1 (pass, evidenced).** The 50-row list opens on UTC, the last row. Geometry: row 466-498 inside list 179-499 at 1280, and row 478-510 inside list 191-511 at 375. `isLast` is true, `scrollY` is 0 before and after. The before-open and last-selected shots show identical page content positions, so the app shell did not scroll either. The row is flush with the bottom of the scrollport, but it is fully inside.
- **OP-1 (pass, evidenced).** `run.log` shows 4 passed, one per viewport and theme combination. Every JSON has `violations: []` (15 passes), `consoleErrors: []` and `horizontalOverflowPx: 0`. The `run.log` line reference `zz-proof-select.spec.ts:31:3` matches line 31 of the kept `proof.spec.ts`, so it is the same spec.

## Criteria notes

- **Every Item Has Evidence.** Every delta item has a row, and each row cites screenshots, JSON keys and tests that I opened and that show that item at both viewports and both themes.
- **Built Matches Promised.** Components, highlight tokens, check mark and focus ring look consistent with the design system. There is no copy change. Dark highlight contrast is low, which is existing styling.
- **Every State Is Shown.** The following are evidenced:
  - the keyboard-only walk (Enter, ArrowDown, ArrowUp, Enter to commit);
  - pointer open, with and without a value;
  - the StrictMode case;
  - the worst-case long list.
    Not shown, and not in the delta: a selected option that is disabled, and a value that matches no item. The code falls through to the first/last/listbox path in both cases and no test covers it.
- **Deviations Are Cited.** The report has no deviation rows, and I found no difference from the contract. The faint light-theme trigger ring is existing field styling, which the report discloses.

## Adjacent observations (not disputed)

- Light-theme trigger focus ring after commit is a 3px rgba(60,131,246,0.12) shadow plus the border. It is low contrast, and `Select.tsx` does not own it.
- No test covers a selected option that is disabled, or a value absent from the items.

Verdict: ship b5c5a398b03f33e4
