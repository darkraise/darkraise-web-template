import { createFileRoute } from "@tanstack/react-router"
import { Inbox, FileText, Send, Plus } from "lucide-react"
import { Badge } from "darkraise-ui/components/badge"
import { Button } from "darkraise-ui/components/button"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tabs")({
  component: TabsPage,
})

const VARIANTS = ["default", "outline", "underline", "enclosed"] as const
const COLORS = ["default", "accent"] as const
const ORIENTATIONS = ["horizontal", "vertical"] as const

// `color="accent"` retints neutral chrome to the brand hue, so only the
// enclosed variant has anywhere to take it. The other three already draw
// their active tab in the primary colour at the default setting.
const ACCENT_AWARE_VARIANTS = new Set<string>(["enclosed"])

function MatrixCell({
  variant,
  color,
  orientation,
}: {
  variant: (typeof VARIANTS)[number]
  color: (typeof COLORS)[number]
  orientation: (typeof ORIENTATIONS)[number]
}) {
  const redundant = color === "accent" && !ACCENT_AWARE_VARIANTS.has(variant)

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <p className="text-muted-foreground font-mono text-[11px]">
        color=&quot;{color}&quot;
      </p>
      <Tabs
        variant={variant}
        color={color}
        orientation={orientation}
        defaultValue="one"
      >
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
          <TabsTrigger value="three">Three</TabsTrigger>
        </TabsList>
        <TabsContent value="one">
          <p className="text-muted-foreground text-sm">First panel.</p>
        </TabsContent>
        <TabsContent value="two">
          <p className="text-muted-foreground text-sm">Second panel.</p>
        </TabsContent>
        <TabsContent value="three">
          <p className="text-muted-foreground text-sm">Third panel.</p>
        </TabsContent>
      </Tabs>
      {redundant ? (
        <p className="text-muted-foreground/70 text-[11px]">
          Identical to the default colour — this variant already draws its
          active tab in the primary hue.
        </p>
      ) : null}
    </div>
  )
}

