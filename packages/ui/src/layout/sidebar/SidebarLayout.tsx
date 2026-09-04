import { useState } from "react"
import { PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@components/button"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"
import { TooltipProvider } from "@components/tooltip"
import { BrandLogo } from "@layout/brand-logo"
import { LayoutHeader } from "@layout/layout-header"
import { SearchCommand } from "@layout/search-command"
import { SkipLink } from "@layout/skip-link"
import { useRouteFocus } from "@layout/useRouteFocus"
import { flattenNavItems } from "@layout/navTree"
import { SidebarNav } from "./SidebarNav"
import { resolveActiveBar } from "./sidebar-active-bar"
import type { SidebarActiveBar } from "./sidebar-active-bar"
import { SidebarProvider } from "./SidebarContext"
import type { LayoutProps } from "@layout/types"
import { useShellStyle, useSidebarActiveBarSetting } from "@layout/shell"
import type { ShellStyle } from "@theme"
import { useUiLabels } from "@labels"

export interface SidebarLayoutProps extends LayoutProps {
  /**
   * Indicator style for the active nav item, controlled. Passing this pins
   * the style: the header toggle (if shown) reports its clicks through
   * `onActiveBarChange` instead of changing anything on its own.
   *
   * Omitting it is NOT the same as passing a value — omitted leaves each
   * preset's own look alone (glass shows a ring and a rail, sci-fi a ring,
   * everything else a rail), while a value forces that look everywhere.
   *
   * `true` is shorthand for `"bar"`, `false` for `"ring"`.
   */
  activeBar?: boolean | SidebarActiveBar
  /**
   * Initial indicator style when `activeBar` is not supplied. Only useful
   * alongside `showActiveBarToggle`, which is the one thing that can change
   * the style afterwards.
   *
   * @default undefined — the active preset's own indicator
   */
  defaultActiveBar?: boolean | SidebarActiveBar
  /** Fires when the header toggle picks a style. */
  onActiveBarChange?: (activeBar: SidebarActiveBar | undefined) => void
  /** Pins this shell's chrome treatment, overriding the theme axis. */
  shellStyle?: ShellStyle
}

export function SidebarLayout({
  children,
  nav,
  headerSlot,
  navHeader,
  navFooter,
  // Accepting the deprecated names is what makes them aliases; the rule is
  // aimed at callers, not at the shim that keeps them working.
  /* eslint-disable @typescript-eslint/no-deprecated */
  sidebarHeader,
  sidebarFooter,
  /* eslint-enable @typescript-eslint/no-deprecated */
  showLayoutSwitcher,
  showThemeSwitcher,
  showActiveBarToggle = false,
  activeBar: activeBarProp,
  defaultActiveBar,
  onActiveBarChange,
  shellStyle: shellStyleProp,
  user,
  onProfile,
  onSettings,
  onLogout,
}: SidebarLayoutProps) {
  const labels = useUiLabels()
  const shellStyle = useShellStyle(shellStyleProp)
  // The sidebar* names predate the layouts that have no sidebar; both still
  // work, and the new name wins when a caller passes each.
  const resolvedNavHeader = navHeader ?? sidebarHeader
  const resolvedNavFooter = navFooter ?? sidebarFooter
  useRouteFocus()
  const [collapsed, setCollapsed] = useState(false)
  // Defaults to unset so nobody's sidebar changes appearance unless they ask:
  // each preset renders its own default indicator until the control below
  // is touched. A single-selection ToggleGroup can't hold `undefined`
  // itself, so "unset" is represented on the wire as the "default" item
  // and mapped back to `undefined` in onValueChange.
  // Three states, not two: "bar"/"ring"/"both" force a look, "default" asks
  // for the preset's own, and `undefined` means nobody local has spoken yet —
  // only then does the theme axis get a say.
  const [localActiveBar, setLocalActiveBar] = useState<
    SidebarActiveBar | "default" | undefined
  >(() =>
    defaultActiveBar === undefined
      ? undefined
      : (resolveActiveBar(defaultActiveBar) ?? "default"),
  )
  const themeActiveBar = useSidebarActiveBarSetting()

  const settingToWire = (value: SidebarActiveBar | "default") =>
    value === "default" ? undefined : value

  const activeBar =
    activeBarProp !== undefined
      ? resolveActiveBar(activeBarProp)
      : localActiveBar !== undefined
        ? settingToWire(localActiveBar)
        : settingToWire(themeActiveBar)

  const flatNavItems = flattenNavItems(nav)

  const activeBarToggle = showActiveBarToggle ? (
    <ToggleGroup
      type="single"
      size="sm"
      value={localActiveBar ?? themeActiveBar}
      onValueChange={(value) => {
        // A single-selection group emits "" on deselect; that must not
        // reach state, or the control would end up with no active item.
        if (!value) return
        const next = value as SidebarActiveBar | "default"
        if (activeBarProp === undefined) setLocalActiveBar(next)
        onActiveBarChange?.(settingToWire(next))
      }}
      variant="outline"
      aria-label="Sidebar active-item indicator"
    >
      <ToggleGroupItem value="default" aria-label="Each preset's own indicator">
        Default
      </ToggleGroupItem>
      <ToggleGroupItem value="bar" aria-label="Left rail only">
        Bar
      </ToggleGroupItem>
      <ToggleGroupItem value="ring" aria-label="Uniform ring only">
        Ring
      </ToggleGroupItem>
      <ToggleGroupItem value="both" aria-label="Ring and left rail">
        Both
      </ToggleGroupItem>
    </ToggleGroup>
  ) : null

  const toggleButton = (
    <Button
      variant="ghost"
      size="icon"
      className="dr-sidebar-nav-item dr-sidebar-layout-toggle"
      onClick={() => setCollapsed(!collapsed)}
      aria-label={
        collapsed ? labels.layout.expandSidebar : labels.layout.collapseSidebar
      }
    >
      {collapsed ? (
        <PanelLeft className="size-[var(--icon-size)]" aria-hidden="true" />
      ) : (
        <PanelLeftClose
          className="size-[var(--icon-size)]"
          aria-hidden="true"
        />
      )}
    </Button>
  )

  return (
    <TooltipProvider>
      <SidebarProvider collapsed={collapsed}>
        <div
          className="dr-shell dr-sidebar-layout"
          data-structure="sidebar"
          data-shell-style={shellStyle}
        >
          <SkipLink>{labels.layout.skipToContent}</SkipLink>
          <aside
            aria-label="Primary"
            aria-expanded={!collapsed}
            data-region="nav"
            className="dr-sidebar-layout-aside sidebar-gradient-overlay theme-transition bg-surface-sidebar"
            data-collapsed={collapsed ? "true" : undefined}
          >
            <div data-seam className="dr-sidebar-layout-aside-header">
              {collapsed ? (
                // One square is all the collapsed rail has, so the brand
                // mark and the toggle share it: the mark carries the app's
                // identity at rest and the toggle takes over on hover. The
                // button stays mounted and focusable throughout — only its
                // paint is deferred — because it is the only way back to
                // the expanded rail and a keyboard user has no hover.
                <div className="dr-sidebar-layout-brand-slot">
                  <BrandLogo collapsed />
                  {toggleButton}
                </div>
              ) : (
                <>
                  <BrandLogo collapsed={false} />
                  {toggleButton}
                </>
              )}
            </div>

            <div className="dr-sidebar-layout-search">
              <SearchCommand navItems={flatNavItems} collapsed={collapsed} />
            </div>

            {resolvedNavHeader && (
              <div data-seam className="dr-sidebar-layout-aside-section">
                {resolvedNavHeader}
              </div>
            )}

            <div className="dr-sidebar-layout-nav-scroll">
              <SidebarNav nav={nav} activeBar={activeBar} />
            </div>

            {resolvedNavFooter && (
              <div
                data-seam
                className="dr-sidebar-layout-aside-section"
                data-position="footer"
              >
                {resolvedNavFooter}
              </div>
            )}
          </aside>

          <LayoutHeader
            data-region="bar"
            nav={nav}
            sidebarHeader={resolvedNavHeader}
            sidebarFooter={resolvedNavFooter}
            sidebarActiveBar={activeBar}
            headerSlot={
              <>
                {activeBarToggle}
                {headerSlot}
              </>
            }
            className="header-gradient-overlay theme-transition"
            showLayoutSwitcher={showLayoutSwitcher}
            showThemeSwitcher={showThemeSwitcher}
            /* Search lives in the rail for this layout. */
            showSearch={false}
            user={user}
            onProfile={onProfile}
            onSettings={onSettings}
            onLogout={onLogout}
          />
          <main
            id="main-content"
            tabIndex={-1}
            data-region="content"
            className="dr-sidebar-layout-content"
            data-content
          >
            {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
