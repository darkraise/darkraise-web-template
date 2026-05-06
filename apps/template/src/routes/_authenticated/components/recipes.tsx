import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  Info,
  CircleCheck,
  TriangleAlert,
  OctagonX,
  X,
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  TrendingDown,
  PackageOpen,
  AlertTriangle,
  RefreshCw,
  Upload,
  File,
  Trash2,
  MoreHorizontal,
  Mail,
  UserPlus,
} from "lucide-react"
import { Alert, AlertTitle } from "darkraise-ui/components/alert"
import { Button } from "darkraise-ui/components/button"
import { Badge } from "darkraise-ui/components/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "darkraise-ui/components/card"
import { Avatar, AvatarFallback } from "darkraise-ui/components/avatar"
import { Input } from "darkraise-ui/components/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "darkraise-ui/components/dropdown-menu"
import { Separator } from "darkraise-ui/components/separator"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/recipes")({
  component: RecipesPage,
})

// ── Recipe 1: Notification banner ──────────────────────────────────────────

type BannerVariant = "info" | "success" | "warning" | "error"

const bannerConfig: Record<
  BannerVariant,
  {
    icon: React.ElementType
    className: string
    title: string
    description: string
  }
> = {
  info: {
    icon: Info,
    className: "border-l-4 border-l-primary bg-primary/5",
    title: "New update available",
    description: "Version 2.1.0 is ready to install.",
  },
  success: {
    icon: CircleCheck,
    className: "border-l-4 border-l-success bg-success/5",
    title: "Deployment complete",
    description: "All services are running normally.",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-l-4 border-l-warning bg-warning/5",
    title: "Storage almost full",
    description: "You have used 90% of your quota.",
  },
  error: {
    icon: OctagonX,
    className: "border-l-4 border-l-destructive bg-destructive/5",
    title: "Payment failed",
    description: "Please update your billing details.",
  },
}

function NotificationBanners() {
  const [dismissed, setDismissed] = useState<BannerVariant[]>([])
  const variants: BannerVariant[] = ["info", "success", "warning", "error"]

  return (
    <div className="space-y-2">
      {variants
        .filter((v) => !dismissed.includes(v))
        .map((variant) => {
          const {
            icon: Icon,
            className,
            title,
            description,
          } = bannerConfig[variant]
          return (
            <Alert key={variant} className={className}>
              <Icon className="h-5 w-5" />
              <AlertTitle className="flex items-center justify-between">
                <span>
                  {title}
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    {description}
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    View details
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDismissed((d) => [...d, variant])}
                    className="h-7 w-7"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </AlertTitle>
            </Alert>
          )
        })}
      {dismissed.length === variants.length && (
        <p className="text-muted-foreground text-sm">All banners dismissed.</p>
      )}
    </div>
  )
}

// ── Recipe 2: User menu card ───────────────────────────────────────────────

