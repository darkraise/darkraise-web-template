# UI profile

**Platform:** web
**Harness:** `pnpm --filter darkraise-web-template dev --port <free port> --strictPort` after `pnpm --filter darkraise-ui build`, driven by Playwright
**UI test runner:** `E2E_PORT=<free port> E2E_WARM=1 TMPDIR=/root/.cache/pw-tmp pnpm --filter darkraise-web-template exec playwright test`
**UI paths:** `packages/ui/src/*.css` `packages/ui/src/*.tsx` `packages/ui/src/*.ts` `apps/template/src/*.tsx` `apps/template/src/*.css`
**Design system:** darkraise-ui (this repository), styles and presets in `packages/ui/src/theme/styles/builtin`
**Token paths:** `packages/ui/src/styles/theme.css` `packages/ui/src/theme/engine/generateTokens.ts` `packages/ui/src/theme/styles/builtin`
**Viewports:** 375x812, 1280x800
**Themes:** light, dark; every built-in style and preset
**Users:** developers building admin and dashboard apps on the kit
**Voice:** plain, sentence case
**Screenshots:** local

## Decisions

- **Glass rail beside a veiled bar** — Glass keeps an opaque rail while its bar veils the content scrolling beneath it (packages/ui/CHANGELOG.md, 7.0: "the top bar veils what scrolls beneath it, the rail is opaque with its own paint"), so the rail and the veiled bar differ by the content showing through the veil.
