import { useState } from "react"
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

function MultiStepDialogExample() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("Developer")
  const [open, setOpen] = useState(false)

  const totalSteps = 3

  function reset() {
    setStep(1)
    setName("")
    setEmail("")
    setRole("Developer")
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) reset()
  }

  const stepCircle = (n: number) => {
    const active = step === n
    const done = step > n
    const cls =
      active || done
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground"
    return (
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${cls}`}
      >
        {n}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Multi-step Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-0 py-2">
          {stepCircle(1)}
          <div className="bg-border h-0.5 w-12" />
          {stepCircle(2)}
          <div className="bg-border h-0.5 w-12" />
          {stepCircle(3)}
        </div>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ms-name">Name</Label>
                <Input
                  id="ms-name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-email">Email</Label>
                <Input
                  id="ms-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-2">
                {["Developer", "Designer", "Manager"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      role === r
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 rounded-md border p-4 text-sm">
              <p className="font-medium">Review your details</p>
              <div className="text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">Name:</span>{" "}
                  {name || "—"}
                </p>
                <p>
                  <span className="text-foreground font-medium">Email:</span>{" "}
                  {email || "—"}
                </p>
                <p>
                  <span className="text-foreground font-medium">Role:</span>{" "}
                  {role}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < totalSteps ? (
            <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>Finish</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TypeToConfirmExample() {
  const [value, setValue] = useState("")
  const [open, setOpen] = useState(false)
  const target = "my-project"

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) setValue("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>
            This action is permanent. All repositories, pipelines, and data
            associated with this project will be destroyed and cannot be
            recovered.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder={target}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Type{" "}
            <span className="text-foreground font-mono font-medium">
              {target}
            </span>{" "}
            to confirm.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={value !== target}
            onClick={() => handleOpenChange(false)}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
                <p className="text-muted-foreground text-sm">
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
                <p className="text-muted-foreground mt-4 text-sm">
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
                <p className="text-muted-foreground mt-4 text-sm">
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
                  <p className="text-muted-foreground text-xs">
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

        <ShowcaseExample
          title="Dialog — multi-step wizard"
          code={`function MultiStepDialogExample() {
  const [step, setStep] = useState(1)
  // ... state for name, email, role

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Multi-step Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>Step {step} of 3</DialogDescription>
        </DialogHeader>
        {/* Step indicator */}
        {/* Step content */}
        <DialogFooter>
          <Button variant="outline" disabled={step === 1}>Back</Button>
          {step < 3 ? <Button>Next</Button> : <Button>Finish</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`}
        >
          <MultiStepDialogExample />
        </ShowcaseExample>

        <ShowcaseExample
          title="Dialog — type-to-confirm deletion"
          code={`function TypeToConfirmExample() {
  const [value, setValue] = useState("")
  const target = "my-project"

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project?</DialogTitle>
          <DialogDescription>This action is permanent...</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Type <span className="font-mono">{target}</span> to confirm.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive" disabled={value !== target}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`}
        >
          <TypeToConfirmExample />
        </ShowcaseExample>

        <ShowcaseExample
          title="Dialog — full-screen scrollable"
          code={`<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Full Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Terms of Service</DialogTitle>
      <DialogDescription>Last updated January 1, 2025</DialogDescription>
    </DialogHeader>
    {/* Long content */}
    <DialogFooter>
      <Button variant="outline">Decline</Button>
      <Button>Accept</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Full Dialog</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Terms of Service</DialogTitle>
                <DialogDescription>
                  Last updated January 1, 2025
                </DialogDescription>
              </DialogHeader>
              <div className="text-muted-foreground space-y-4 text-sm">
                <p>
                  By accessing or using this platform, you agree to be bound by
                  these Terms of Service and all applicable laws and
                  regulations. If you do not agree with any of these terms, you
                  are prohibited from using or accessing this site. The
                  materials contained herein are protected by applicable
                  copyright and trademark law.
                </p>
                <p>
                  We reserve the right to modify or replace these Terms at any
                  time at our sole discretion. We will provide at least 30 days
                  notice prior to any new terms taking effect. What constitutes
                  a material change will be determined at our sole discretion.
                  By continuing to access or use our service after those
                  revisions become effective, you agree to be bound by the
                  revised terms.
                </p>
                <p>
                  Your use of the service is also governed by our Privacy
                  Policy, which is incorporated into these Terms by reference.
                  Our Privacy Policy describes how we collect, use, and share
                  information about you when you use our services. You
                  acknowledge that you have read and understood our Privacy
                  Policy.
                </p>
                <p>
                  You may not use our service for any illegal or unauthorized
                  purpose nor may you, in the use of the service, violate any
                  laws in your jurisdiction. You must not transmit any worms or
                  viruses or any code of a destructive nature. A breach or
                  violation of any of the Terms will result in an immediate
                  termination of your account and access to our services without
                  notice or liability.
                </p>
                <p>
                  In no event shall we, our directors, employees, partners,
                  agents, suppliers, or affiliates, be liable for any indirect,
                  incidental, special, consequential, or punitive damages,
                  including without limitation, loss of profits, data, use,
                  goodwill, or other intangible losses, resulting from your
                  access to or use of (or inability to access or use) the
                  service.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Decline</Button>
                <Button>Accept</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ShowcaseExample>

        <ShowcaseExample
          title="Sheet — edit profile form"
          code={`<Sheet>
  <SheetTrigger asChild>
    <Button variant="outline">Edit Profile</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Edit Profile</SheetTitle>
    </SheetHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="sp-name">Name</Label>
        <Input id="sp-name" defaultValue="Jane Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sp-email">Email</Label>
        <Input id="sp-email" type="email" defaultValue="jane@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sp-bio">Bio</Label>
        <Input id="sp-bio" placeholder="Tell us about yourself..." />
      </div>
    </div>
    <SheetFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save Changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}
        >
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Edit Profile</SheetTitle>
                <SheetDescription>
                  Update your public profile information.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sp-name">Name</Label>
                  <Input id="sp-name" defaultValue="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-email">Email</Label>
                  <Input
                    id="sp-email"
                    type="email"
                    defaultValue="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-bio">Bio</Label>
                  <Input id="sp-bio" placeholder="Tell us about yourself..." />
                </div>
              </div>
              <SheetFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ShowcaseExample>
      </div>
    </div>
  )
}
