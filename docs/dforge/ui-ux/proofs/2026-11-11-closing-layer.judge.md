## Verdict

verdict: ship 2e3ce7a72e729794
scores: coverage 18 / fidelity 18 / states 17 / deviations 18

## What I opened

- The criteria, the revised report (UX-5 row now cites unit.log and names all ten consumers) and all 24 screenshots (UX-1 open and after-press, UX-2 after-shift-tab, UX-3 outside-press-open, UX-4 escape; each at 1280x800 and 375x812, light and dark).
- The four results-\*.json files, proof.spec.ts, run.log and the new unit.log.
- The change: DismissableLayer.tsx (the pointer-down and focus-in handlers now start with `!isActive()` early returns), its two new tests at the end of DismissableLayer.test.tsx, the `ClosingPopover` probe in controls-behaviour.tsx and the "closing popover" block in 27-controls-behaviour.spec.ts.

## Item by item

- UX-1: proven. In all four combinations the screenshot after the press and the JSON key `ux1` read `onOpenChange(false) 0 · onInteractOutside 0 · pressed while closed`. The "pressed while closed" part shows that Next's own pointer-down handler ran while the popover content was still mounted with `data-state="closed"`, so the press landed inside the exit window. Focus ended on Next. The e2e test asserts the same string.
- UX-2: proven. `ux2StateAfterEnter` is `closed` before Shift+Tab; the log reads 0 / 0 with "pressed while none"; focus moved to the user-menu trigger "U", whose focus ring is visible in all four screenshots. The e2e test asserts `data-state="closed"` before Shift+Tab and the same log.
- UX-3: proven. Log `onOpenChange(false) 1 · onInteractOutside 1` in all four combinations, popover gone. The "pressed while closed" text is explained by the capture listener closing the popover before Next's handler runs, which is consistent with the code and with UX-1.
- UX-4: proven. Log `onOpenChange(false) 1 · onInteractOutside 0`, the "Open popover" trigger shows a focus ring in all four screenshots, and `ux4Focused` is "Open popover".
- UX-5: proven. The two new unit tests ("a closing layer ignores a pointerdown outside it", "a closing layer ignores focus moving outside it") are in DismissableLayer.test.tsx, render a layer with `active={false}` and assert zero callbacks. unit.log lists both as passing (lines 11 and 12). It also lists passing tests from the Dialog, Drawer, Popover, DropdownMenu, ContextMenu, Menubar, Select, Combobox, HoverCard and Tooltip suites, which are the ten files that import DismissableLayer in the source tree. It ends with "Test Files 13 passed (13)" and "Tests 314 passed (314)", and I found no failing, skipped or pending line. The log has 11 distinct test files in the lines I could attribute (the primitive plus the ten consumers); the other two of the 13 are not identified in the log, which does not affect this item.
- OP-1: proven. axe `[]`, `consoleErrors` `[]` and `overflow` 0 in all four JSON files; run.log shows "4 passed" for the four combinations. The open popover is visible in the four ux-1-open screenshots. run.log names `zz-proof-closing.spec.ts` while the saved copy is `proof.spec.ts`; the line number (40:3) matches the copy, so I accept it.

## Disputed items

None.

## Other observations (not disputed)

- The red check (fix reverted, both new browser tests failing) is stated in the report but its output was not saved. I did not rely on it: the green logs together with "pressed while closed" and `data-state` "closed" already show the exit window was hit, and the report's "both failed before the fix" for the unit tests is likewise unsaved.
- At 375x812 the presses are mouse events, not touch pointers. The handler listens for `pointerdown` regardless of pointer type, so I do not count this against UX-1, but a touch-pointer run would be stronger for a "touch" contract.
- In the ux-1-open screenshots the log text is partly hidden behind the open popover; the after-press shots show it in full, so nothing is missing.
- No deviations are reported and I found none: the screenshots show the same fixture components in each combination, with no visual change, as promised.

Verdict: ship 2e3ce7a72e729794
