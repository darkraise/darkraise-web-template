import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Bold, Download, Italic, Underline } from "lucide-react"
import { AspectRatio } from "darkraise-ui/components/aspect-ratio"
import { Banner } from "darkraise-ui/components/banner"
import { Button } from "darkraise-ui/components/button"
import { ButtonGroup } from "darkraise-ui/components/button-group"
import { Card, CardContent } from "darkraise-ui/components/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "darkraise-ui/components/carousel"
import { DownloadTrigger } from "darkraise-ui/components/download-trigger"
import { Fieldset, FieldsetLegend } from "darkraise-ui/components/fieldset"
import { Input } from "darkraise-ui/components/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "darkraise-ui/components/input-otp"
import { Kbd } from "darkraise-ui/components/kbd"
import { Label } from "darkraise-ui/components/label"
import { Marquee } from "darkraise-ui/components/marquee"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "darkraise-ui/components/menubar"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "darkraise-ui/components/navigation-menu"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "darkraise-ui/components/resizable"
import { Spinner } from "darkraise-ui/components/spinner"
import {
  Stat,
  StatChange,
  StatLabel,
  StatValue,
} from "darkraise-ui/components/stat"
import { Toggle } from "darkraise-ui/components/toggle"
import { Toolbar, ToolbarSeparator } from "darkraise-ui/components/toolbar"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/more-components",
)({
  component: MoreComponentsPage,
})

function DismissibleBannerExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="space-y-3">
      {visible ? (
        <Banner variant="info" dismissible onDismiss={() => setVisible(false)}>
          A new version is available. Refresh to update.
        </Banner>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
          Show banner
        </Button>
      )}
    </div>
  )
}

