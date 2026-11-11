## Verdict

verdict: ship 158d0c8a26f44378
scores: coverage 18 / fidelity 18 / states 17 / deviations 17

## What I opened

- Criteria, the revised report (Delta, Results, Automated checks), the regenerated `proof.spec.ts` and `run.log`, and all six result files (four `results-<viewport>-<theme>.json`, `results-touch-classic.json`, `results-touch-island.json`).
- First round, unchanged and kept: all 10 `ui-1` rest shots, all 30 `ui-2` hover, focus and drag shots, 6 forced-colours shots, 2 scroll bar shots, 4 RTL shots, and `before-7.1.0-sheet.png`.
- New this round: both phone shots (`ux-4-375x812-light-phone.png`, `ux-4-375x812-dark-phone.png`) and both touch shots (`ux-3-1280x800-light-classic-touch-drag.png`, `ux-3-1280x800-light-island-touch-drag.png`).
- Source read last round (`split-panel-layout.css`, `SplitPanelLayout.tsx`, the unit tests, shell and theme rules). I still have no shell, so I could not run `git diff`; I judged the working tree as built.

## Re-check of OP-1 (previously disputed)

- Both phone shots now show the loaded inbox (nine message rows, avatars, unread dots, scroll bar) in light and dark. The earlier blank body is gone.
- `proof.spec.ts` now waits for `Mar \d+` in the panel before the OP-1 step (lines 101-102 and 307) and runs `window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })` (line 311). It records `axeScope: "document"` and `handleInDom` as the handle count.
- All four result files carry `axeScope: "document"`, `handleInDom: 1`, `axe: []`, `overflow: 0`, `consoleErrors: []`. The handle is in the DOM at 375px (hidden, `display: none`), so the whole-document scan covers it at both viewports and the changed control at 1280.
- `run.log` shows "6 passed". The tests pass only if axe returns no violations, overflow is 0 and there are no console errors (spec lines 320-322).
- OP-1 is proven. The earlier dispute is withdrawn.

## Re-check of UX-3 (touch)

- `results-touch-classic.json` and `results-touch-island.json` both give `before: 360px`, `during: 400px`, `dragging: "true"`, `gripH: 56`, `after: 400px`, `afterDragging: null`.
- The spec drives real CDP `Input.dispatchTouchEvent` with `hasTouch` on: a touch press at handle x + 8, four 10px moves, then touch end. The width follows the finger's 40px travel with no jump, and lifting ends the drag.
- Both touch shots show the grown accent bar at the island and classic edge, matching the JSON.
- The touch run is light theme and 1280x800 only, in classic and island. The mouse run covers all five styles and both themes. I do not count this as a gap against the item.
- The 7.1.0 before-numbers are now labelled in the report as session observations that no results file records and no verdict rests on. I treat them as context.

## Remaining findings, kept from the first round (non-blocking)

- Coverage: every other row is shown. UI-1 to UI-4 and UX-1, UX-2 and UX-4 are backed by shots I opened and by the JSON keys the rows cite (grip 4x28 at rest, 56px accent on hover, focus and drag, outline and box-shadow `none`, forced-colours CanvasText and Highlight, `0s` transition under reduced motion, hit tests at -2/+9 and mirrored RTL, floating drag 360 to 400, arrows and Home/End 360 to 372 to 360 to 240 to 480).
- Fidelity: the bar matches `.dr-resizable-handle-grip` token for token. Island and floating centre the bar in the gutter between panel card and content, as the note states. The 12px strip overhanging 2px into the panel and 10px into the content is the user's settled decision. The forced-colours focus crop is hard to read against the black scroll thumb, but the resolved Highlight value in the JSON settles it.
- States: rest, hover, focus, drag, forced colours, reduced motion, RTL (classic and island), scroll bar, phone and touch are all shown. The keyboard walk is classic only and RTL covers two styles only. Neither blocks, because the handle's own rules do not vary by style.
- Report text error: the Results paragraph still says `run.log` is "4 passed", while the regenerated log reads "6 passed". The report's own paragraph is out of date; no item verdict depends on it. Fix it when convenient.
- Deviations: no row is marked deviation, and the differences I found are disclosed (gutter centring, the 2px scroll bar overlap that the user settled, the Quiet-style-only limit under "Not proven here").

## Disputed items

None.

Verdict: ship 158d0c8a26f44378
