import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@components/navigation-menu"

const meta: Meta<typeof NavigationMenu> = {
  title: "UI/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof NavigationMenu>

export const Basic: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-2 p-3 text-sm">
              <li>
                <NavigationMenuLink href="#">
                  Component library
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">Theme engine</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">
                  Form primitives
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-72 gap-2 p-3 text-sm">
              <li>
                <NavigationMenuLink href="#">Docs</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#">GitHub</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}
