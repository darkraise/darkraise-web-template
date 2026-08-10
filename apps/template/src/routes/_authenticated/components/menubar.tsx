import { createFileRoute } from "@tanstack/react-router"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "darkraise-ui/components/menubar"
import type { MenubarSide, MenubarAlign } from "darkraise-ui/components/menubar"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/menubar")({
  component: MenubarPage,
})

const MENUBAR_SIDES = allOf<MenubarSide>()("top", "right", "bottom", "left")

const MENUBAR_ALIGNS = allOf<MenubarAlign>()("start", "center", "end")

function MenubarPage() {
  return (
    <ShowcasePage
      title="Menubar"
      description="Application-style menu bar — a row of top-level menus that open dropdowns. Use for desktop-style toolbars; once a menu is open, hovering siblings switches between them without re-clicking."
    >
      <ShowcaseExample
        title="Side x align"
        code={`// One representative cell: every side x align combination renders above.
// Each cell is a live Menubar; click its trigger to see that placement.
<Menubar>
  <MenubarMenu>
    <MenubarTrigger>right/end</MenubarTrigger>
    <MenubarContent side="right" align="end">
      <MenubarItem>side=right align=end</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}
      >
        <VariantMatrix
          rows={{ label: "side", values: MENUBAR_SIDES }}
          cols={{ label: "align", values: MENUBAR_ALIGNS }}
          render={(side, align) => (
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>
                  {side}/{align}
                </MenubarTrigger>
                <MenubarContent side={side} align={align}>
                  <MenubarItem>
                    side={side} align={align}
                  </MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="File / Edit / View"
        code={`<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New File</MenubarItem>
      <MenubarItem>Open...</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Save</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>Edit</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Undo</MenubarItem>
      <MenubarItem>Redo</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Cut</MenubarItem>
      <MenubarItem>Copy</MenubarItem>
      <MenubarItem>Paste</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu>
    <MenubarTrigger>View</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Zoom In</MenubarItem>
      <MenubarItem>Zoom Out</MenubarItem>
      <MenubarSeparator />
      <MenubarItem>Toggle Sidebar</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}
      >
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New File</MenubarItem>
              <MenubarItem>Open...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Save</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              <MenubarItem>Redo</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Cut</MenubarItem>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Zoom In</MenubarItem>
              <MenubarItem>Zoom Out</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Toggle Sidebar</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
