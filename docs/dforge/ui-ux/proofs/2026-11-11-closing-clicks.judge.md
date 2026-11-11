## Verdict

verdict: ship bf1041605b580231
scores: coverage 18 / fidelity 17 / states 16 / deviations 18

## Scope

Contract: touch, the report's Delta (UX-1 to UX-5, OP-1). Opened: all 24 screenshots, the four results-\*.json files, proof.spec.ts, run.log, unit.log, useControllableState.ts and its test file, closing-overlays.test.ts, the ClosingPopover fixture, the "closing popover" block in 27-controls-behaviour.spec.ts, and the stylesheet counts. The red-check run (stylesheet reverted) was not saved as a file, so it is not counted as evidence; the verdict rests on the saved evidence alone.

## Per item

- UX-1: proven. Popover open screenshots (4 combos) show the Done popover with counter `done 0 · next 0`. After-second-press screenshots (4) read `done 1 · next 0`. All four JSON files record `ux1PopoverOpen: "open auto"`, `ux1PopoverClosing: "closed none"`, `ux1: "done 1 · next 0"`. proof.spec.ts reads the computed pointer-events right after Done and asserts all three values. The 27-controls-behaviour.spec.ts test of the same name repeats the check.
- UX-2: proven. Dialog open screenshots show the dimmed backdrop over Next at both viewports and themes. After-press-through screenshots read `done 0 · next 1` with Next in its hover state. JSON: dialog and backdrop `open auto`, then `closed none` / `closed none` after Close dialog. The spec asserts these and the counter.
- UX-3: proven. The press at Next's centre during the open dialog leaves `done 0 · next 0` in all four screenshots and JSON files. The spec asserts the dialog is dismissed (count 0) and Next did not fire.
- UX-4: proven. Four screenshots show log `onOpenChange(false) 1 · onInteractOutside 0 · pressed while none`, with a visible focus ring on "Open popover" in each. JSON `ux4Focused` is "Open popover". Two Escapes are pressed back to back in the spec.
- UX-5: proven by tests I read. useControllableState.test.tsx has a test for each clause: no onChange for the current value, two sets in one tick, a setter kept from an earlier render, composing updaters, and a controlled owner asked again. unit.log shows them passing (12 files, 255 tests). The hook uses a committed-value ref and a microtask-cleared pending value, which matches the tests. closing-overlays.test.ts scans every `components/<name>/<name>.css` rule containing `data-[state=closed]:animate-out` and requires the closed pointer-events rule. unit.log lists 18 surfaces across 15 stylesheets, all passing. A search of the stylesheets confirms 18 additions under components/. The one extra `animate-out` (navigation-menu indicator, `data-[state=hidden]`) is a non-interactive indicator, not an exit-animated surface the claim covers.
- OP-1: proven. All four JSON files have `axe: []`, `consoleErrors: []`, `overflow: 0`. proof.spec.ts asserts each. run.log shows "4 passed". The axe scan covers the dialog only, as the report states.

## Findings that do not dispute an item

- The observable for UX-1 and UX-2 is the on-page counter plus the computed pointer-events value, not the pixels. The screenshots show the before and after pages but cannot show the closing frame. The JSON values and spec assertions carry that evidence.
- run.log names the spec `zz-proof-closing-clicks.spec.ts`; the cited file is `proof.spec.ts`. The spec was copied in and run under another name; the test names and combinations match.
- "369 files, 7268 tests" in the automated-checks list has no saved log. It is a supporting claim only; unit.log covers the 12 relevant files.
- The red-check numbers (`done 2`, `next 0`, 18 of 18 scan failures) are the session's claim and are unverified here.
- The popover overlaps the fixture's log text in the popover-open screenshots. This is the fixture's layout and is unrelated to the change.

## Disputed items

None.

## Scores

- coverage 18: every Delta item has a row with evidence I opened that shows it.
- fidelity 17: no visual change was promised; screenshots show the unchanged fixture and kit components in both themes and viewports.
- states 16: open, closing and closed states are evidenced by computed values and counters; the keyboard path is the Escape test with focus return. No screenshot freezes the mid-exit frame.
- deviations 18: no deviation rows and none found.

Verdict: ship bf1041605b580231
