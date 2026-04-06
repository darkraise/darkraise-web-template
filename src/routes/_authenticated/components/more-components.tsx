import { createFileRoute } from "@tanstack/react-router"
import { AspectRatio } from "@/core/components/ui/aspect-ratio"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/core/components/ui/carousel"
import { Card, CardContent } from "@/core/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/core/components/ui/input-otp"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/core/components/ui/menubar"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/core/components/ui/navigation-menu"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/core/components/ui/resizable"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/more-components",
)({
  component: MoreComponentsPage,
})

function MoreComponentsPage() {
  return (
    <ShowcasePage
      title="More Components"
      description="AspectRatio, Carousel, InputOTP, Menubar, NavigationMenu, and Resizable."
    >
      <ShowcaseExample
        title="AspectRatio — 16:9 container"
        code={`<div className="w-64">
  <AspectRatio ratio={16 / 9}>
    <div className="h-full w-full rounded-md bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
      <span className="text-sm text-muted-foreground">16 / 9</span>
    </div>
  </AspectRatio>
</div>`}
      >
        <div className="w-64">
          <AspectRatio ratio={16 / 9}>
            <div className="from-primary/30 to-primary/5 flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br">
              <span className="text-muted-foreground text-sm">16 / 9</span>
            </div>
          </AspectRatio>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Carousel — horizontal card slider"
        code={`<Carousel className="w-full max-w-sm">
  <CarouselContent>
    {Array.from({ length: 5 }, (_, i) => (
      <CarouselItem key={i}>
        <Card>
          <CardContent className="flex aspect-square items-center justify-center p-6">
            <span className="text-4xl font-semibold">{i + 1}</span>
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel className="w-full max-w-sm">
          <CarouselContent>
            {Array.from({ length: 5 }, (_, i) => (
              <CarouselItem key={i}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{i + 1}</span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ShowcaseExample>

      <ShowcaseExample
        title="InputOTP — 6-digit one-time password"
        code={`<InputOTP maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`}
      >
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </ShowcaseExample>

      <ShowcaseExample
        title="Menubar — application-style menu bar"
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

      <ShowcaseExample
        title="NavigationMenu — site navigation with dropdown"
        code={`<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Products</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-48 gap-1 p-2">
          <li><NavigationMenuLink href="#">Overview</NavigationMenuLink></li>
          <li><NavigationMenuLink href="#">Pricing</NavigationMenuLink></li>
          <li><NavigationMenuLink href="#">Changelog</NavigationMenuLink></li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
        Docs
      </NavigationMenuLink>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
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

      <ShowcaseExample
        title="Resizable — two-panel horizontal layout"
        code={`<ResizablePanelGroup orientation="horizontal" className="h-40 rounded-md border">
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Left panel</span>
    </div>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={50}>
    <div className="flex h-full items-center justify-center p-4">
      <span className="text-sm text-muted-foreground">Right panel</span>
    </div>
  </ResizablePanel>
</ResizablePanelGroup>`}
      >
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-40 rounded-md border"
        >
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-muted-foreground text-sm">Left panel</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-4">
              <span className="text-muted-foreground text-sm">Right panel</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
