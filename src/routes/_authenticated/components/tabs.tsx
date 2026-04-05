import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
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

export const Route = createFileRoute("/_authenticated/components/tabs")({
  component: TabsPage,
})

function TabsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Tabs" },
        ]}
        title="Tabs"
        description="Organize related content into switchable panels within the same page context."
      />

      <div className="space-y-6">
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
              <p className="text-sm text-muted-foreground">
                This is the Overview tab. Tabs are used to organize content into
                distinct sections within the same page context.
              </p>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <p className="text-sm text-muted-foreground">
                This is the Details tab. Each panel is only rendered when its
                tab is active, keeping the initial render lightweight.
              </p>
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              <p className="text-sm text-muted-foreground">
                This is the Settings tab. You can place forms, data, or any
                other components inside a tab panel.
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
              <p className="text-sm text-muted-foreground">
                Showing published content.
              </p>
            </TabsContent>
            <TabsContent value="draft" className="mt-4">
              <p className="text-sm text-muted-foreground">
                Showing draft content.
              </p>
            </TabsContent>
          </Tabs>
        </ShowcaseExample>
      </div>
    </div>
  )
}
