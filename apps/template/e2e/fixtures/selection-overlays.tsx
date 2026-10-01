import { createRoot } from "react-dom/client"
import { ChevronDown } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "darkraise-ui/components/alert-dialog"
import { Button } from "darkraise-ui/components/button"
import {
  Combobox,
  ComboboxControl,
  ComboboxInput,
  ComboboxTrigger,
} from "darkraise-ui/components/combobox"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "darkraise-ui/components/input-otp"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "darkraise-ui/components/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import { SidebarNav, SidebarProvider, type NavGroup } from "darkraise-ui/layout"
import {
  RouterAdapterProvider,
  type RouterAdapter,
  type RouterLinkProps,
} from "darkraise-ui/router"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const ITEMS = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
]

// The adapter applies the active class itself, as a router would, so
// "Dashboard" (the current path) is the active link and "Settings" is idle.
const PATHNAME = "/"
const ADAPTER: RouterAdapter = {
  Link: ({
    to,
    className,
    activeClassName,
    style,
    children,
  }: RouterLinkProps) => (
    <a
      href={to}
      className={
        to === PATHNAME
          ? [className, activeClassName].filter(Boolean).join(" ")
          : className
      }
      aria-current={to === PATHNAME ? "page" : undefined}
      style={style}
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </a>
  ),
  useNavigate: () => () => {},
  usePathname: () => PATHNAME,
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

const NAV: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Settings", href: "/settings" },
    ],
  },
]

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        padding: 24,
        alignItems: "flex-start",
      }}
    >
      {/* Colour probes: computed style resolves each token to rgb(). */}
      <div
        data-testid="primary-fill"
        style={{ width: 1, height: 1, background: "hsl(var(--primary-fill))" }}
      />
      <div
        data-testid="view-bg"
        style={{ width: 1, height: 1, background: "var(--selected-view-bg)" }}
      />
      <div data-probe="tabs">
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
            <TabsTrigger value="two">Two</TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel</TabsContent>
          <TabsContent value="two">Second panel</TabsContent>
        </Tabs>
      </div>
      <div data-probe="otp">
        <InputOTP maxLength={3} aria-label="Code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div data-probe="combobox" style={{ width: 200 }}>
        <Combobox items={ITEMS} placeholder="Search">
          <ComboboxControl>
            <ComboboxInput aria-label="Search" />
            <ComboboxTrigger>
              <ChevronDown className="h-3.5 w-3.5" />
            </ComboboxTrigger>
          </ComboboxControl>
        </Combobox>
      </div>
      <div data-probe="sidebar" style={{ width: 240 }}>
        <RouterAdapterProvider value={ADAPTER}>
          <SidebarProvider collapsed={false}>
            <SidebarNav nav={NAV} />
          </SidebarProvider>
        </RouterAdapterProvider>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>Open alert</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete the file?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open sheet</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the list.</SheetDescription>
        </SheetContent>
      </Sheet>
    </div>
  </ThemeProvider>,
)
