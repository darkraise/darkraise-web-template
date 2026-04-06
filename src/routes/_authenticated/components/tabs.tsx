import { createFileRoute } from "@tanstack/react-router"
import { Inbox, FileText, Send, Plus } from "lucide-react"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import { Label } from "@/core/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/ui/tabs"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tabs")({
  component: TabsPage,
})

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
  <div className="flex gap-6">
    <TabsList className="flex-col h-auto w-48">
      <TabsTrigger value="profile">Profile</TabsTrigger>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="appearance">Appearance</TabsTrigger>
    </TabsList>
    <TabsContent value="profile">
      <Card>...</Card>
    </TabsContent>
  </div>
</Tabs>`}
      >
        <Tabs defaultValue="profile" orientation="vertical">
          <div className="flex gap-6">
            <TabsList className="h-auto w-48 flex-col">
              <TabsTrigger value="profile" className="w-full justify-start">
                Profile
              </TabsTrigger>
              <TabsTrigger value="account" className="w-full justify-start">
                Account
              </TabsTrigger>
              <TabsTrigger value="appearance" className="w-full justify-start">
                Appearance
              </TabsTrigger>
            </TabsList>
            <div className="flex-1">
              <TabsContent value="profile" className="mt-0">
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
              <TabsContent value="account" className="mt-0">
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
              <TabsContent value="appearance" className="mt-0">
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
            </div>
          </div>
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
