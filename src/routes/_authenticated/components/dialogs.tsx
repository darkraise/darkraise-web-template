import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/core/components/ui/sheet"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/core/components/ui/tooltip"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/dialogs")({
  component: DialogsPage,
})

function DialogsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Dialogs" },
        ]}
        title="Dialogs & Overlays"
        description="Modal dialogs, side sheets, anchored popovers, and hover tooltips."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Dialog — modal confirmation"
          code={`<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is the dialog description.
      </DialogDescription>
    </DialogHeader>
    <p className="text-sm text-muted-foreground">
      Dialog body content goes here.
    </p>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
        >
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is the dialog description. Use it to give context about
                    what the user is confirming or interacting with.
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Dialog body content goes here. This can include forms, info,
                  or any other content.
                </p>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete Item</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The item will be permanently
                    deleted from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>Edit Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Update your profile details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="dialog-name">Name</Label>
                    <Input id="dialog-name" defaultValue="Jane Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dialog-email">Email</Label>
                    <Input
                      id="dialog-email"
                      type="email"
                      defaultValue="jane@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Sheet — side panel"
          code={`// Default side is "right"; also accepts "left", "top", "bottom"
<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Open Sheet (right)</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Panel</SheetTitle>
      <SheetDescription>
        A side panel for contextual actions or detail views.
      </SheetDescription>
    </SheetHeader>
    <p className="mt-4 text-sm text-muted-foreground">
      Sheet content appears here.
    </p>
    <SheetFooter className="mt-4">
      <Button>Apply</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
        >
          <div className="flex flex-wrap gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet (right)</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet Panel</SheetTitle>
                  <SheetDescription>
                    A side panel for contextual actions or detailed views.
                  </SheetDescription>
                </SheetHeader>
                <p className="mt-4 text-sm text-muted-foreground">
                  Sheet content appears here. Typically used for filters, detail
                  views, or settings panels.
                </p>
                <SheetFooter className="mt-4">
                  <Button>Apply</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet (left)</Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Left Sheet</SheetTitle>
                  <SheetDescription>
                    This panel slides in from the left.
                  </SheetDescription>
                </SheetHeader>
                <p className="mt-4 text-sm text-muted-foreground">
                  Use side="left" for navigation drawers or secondary menus.
                </p>
              </SheetContent>
            </Sheet>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Popover — anchored floating panel"
          code={`<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-64">
    <p className="text-sm font-medium">Popover Title</p>
    <p className="text-xs text-muted-foreground">
      Popovers float anchored to their trigger element.
    </p>
  </PopoverContent>
</Popover>`}
        >
          <div className="flex flex-wrap gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Popover Title</p>
                  <p className="text-xs text-muted-foreground">
                    Popovers appear anchored to their trigger element and float
                    above the page content.
                  </p>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Form Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-3">
                  <p className="text-sm font-medium">Quick Update</p>
                  <div className="space-y-2">
                    <Label htmlFor="pop-name">Name</Label>
                    <Input id="pop-name" placeholder="Enter name..." />
                  </div>
                  <Button size="sm" className="w-full">
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Tooltip — hover label"
          code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>This is a tooltip</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}
        >
          <TooltipProvider>
            <div className="flex flex-wrap gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover for Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    ?
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Help information shown on hover</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Danger
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>This action is irreversible</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </ShowcaseExample>
      </div>
    </div>
  )
}