function UserMenuCard() {
  return (
    <Card className="max-w-sm">
      <CardContent className="flex flex-col items-center gap-3 pt-6">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">JD</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="font-semibold">Jane Doe</p>
          <p className="text-muted-foreground text-sm">jane@example.com</p>
        </div>
        <Badge variant="secondary">Admin</Badge>
      </CardContent>
      <CardFooter className="flex justify-center gap-2">
        <Button variant="outline" size="icon">
          <Mail className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <UserPlus className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

// ── Recipe 3: Search + filter toolbar ─────────────────────────────────────

function SearchFilterToolbar() {
  const [activeView, setActiveView] = useState<"grid" | "list">("grid")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input placeholder="Search..." className="pl-9" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Category ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>All</DropdownMenuItem>
          <DropdownMenuItem>Design</DropdownMenuItem>
          <DropdownMenuItem>Engineering</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Status ▾
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>All</DropdownMenuItem>
          <DropdownMenuItem>Active</DropdownMenuItem>
          <DropdownMenuItem>Archived</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="h-6" />
      <Button
        variant="ghost"
        size="icon"
        className={activeView === "grid" ? "bg-muted" : ""}
        onClick={() => setActiveView("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={activeView === "list" ? "bg-muted" : ""}
        onClick={() => setActiveView("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Recipe 4: Stat comparison row ─────────────────────────────────────────

function StatComparisonRow() {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {/* Revenue comparison */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-muted-foreground text-sm">This Month</p>
            <p className="text-2xl font-semibold">$12,450</p>
          </div>
          <Badge className="bg-success/15 text-success hover:bg-success/25">
            <TrendingUp className="mr-1 h-3 w-3" />
            +22%
          </Badge>
          <div>
            <p className="text-muted-foreground text-sm">Last Month</p>
            <p className="text-2xl font-semibold">$10,200</p>
          </div>
        </div>
        <Separator />
        {/* Orders comparison */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-muted-foreground text-sm">This Month</p>
            <p className="text-2xl font-semibold">348</p>
          </div>
          <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/25">
            <TrendingDown className="mr-1 h-3 w-3" />
            -8%
          </Badge>
          <div>
            <p className="text-muted-foreground text-sm">Last Month</p>
            <p className="text-2xl font-semibold">378</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Recipe 5: Empty state ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8">
      <PackageOpen className="text-muted-foreground h-12 w-12" />
      <p className="text-lg font-medium">No products yet</p>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        Get started by adding your first product. It will appear here once
        created.
      </p>
      <Button>Add Product</Button>
    </div>
  )
}

// ── Recipe 6: Error state ──────────────────────────────────────────────────

function ErrorState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8">
      <AlertTriangle className="text-destructive h-12 w-12" />
      <p className="text-lg font-medium">Something went wrong</p>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <Button variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}

// ── Recipe 7: Confirmation prompt ─────────────────────────────────────────

function ConfirmationPrompt() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-warning h-5 w-5 shrink-0" />
          <CardTitle>Delete this project?</CardTitle>
        </div>
        <CardDescription>
          This action is permanent and cannot be undone. All project data,
          including files and collaborators, will be removed immediately.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </CardFooter>
    </Card>
  )
}

// ── Recipe 8: File upload area ────────────────────────────────────────────

interface MockFile {
  id: number
  name: string
  size: string
}

const initialFiles: MockFile[] = [
  { id: 1, name: "design-mockup.png", size: "2.4 MB" },
  { id: 2, name: "proposal.pdf", size: "1.1 MB" },
  { id: 3, name: "photo.jpg", size: "3.8 MB" },
]

function FileUploadArea() {
  const [files, setFiles] = useState<MockFile[]>(initialFiles)

  return (
    <div className="space-y-3">
      <div className="hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors">
        <Upload className="text-muted-foreground h-10 w-10" />
        <p className="text-sm font-medium">
          Drag files here or click to browse
        </p>
        <p className="text-muted-foreground text-xs">
          PNG, JPG, PDF up to 10MB
        </p>
      </div>
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <File className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="flex-1 text-sm">{file.name}</span>
              <span className="text-muted-foreground text-xs">{file.size}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setFiles((f) => f.filter((x) => x.id !== file.id))
                }
                className="text-muted-foreground hover:text-destructive h-7 w-7"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

function RecipesPage() {
  return (
    <ShowcasePage
      title="Recipes"
      description="Cross-component compositions showing how primitives combine in real-world UIs."
    >
      <ShowcaseExample
        title="Notification banners"
        code={`import { Alert, AlertTitle } from "darkraise-ui/components/alert"

const [dismissed, setDismissed] = useState([])

{["info", "success", "warning", "error"].map((variant) => (
  <Alert key={variant} className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/30">
    <Icon className="h-5 w-5" />
    <AlertTitle className="flex items-center justify-between">
      <span>
        {title}
        <span className="ml-2 text-xs font-normal text-muted-foreground">{description}</span>
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">View details</Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDismissed((d) => [...d, variant])}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </AlertTitle>
  </Alert>
))}`}
      >
        <NotificationBanners />
      </ShowcaseExample>

      <ShowcaseExample
        title="User menu card"
        code={`<Card className="max-w-sm">
  <CardContent className="flex flex-col items-center gap-3 pt-6">
    <Avatar className="h-16 w-16">
      <AvatarFallback className="text-lg">JD</AvatarFallback>
    </Avatar>
    <div className="text-center">
      <p className="font-semibold">Jane Doe</p>
      <p className="text-sm text-muted-foreground">jane@example.com</p>
    </div>
    <Badge variant="secondary">Admin</Badge>
  </CardContent>
  <CardFooter className="flex justify-center gap-2">
    <Button variant="outline" size="icon"><Mail className="h-4 w-4" /></Button>
    <Button variant="outline" size="icon"><UserPlus className="h-4 w-4" /></Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View Profile</DropdownMenuItem>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </CardFooter>
</Card>`}
      >
        <UserMenuCard />
      </ShowcaseExample>

      <ShowcaseExample
        title="Search + filter toolbar"
        code={`const [activeView, setActiveView] = useState("grid")

<div className="flex flex-wrap items-center gap-2">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input placeholder="Search..." className="pl-9" />
  </div>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">Category ▾</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>...</DropdownMenuContent>
  </DropdownMenu>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">Status ▾</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>...</DropdownMenuContent>
  </DropdownMenu>
  <Separator orientation="vertical" className="h-6" />
  <Button variant="ghost" size="icon" className={activeView === "grid" ? "bg-muted" : ""} onClick={() => setActiveView("grid")}>
    <LayoutGrid className="h-4 w-4" />
  </Button>
  <Button variant="ghost" size="icon" className={activeView === "list" ? "bg-muted" : ""} onClick={() => setActiveView("list")}>
    <List className="h-4 w-4" />
  </Button>
</div>`}
      >
        <SearchFilterToolbar />
      </ShowcaseExample>

      <ShowcaseExample
        title="Stat comparison row"
        code={`<Card>
  <CardContent className="pt-6 space-y-4">
    <div className="flex items-center gap-6">
      <div>
        <p className="text-sm text-muted-foreground">This Month</p>
        <p className="text-2xl font-semibold">$12,450</p>
      </div>
      <Badge className="bg-success/15 text-success">
        <TrendingUp className="mr-1 h-3 w-3" /> +22%
      </Badge>
      <div>
        <p className="text-sm text-muted-foreground">Last Month</p>
        <p className="text-2xl font-semibold">$10,200</p>
      </div>
    </div>
    <Separator />
    <div className="flex items-center gap-6">
      <div>
        <p className="text-sm text-muted-foreground">This Month</p>
        <p className="text-2xl font-semibold">348</p>
      </div>
      <Badge className="bg-destructive/15 text-destructive">
        <TrendingDown className="mr-1 h-3 w-3" /> -8%
      </Badge>
      <div>
        <p className="text-sm text-muted-foreground">Last Month</p>
        <p className="text-2xl font-semibold">378</p>
      </div>
    </div>
  </CardContent>
</Card>`}
      >
        <StatComparisonRow />
      </ShowcaseExample>

      <ShowcaseExample
        title="Empty state"
        code={`<div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed gap-3 p-8">
  <PackageOpen className="h-12 w-12 text-muted-foreground" />
  <p className="text-lg font-medium">No products yet</p>
  <p className="max-w-sm text-center text-sm text-muted-foreground">
    Get started by adding your first product. It will appear here once created.
  </p>
  <Button>Add Product</Button>
</div>`}
      >
        <EmptyState />
      </ShowcaseExample>

      <ShowcaseExample
        title="Error state"
        code={`<div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed gap-3 p-8">
  <AlertTriangle className="h-12 w-12 text-destructive" />
  <p className="text-lg font-medium">Something went wrong</p>
  <p className="max-w-sm text-center text-sm text-muted-foreground">
    An unexpected error occurred. Please try again or contact support.
  </p>
  <Button variant="outline">
    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
  </Button>
</div>`}
      >
        <ErrorState />
      </ShowcaseExample>

      <ShowcaseExample
        title="Confirmation prompt"
        code={`<Card className="max-w-md">
  <CardHeader>
    <div className="flex items-center gap-3">
      <AlertTriangle className="text-warning h-5 w-5 shrink-0" />
      <CardTitle>Delete this project?</CardTitle>
    </div>
    <CardDescription>
      This action is permanent and cannot be undone. All project data,
      including files and collaborators, will be removed immediately.
    </CardDescription>
  </CardHeader>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </CardFooter>
</Card>`}
      >
        <ConfirmationPrompt />
      </ShowcaseExample>

      <ShowcaseExample
        title="File upload area"
        code={`const [files, setFiles] = useState([
  { id: 1, name: "design-mockup.png", size: "2.4 MB" },
  { id: 2, name: "proposal.pdf", size: "1.1 MB" },
  { id: 3, name: "photo.jpg", size: "3.8 MB" },
])

<div className="space-y-3">
  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 gap-2">
    <Upload className="h-10 w-10 text-muted-foreground" />
    <p className="text-sm font-medium">Drag files here or click to browse</p>
    <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
  </div>
  {files.map((file) => (
    <div key={file.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
      <File className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm">{file.name}</span>
      <span className="text-xs text-muted-foreground">{file.size}</span>
      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-7 w-7" onClick={() => setFiles((f) => f.filter((x) => x.id !== file.id))}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  ))}
</div>`}
      >
        <FileUploadArea />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
