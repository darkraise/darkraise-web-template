# UI package router decoupling design

**Date:** 2026-04-15
**Scope:** `packages/ui`
**Status:** Approved design, ready for implementation planning

## Problem

The `darkraise-ui` package hard-codes `@tanstack/react-router` as a runtime dependency. Eight source files import router APIs directly, which forces every consumer of the package onto tanstack-router. The package is meant to be a flexible template UI kit, not a stack-bound library.

This spec removes `@tanstack/react-router` from `packages/ui` and introduces a thin router-adapter abstraction that any routing library can implement. Decoupling of `@tanstack/react-form`, `@tanstack/react-table`, and `@tanstack/react-virtual` is out of scope and will be addressed in follow-up specs.

## Current coupling

| API                                                | Consumer files                                                                                               | Purpose                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `<Link to activeProps activeOptions>`              | `layout/sidebar-nav.tsx`, `layout/top-nav-layout.tsx`, `layout/stacked-layout.tsx`, `layout/page-header.tsx` | Client-nav anchor with active styling            |
| `useNavigate()`                                    | `layout/search-command.tsx`                                                                                  | Programmatic navigation from the command palette |
| `useRouter().navigate / invalidate / history.back` | `errors/error-page.tsx`, `errors/not-found-page.tsx`, `errors/server-error-page.tsx`                         | Retry, go-back, back-to-home buttons             |
| `useRouterState().location.pathname`               | `layout/stacked-layout.tsx`                                                                                  | Detect active nav group                          |
| `ErrorComponentProps` type                         | `errors/error-page.tsx`                                                                                      | `{ error, reset }` prop shape                    |

Eight files total (the three error pages, four layout files, and `search-command`).

## Chosen approach

**Adapter context.** The ui package defines a small `RouterAdapter` interface and a `RouterAdapterProvider`. Components pull the adapter at runtime through a `useRouterAdapter()` hook. The template app supplies a concrete adapter that wraps `@tanstack/react-router`. Consumers on other routers (react-router, next/link, wouter) write their own ~30-line adapter and are otherwise unaffected.

**Why this over alternatives:**

- Split adapter package (`darkraise-ui-tanstack`) doubles the publishing surface and duplicates layout components per router.
- Prop drilling (`LinkComponent` on every layout) would have to thread three levels deep through `StackedLayout` → `SidebarItem` → collapsed popover `Link` — enough layers that a provider is clearly cleaner.
- The adapter-context pattern already matches `next-themes` and `TooltipProvider` usage in the template.

## Module layout

New module at `packages/ui/src/router/`:

- `types.ts` — `RouterAdapter` interface and `RouterLinkProps`
- `context.tsx` — `RouterAdapterProvider` and `useRouterAdapter()` hook; hook throws a descriptive error when no provider is mounted
- `index.ts` — public re-exports

The module is exported from `darkraise-ui` via a new `./router` subpath in `package.json`'s `exports` map, mirroring the existing `./theme`, `./layout`, `./errors` subpaths.

## Adapter interface

```ts
export interface RouterLinkProps {
  to: string
  className?: string
  activeClassName?: string
  activeExact?: boolean
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

export interface RouterAdapter {
  Link: React.ComponentType<RouterLinkProps>
  useNavigate: () => (to: string) => void
  usePathname: () => string
  useBack: () => () => void
  useInvalidate: () => () => void
}
```

All five members are required. `useBack` and `useInvalidate` are hooks that return a callback, mirroring `useNavigate`. This shape is necessary because implementations typically need to call their router's own hooks (for example tanstack's `useRouter()`) during render to capture the router instance, then expose a stable callback the component can invoke from an event handler. Returning a plain function directly would force the implementation to call its router hooks outside of render, violating the rules of hooks.

Implementers that lack a native refetch concept (for example plain react-router without a data router) supply a no-op callback from `useInvalidate`. `useBack` can fall back to returning `() => window.history.back()` when a router has no history API of its own.

The `Link` component contract is anchor-like. Consumers implement active styling by mapping `activeClassName` and `activeExact` to their router's native active-matching mechanism (tanstack's `activeProps`/`activeOptions`, react-router's `NavLink` `className` callback, etc.).

## Per-file migration

Each of the following files stops importing from `@tanstack/react-router` and uses the adapter instead.