function TabsMatrix() {
  return (
    <div className="space-y-10">
      {ORIENTATIONS.map((orientation) => (
        <div key={orientation} className="space-y-6">
          <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
            {orientation}
          </p>
          {VARIANTS.map((variant) => (
            <div key={variant} className="space-y-3">
              <p className="text-muted-foreground font-mono text-[11px]">
                variant=&quot;{variant}&quot;
              </p>
              <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                {COLORS.map((color) => (
                  <MatrixCell
                    key={color}
                    variant={variant}
                    color={color}
                    orientation={orientation}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function TabsPage() {
  return (
    <ShowcasePage
      title="Tabs"
      description="Organize related content into switchable panels within the same page context."
    >
      <ShowcaseExample
        title="Basic tabs"
        code={`<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="mt-4">
    Overview content...
  </TabsContent>
  <TabsContent value="details" className="mt-4">
    Details content...
  </TabsContent>
  <TabsContent value="settings" className="mt-4">
    Settings content...
  </TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <p className="text-muted-foreground text-sm">
              This is the Overview tab. Tabs are used to organize content into
              distinct sections within the same page context.
            </p>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <p className="text-muted-foreground text-sm">
              This is the Details tab. Each panel is only rendered when its tab
              is active, keeping the initial render lightweight.
            </p>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <p className="text-muted-foreground text-sm">
              This is the Settings tab. You can place forms, data, or any other
              components inside a tab panel.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Outline variant — bordered active tab"
        code={`<Tabs variant="outline" defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="mt-4">
    Overview content...
  </TabsContent>
</Tabs>`}
      >
        <Tabs variant="outline" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <p className="text-muted-foreground text-sm">
              The outline variant uses individually bordered triggers; the
              active tab switches its border and text to the primary colour
              while staying transparent — matching the toggle outline style.
            </p>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Details panel rendered only while its tab is active.
            </p>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Settings panel content.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Underline variant — underlined active tab"
        code={`<Tabs variant="underline" defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="mt-4">
    Overview content...
  </TabsContent>
</Tabs>`}
      >
        <Tabs variant="underline" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <p className="text-muted-foreground text-sm">
              The underline variant drops the track entirely and signals the
              active tab with a primary-coloured bottom border — useful when
              tabs sit directly on top of page content.
            </p>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Details panel rendered only while its tab is active.
            </p>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Settings panel content.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Enclosed variant — folder tab joined to the panel"
        code={`<Tabs variant="enclosed" defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    Overview content...
  </TabsContent>
</Tabs>`}
      >
        <Tabs variant="enclosed" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-muted-foreground text-sm">
              The active tab drops its bottom border and its fill erases the
              strip's baseline, so the tab and the panel below read as one
              continuous surface.
            </p>
          </TabsContent>
          <TabsContent value="details">
            <p className="text-muted-foreground text-sm">
              Details panel rendered only while its tab is active.
            </p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-muted-foreground text-sm">
              Settings panel content.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Variant × colour × orientation matrix"
        code={`<Tabs
  variant={variant}          // "default" | "outline" | "underline" | "enclosed"
  color={color}              // "default" | "accent"
  orientation={orientation}  // "horizontal" | "vertical"
  defaultValue="one"
>
  <TabsList>
    <TabsTrigger value="one">One</TabsTrigger>
    <TabsTrigger value="two">Two</TabsTrigger>
    <TabsTrigger value="three">Three</TabsTrigger>
  </TabsList>
  <TabsContent value="one">First panel.</TabsContent>
  <TabsContent value="two">Second panel.</TabsContent>
  <TabsContent value="three">Third panel.</TabsContent>
</Tabs>`}
      >
        <TabsMatrix />
      </ShowcaseExample>

      <ShowcaseExample
        title="Tabs with card content"
        code={`<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Update your account settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* form fields */}
      </CardContent>
    </Card>
  </TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>
                  Update your account settings below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tab-name">Name</Label>
                  <Input id="tab-name" defaultValue="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tab-email">Email</Label>
                  <Input
                    id="tab-email"
                    type="email"
                    defaultValue="jane@example.com"
                  />
                </div>
                <Button size="sm">Save Account</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tab-current-pw">Current password</Label>
                  <Input id="tab-current-pw" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tab-new-pw">New password</Label>
                  <Input id="tab-new-pw" type="password" />
                </div>
                <Button size="sm">Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="With a disabled tab"
        code={`<Tabs defaultValue="published">
  <TabsList>
    <TabsTrigger value="published">Published</TabsTrigger>
    <TabsTrigger value="draft">Draft</TabsTrigger>
    <TabsTrigger value="archived" disabled>Archived</TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue="published">
          <TabsList>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="archived" disabled>
              Archived
            </TabsTrigger>
          </TabsList>
          <TabsContent value="published" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Showing published content.
            </p>
          </TabsContent>
          <TabsContent value="draft" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Showing draft content.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Tabs with icons and count badges"
        code={`<Tabs defaultValue="inbox">
  <TabsList>
    <TabsTrigger value="inbox">
      <Inbox className="h-4 w-4" />
      Inbox
      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">12</Badge>
    </TabsTrigger>
    <TabsTrigger value="drafts">
      <FileText className="h-4 w-4" />
      Drafts
      <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">3</Badge>
    </TabsTrigger>
    <TabsTrigger value="sent">
      <Send className="h-4 w-4" />
      Sent
    </TabsTrigger>
  </TabsList>
</Tabs>`}
      >
        <Tabs defaultValue="inbox">
          <TabsList>
            <TabsTrigger value="inbox" className="gap-1.5">
              <Inbox className="h-4 w-4" />
              Inbox
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                12
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Drafts
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5">
                3
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-1.5">
              <Send className="h-4 w-4" />
              Sent
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="mt-4">
            <p className="text-muted-foreground text-sm">
              You have 12 unread messages in your inbox.
            </p>
          </TabsContent>
          <TabsContent value="drafts" className="mt-4">
            <p className="text-muted-foreground text-sm">
              You have 3 messages saved as drafts.
            </p>
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Your sent messages will appear here.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Vertical tabs"
        code={`<Tabs defaultValue="profile" orientation="vertical">
  <TabsList className="w-48">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="appearance">Appearance</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">
    <Card>...</Card>
  </TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="profile" orientation="vertical">
          <TabsList className="w-48">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Manage your public profile information and avatar.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Update your account details and linked email address.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Choose your preferred theme and display settings.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>

      <ShowcaseExample
        title="Tabs with per-tab actions"
        code={`<Tabs defaultValue="users">
  <TabsList>
    <TabsTrigger value="users">Users</TabsTrigger>
    <TabsTrigger value="roles">Roles</TabsTrigger>
    <TabsTrigger value="permissions">Permissions</TabsTrigger>
  </TabsList>
  <TabsContent value="users">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">Users</h3>
      <Button size="sm"><Plus className="h-4 w-4 mr-1" />Add User</Button>
    </div>
  </TabsContent>
</Tabs>`}
      >
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Users</h3>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add User
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Manage the members of your organisation.
            </p>
          </TabsContent>
          <TabsContent value="roles" className="mt-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Roles</h3>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Create Role
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Define roles and assign them to users.
            </p>
          </TabsContent>
          <TabsContent value="permissions" className="mt-4">
            <p className="text-muted-foreground text-sm">
              Configure granular permissions for each role in your organisation.
            </p>
          </TabsContent>
        </Tabs>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
