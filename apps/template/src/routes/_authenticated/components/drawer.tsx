import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "darkraise-ui/components/drawer"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/drawer")({
  component: DrawerPage,
})

function DrawerPage() {
  return (
    <ShowcasePage
      title="Drawer"
      description="A panel that slides in from the bottom of the screen, built on Vaul."
    >
      <ShowcaseExample
        title="Basic drawer"
        code={`<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">Open Drawer</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <DrawerDescription>
        This is a basic bottom drawer. Drag it down or click outside to close.
      </DrawerDescription>
    </DrawerHeader>
    <div className="p-4">
      <p className="text-sm text-muted-foreground">Drawer body content goes here.</p>
    </div>
    <DrawerFooter>
      <DrawerClose asChild>
        <Button variant="outline">Close</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open Drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer Title</DrawerTitle>
              <DrawerDescription>
                This is a basic bottom drawer. Drag it down or click outside to
                close.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                Drawer body content goes here.
              </p>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ShowcaseExample>

      <ShowcaseExample
        title="Drawer with form"
        code={`<Drawer>
  <DrawerTrigger asChild>
    <Button>Edit Profile</Button>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Edit Profile</DrawerTitle>
      <DrawerDescription>Update your display name and email address.</DrawerDescription>
    </DrawerHeader>
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="name">Display Name</Label>
        <Input id="name" placeholder="Your name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
      </div>
    </div>
    <DrawerFooter className="flex-row justify-end gap-2">
      <DrawerClose asChild>
        <Button variant="outline">Cancel</Button>
      </DrawerClose>
      <DrawerClose asChild>
        <Button>Save Changes</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button>Edit Profile</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Profile</DrawerTitle>
              <DrawerDescription>
                Update your display name and email address.
              </DrawerDescription>
            </DrawerHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-name">Display Name</Label>
                <Input id="drawer-name" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawer-email">Email</Label>
                <Input
                  id="drawer-email"
                  type="email"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <DrawerFooter className="flex-row justify-end gap-2">
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button>Save Changes</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ShowcaseExample>

      <ShowcaseExample
        title="Scrollable drawer"
        code={`<Drawer>
  <DrawerTrigger asChild>
    <Button variant="outline">View Terms</Button>
  </DrawerTrigger>
  <DrawerContent className="max-h-[80vh]">
    <DrawerHeader>
      <DrawerTitle>Terms of Service</DrawerTitle>
      <DrawerDescription>Please read and accept the terms below.</DrawerDescription>
    </DrawerHeader>
    <div className="overflow-y-auto p-4">
      {/* long content */}
    </div>
    <DrawerFooter>
      <Button>Accept</Button>
      <DrawerClose asChild>
        <Button variant="outline">Decline</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">View Terms</Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader>
              <DrawerTitle>Terms of Service</DrawerTitle>
              <DrawerDescription>
                Please read and accept the terms below.
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto p-4">
              {Array.from({ length: 8 }, (_, i) => (
                <p key={i} className="text-muted-foreground mb-4 text-sm">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                  irure dolor in reprehenderit in voluptate velit esse cillum
                  dolore eu fugiat nulla pariatur.
                </p>
              ))}
            </div>
            <DrawerFooter>
              <Button>Accept</Button>
              <DrawerClose asChild>
                <Button variant="outline">Decline</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