function MoreComponentsPage() {
  const textBlob = new Blob(["Hello from Darkraise!\n"], { type: "text/plain" })
  const jsonBlob = new Blob(
    [JSON.stringify({ hello: "world", count: 42 }, null, 2)],
    { type: "application/json" },
  )
  return (
    <ShowcasePage
      title="More Components"
      description="Aggregate showcase of primitives without dedicated demo routes."
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
        title="Banner — variants row"
        code={`<div className="flex flex-col gap-3">
  <Banner variant="default">Default — neutral status message.</Banner>
  <Banner variant="info">Info — informational notice.</Banner>
  <Banner variant="success">Success — operation completed.</Banner>
  <Banner variant="warning">Warning — review before continuing.</Banner>
  <Banner variant="destructive">Destructive — action failed.</Banner>
</div>`}
      >
        <div className="flex flex-col gap-3">
          <Banner variant="default">Default — neutral status message.</Banner>
          <Banner variant="info">Info — informational notice.</Banner>
          <Banner variant="success">Success — operation completed.</Banner>
          <Banner variant="warning">Warning — review before continuing.</Banner>
          <Banner variant="destructive">Destructive — action failed.</Banner>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Banner — dismissible"
        code={`function DismissibleBannerExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="space-y-3">
      {visible ? (
        <Banner variant="info" dismissible onDismiss={() => setVisible(false)}>
          A new version is available. Refresh to update.
        </Banner>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
          Show banner
        </Button>
      )}
    </div>
  )
}`}
      >
        <DismissibleBannerExample />
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
        title="ButtonGroup — horizontal"
        code={`<ButtonGroup>
  <Button variant="outline">Left</Button>
  <Button variant="outline">Center</Button>
  <Button variant="outline">Right</Button>
</ButtonGroup>`}
      >
        <ButtonGroup>
          <Button variant="outline">Left</Button>
          <Button variant="outline">Center</Button>
          <Button variant="outline">Right</Button>
        </ButtonGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="ButtonGroup — vertical"
        code={`<ButtonGroup orientation="vertical">
  <Button variant="outline">Top</Button>
  <Button variant="outline">Middle</Button>
  <Button variant="outline">Bottom</Button>
</ButtonGroup>`}
      >
        <ButtonGroup orientation="vertical">
          <Button variant="outline">Top</Button>
          <Button variant="outline">Middle</Button>
          <Button variant="outline">Bottom</Button>
        </ButtonGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="DownloadTrigger — text file"
        code={`const textBlob = new Blob(["Hello from Darkraise!\\n"], {
  type: "text/plain",
})

<DownloadTrigger data={textBlob} fileName="hello.txt" variant="outline">
  <Download className="size-4" />
  Download text
</DownloadTrigger>`}
      >
        <DownloadTrigger data={textBlob} fileName="hello.txt" variant="outline">
          <Download className="size-4" />
          Download text
        </DownloadTrigger>
      </ShowcaseExample>

      <ShowcaseExample
        title="DownloadTrigger — JSON file"
        code={`const jsonBlob = new Blob(
  [JSON.stringify({ hello: "world", count: 42 }, null, 2)],
  { type: "application/json" },
)

<DownloadTrigger
  data={jsonBlob}
  fileName="data.json"
  mimeType="application/json"
  variant="outline"
>
  <Download className="size-4" />
  Download JSON
</DownloadTrigger>`}
      >
        <DownloadTrigger
          data={jsonBlob}
          fileName="data.json"
          mimeType="application/json"
          variant="outline"
        >
          <Download className="size-4" />
          Download JSON
        </DownloadTrigger>
      </ShowcaseExample>

      <ShowcaseExample
        title="Fieldset — with form fields"
        code={`<Fieldset className="max-w-sm">
  <FieldsetLegend>Account</FieldsetLegend>
  <div className="grid gap-3">
    <div className="grid gap-2">
      <Label htmlFor="fs-email">Email</Label>
      <Input id="fs-email" type="email" placeholder="you@example.com" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="fs-password">Password</Label>
      <Input id="fs-password" type="password" placeholder="••••••••" />
    </div>
  </div>
</Fieldset>`}
      >
        <Fieldset className="max-w-sm">
          <FieldsetLegend>Account</FieldsetLegend>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="fs-email">Email</Label>
              <Input id="fs-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fs-password">Password</Label>
              <Input id="fs-password" type="password" placeholder="••••••••" />
            </div>
          </div>
        </Fieldset>
      </ShowcaseExample>

      <ShowcaseExample
        title="Fieldset — disabled propagation"
        code={`<Fieldset disabled className="max-w-sm">
  <FieldsetLegend>Account (disabled)</FieldsetLegend>
  <div className="grid gap-3">
    <div className="grid gap-2">
      <Label htmlFor="fs-email-d">Email</Label>
      <Input id="fs-email-d" type="email" placeholder="you@example.com" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="fs-password-d">Password</Label>
      <Input id="fs-password-d" type="password" placeholder="••••••••" />
    </div>
  </div>
</Fieldset>`}
      >
        <Fieldset disabled className="max-w-sm">
          <FieldsetLegend>Account (disabled)</FieldsetLegend>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="fs-email-d">Email</Label>
              <Input
                id="fs-email-d"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fs-password-d">Password</Label>
              <Input
                id="fs-password-d"
                type="password"
                placeholder="••••••••"
              />
            </div>
          </div>
        </Fieldset>
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
        title="Kbd — single keys"
        code={`<div className="flex flex-wrap items-center gap-2 text-sm">
  <Kbd>⌘K</Kbd>
  <Kbd>Esc</Kbd>
  <Kbd>Enter</Kbd>
</div>`}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Kbd>⌘K</Kbd>
          <Kbd>Esc</Kbd>
          <Kbd>Enter</Kbd>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Kbd — combos"
        code={`<div className="text-muted-foreground flex flex-col gap-2 text-sm">
  <p>
    Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette.
  </p>
  <p>
    Use <Kbd>Shift</Kbd> + <Kbd>?</Kbd> to view the keyboard shortcuts.
  </p>
</div>`}
      >
        <div className="text-muted-foreground flex flex-col gap-2 text-sm">
          <p>
            Press <Kbd>⌘</Kbd> + <Kbd>K</Kbd> to open the command palette.
          </p>
          <p>
            Use <Kbd>Shift</Kbd> + <Kbd>?</Kbd> to view the keyboard shortcuts.
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Marquee — default"
        code={`<Marquee className="text-muted-foreground text-sm">
  {["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map((b) => (
    <span key={b} className="mx-6 font-semibold tracking-wide uppercase">
      {b}
    </span>
  ))}
</Marquee>`}
      >
        <Marquee className="text-muted-foreground text-sm">
          {["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map(
            (b) => (
              <span
                key={b}
                className="mx-6 font-semibold tracking-wide uppercase"
              >
                {b}
              </span>
            ),
          )}
        </Marquee>
      </ShowcaseExample>

      <ShowcaseExample
        title="Marquee — pause on hover, reversed"
        code={`<Marquee
  pauseOnHover
  reverse
  className="text-muted-foreground text-sm"
>
  {["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map((b) => (
    <span key={b} className="mx-6 font-semibold tracking-wide uppercase">
      {b}
    </span>
  ))}
</Marquee>`}
      >
        <Marquee pauseOnHover reverse className="text-muted-foreground text-sm">
          {["Acme", "Globex", "Initech", "Umbrella", "Stark", "Wayne"].map(
            (b) => (
              <span
                key={b}
                className="mx-6 font-semibold tracking-wide uppercase"
              >
                {b}
              </span>
            ),
          )}
        </Marquee>
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

      <ShowcaseExample
        title="Spinner — sizes"
        code={`<div className="flex items-center gap-6">
  <Spinner size="sm" />
  <Spinner size="md" />
  <Spinner size="lg" />
</div>`}
      >
        <div className="flex items-center gap-6">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Spinner — variants"
        code={`<div className="flex items-center gap-6">
  <Spinner variant="default" />
  <Spinner variant="primary" />
  <Spinner variant="muted" />
</div>`}
      >
        <div className="flex items-center gap-6">
          <Spinner variant="default" />
          <Spinner variant="primary" />
          <Spinner variant="muted" />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stat — single"
        code={`<Stat>
  <StatLabel>Revenue</StatLabel>
  <StatValue>$45,231</StatValue>
  <StatChange direction="up">+12.5%</StatChange>
</Stat>`}
      >
        <Stat>
          <StatLabel>Revenue</StatLabel>
          <StatValue>$45,231</StatValue>
          <StatChange direction="up">+12.5%</StatChange>
        </Stat>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stat — grid"
        code={`<div className="grid gap-4 sm:grid-cols-3">
  <Stat>
    <StatLabel>Revenue</StatLabel>
    <StatValue>$45,231</StatValue>
    <StatChange direction="up">+12.5%</StatChange>
  </Stat>
  <Stat>
    <StatLabel>Active Users</StatLabel>
    <StatValue>1,284</StatValue>
    <StatChange direction="up">+3.1%</StatChange>
  </Stat>
  <Stat>
    <StatLabel>Conversion</StatLabel>
    <StatValue>4.7%</StatValue>
    <StatChange direction="down">−0.4%</StatChange>
  </Stat>
</div>`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat>
            <StatLabel>Revenue</StatLabel>
            <StatValue>$45,231</StatValue>
            <StatChange direction="up">+12.5%</StatChange>
          </Stat>
          <Stat>
            <StatLabel>Active Users</StatLabel>
            <StatValue>1,284</StatValue>
            <StatChange direction="up">+3.1%</StatChange>
          </Stat>
          <Stat>
            <StatLabel>Conversion</StatLabel>
            <StatValue>4.7%</StatValue>
            <StatChange direction="down">−0.4%</StatChange>
          </Stat>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toolbar — formatting"
        code={`<Toolbar>
  <Toggle aria-label="Bold">
    <Bold className="size-4" />
  </Toggle>
  <Toggle aria-label="Italic">
    <Italic className="size-4" />
  </Toggle>
  <ToolbarSeparator />
  <Toggle aria-label="Underline">
    <Underline className="size-4" />
  </Toggle>
</Toolbar>`}
      >
        <Toolbar>
          <Toggle aria-label="Bold">
            <Bold className="size-4" />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic className="size-4" />
          </Toggle>
          <ToolbarSeparator />
          <Toggle aria-label="Underline">
            <Underline className="size-4" />
          </Toggle>
        </Toolbar>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toolbar — vertical"
        code={`<Toolbar orientation="vertical">
  <Toggle aria-label="Bold">
    <Bold className="size-4" />
  </Toggle>
  <Toggle aria-label="Italic">
    <Italic className="size-4" />
  </Toggle>
  <ToolbarSeparator orientation="horizontal" />
  <Toggle aria-label="Underline">
    <Underline className="size-4" />
  </Toggle>
</Toolbar>`}
      >
        <Toolbar orientation="vertical">
          <Toggle aria-label="Bold">
            <Bold className="size-4" />
          </Toggle>
          <Toggle aria-label="Italic">
            <Italic className="size-4" />
          </Toggle>
          <ToolbarSeparator orientation="horizontal" />
          <Toggle aria-label="Underline">
            <Underline className="size-4" />
          </Toggle>
        </Toolbar>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
