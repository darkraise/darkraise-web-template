import { createFileRoute } from "@tanstack/react-router"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "darkraise-ui/components/navigation-menu"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/navigation-menu",
)({
  component: NavigationMenuPage,
})

function NavigationMenuPage() {
  return (
    <ShowcasePage
      title="Navigation Menu"
      description="Top-level site navigation with optional dropdown content. Each item is either a direct link or a trigger that opens a content panel below the bar."
    >
      <ShowcaseExample
        title="Site navigation with dropdown"
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-48 gap-1 p-2">
          <li>
            <NavigationMenuLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className="hover:bg-accent block rounded px-3 py-1.5 text-sm"
            >
              Overview
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className="hover:bg-accent block rounded px-3 py-1.5 text-sm"
            >
              Pricing
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink
              href="#"
              onClick={(e) => e.preventDefault()}
              className="hover:bg-accent block rounded px-3 py-1.5 text-sm"
            >
              Changelog
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink
        className={navigationMenuTriggerStyle()}
        href="#"
        onClick={(e) => e.preventDefault()}
      >
        Docs
      </NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink
        className={navigationMenuTriggerStyle()}
        href="#"
        onClick={(e) => e.preventDefault()}
      >
        Blog
      </NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>`}
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-48 gap-1 p-2">
                  <li>
                    <NavigationMenuLink
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="hover:bg-accent block rounded px-3 py-1.5 text-sm"
                    >
                      Overview
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="hover:bg-accent block rounded px-3 py-1.5 text-sm"
                    >
                      Pricing
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="hover:bg-accent block rounded px-3 py-1.5 text-sm"
                    >
                      Changelog
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Blog
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