- **`layout/sidebar-nav.tsx`** — `Link` becomes `useRouterAdapter().Link`. `activeProps={{ className: "active" }} activeOptions={{ exact: true }}` becomes `activeClassName="active" activeExact`. Two call sites in this file (primary nav item, collapsed-popover child item).
- **`layout/top-nav-layout.tsx`** — `Link` replacement. `activeProps={{ className: "active" }}` becomes `activeClassName="active"` (no `activeExact`, preserves current prefix-match behavior).
- **`layout/page-header.tsx`** — `Link` replacement for breadcrumb links (no active styling) and tab links (`activeClassName="active"`).
- **`layout/stacked-layout.tsx`** — `useRouterState().location.pathname` becomes `usePathname()`. `Link` replacement for the icon rail.
- **`layout/search-command.tsx`** — `useNavigate()` comes from the adapter. Call site changes from `navigate({ to: item.href })` to `navigate(item.href)` because the adapter's `useNavigate` returns a string-taking function.
- **`errors/error-page.tsx`** — drop `useRouter()`. Replace `ErrorComponentProps` with a locally defined `ErrorPageProps = { error: unknown; reset: () => void }`. At render time the component captures `const navigate = useNavigate()` and `const invalidate = useInvalidate()`. "Try again" calls `reset()` followed by `invalidate()`. "Back to home" calls `navigate("/")`.
- **`errors/not-found-page.tsx`** — captures `const navigate = useNavigate()` and `const back = useBack()` at render. `router.history.back()` becomes `back()`. `router.navigate({ to: "/" })` becomes `navigate("/")`.
- **`errors/server-error-page.tsx`** — captures `const navigate = useNavigate()` and `const invalidate = useInvalidate()` at render. `router.invalidate()` becomes `invalidate()`. Home navigation uses `navigate("/")`.

`ErrorPageProps` is exported from `packages/ui/src/errors/index.ts` so consumers wiring tanstack's `errorComponent` can cast their handler's props to the neutral shape.

## Template app adapter

New file at `apps/template/src/lib/router-adapter.tsx`:

```ts
import {
  Link as TLink,
  useNavigate as tUseNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"
import type { RouterAdapter, RouterLinkProps } from "darkraise-ui/router"

function Link({ to, activeClassName, activeExact, ...rest }: RouterLinkProps) {
  return (
    <TLink
      to={to}
      activeOptions={{ exact: activeExact }}
      activeProps={{ className: activeClassName }}
      {...rest}
    />
  )
}

export const tanstackRouterAdapter: RouterAdapter = {
  Link,
  useNavigate: () => {
    const navigate = tUseNavigate()
    return (to: string) => navigate({ to })
  },
  usePathname: () => useRouterState().location.pathname,
  useBack: () => {
    const router = useRouter()
    return () => router.history.back()
  },
  useInvalidate: () => {
    const router = useRouter()
    return () => {
      void router.invalidate()
    }
  },
}
```

The app's root wraps its `<RouterProvider>` children in `<RouterAdapterProvider value={tanstackRouterAdapter}>`.

## Storybook

The ui package's Storybook today only has stories for leaf components (`accordion`, `badge`, `button`, etc.), none of which use the router, so no existing stories break. However, the shared mock adapter defined for tests should also be wired into Storybook as a global decorator in `.storybook/preview.tsx` so that any future stories for `SidebarNav`, layouts, `PageHeader`, `SearchCommand`, or the error pages render out of the box. The mock adapter tracks pathname in component state, `Link` renders an `<a>` with `onClick` intercepting navigation to call `setPathname`, `useNavigate` updates the same state, `useBack` returns a callback that pops a small history stack, and `useInvalidate` returns a no-op callback.

## Testing

- Unit test for `useRouterAdapter()` that verifies a descriptive error is thrown when no provider is mounted.
- Unit test that `RouterAdapterProvider` forwards the supplied adapter to consumers.
- Existing component tests (layout and error page tests) use the mock adapter introduced for Storybook, exposed as a shared test helper in `packages/ui/src/test/`.

## Migration order

1. Add `packages/ui/src/router/` module (types, context, provider, hook) and export via the `./router` subpath.
2. Migrate all eight consumer files in a single changeset — they share the adapter, and a partial migration leaves the ui package in a mixed state.
3. Add the shared mock adapter test helper in `packages/ui/src/test/` and register the Storybook decorator in `.storybook/preview.tsx` so tests keep passing and future stories for router-consuming components work out of the box.
4. Add `apps/template/src/lib/router-adapter.tsx` and wrap the app root in `<RouterAdapterProvider>`.
5. Remove `@tanstack/react-router` from `packages/ui/package.json` dependencies. Run `pnpm install`, `pnpm --filter darkraise-ui typecheck`, `pnpm --filter darkraise-ui build`, and a full `pnpm test` to verify the ui package is router-dependency-free and the template app still renders and navigates.

## Non-goals

- Decoupling `@tanstack/react-form`, `@tanstack/react-table`, `@tanstack/react-virtual`. Tracked as follow-up work.
- Changing the template app's choice of router. The app continues to use tanstack-router; only the ui package becomes neutral.
- Providing prebuilt adapters for other routers. The template ships one tanstack adapter; others can be added later if demand emerges.

## Success criteria

- `packages/ui/package.json` lists no `@tanstack/react-router` dependency.
- `grep "@tanstack/react-router" packages/ui/src` returns no matches.
- `pnpm --filter darkraise-ui typecheck` and `pnpm --filter darkraise-ui build` succeed.
- The template app navigates, shows active nav styling, handles not-found and server-error routes, and uses the command palette identically to the pre-change behavior.
- Storybook builds and existing stories render without errors.
