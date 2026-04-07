import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { PageHeader } from "@/core/layout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Button } from "@/core/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/ui/tabs"
import {
  TextField,
  TextareaField,
  SelectField,
  SwitchField,
  CheckboxField,
  RadioGroupField,
  FormSection,
  FormActions,
} from "@/features/forms"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

const generalSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeDescription: z.string(),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
})

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  orderAlerts: z.boolean(),
  marketingEmails: z.boolean(),
  notificationFrequency: z.enum(["instant", "daily", "weekly"]),
})

function SettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]}
        title="Settings"
        description="Manage your store configuration"
      />
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="billing" className="mt-6">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </>
  )
}

function GeneralSettings() {
  const form = useForm({
    defaultValues: {
      storeName: "My E-Commerce Store",
      storeDescription:
        "A modern online store selling electronics, clothing, and accessories.",
      currency: "usd",
      timezone: "america-new_york",
    },
    validators: {
      onChange: generalSchema,
    },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 500))
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="max-w-2xl space-y-8"
    >
      <FormSection
        title="Store Information"
        description="Basic details about your store"
      >
        <form.Field
          name="storeName"
          children={(field) => (
            <TextField
              field={field}
              label="Store Name"
              placeholder="Your store name"
            />
          )}
        />
        <form.Field
          name="storeDescription"
          children={(field) => (
            <TextareaField
              field={field}
              label="Store Description"
              placeholder="Describe your store"
              rows={3}
            />
          )}
        />
        <form.Field
          name="currency"
          children={(field) => (
            <SelectField
              field={field}
              label="Currency"
              options={[
                { label: "USD ($)", value: "usd" },
                { label: "EUR (\u20ac)", value: "eur" },
                { label: "GBP (\u00a3)", value: "gbp" },
                { label: "CAD (C$)", value: "cad" },
                { label: "AUD (A$)", value: "aud" },
              ]}
            />
          )}
        />
        <form.Field
          name="timezone"
          children={(field) => (
            <SelectField
              field={field}
              label="Timezone"
              options={[
                { label: "Eastern Time (ET)", value: "america-new_york" },
                { label: "Central Time (CT)", value: "america-chicago" },
                { label: "Mountain Time (MT)", value: "america-denver" },
                { label: "Pacific Time (PT)", value: "america-los_angeles" },
                { label: "UTC", value: "utc" },
              ]}
            />
          )}
        />
      </FormSection>
      <FormActions
        submitLabel="Save Changes"
        isSubmitting={form.state.isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}

function NotificationSettings() {
  const form = useForm({
    defaultValues: {
      emailNotifications: true,
      orderAlerts: true,
      marketingEmails: false,
      notificationFrequency: "instant" as "instant" | "daily" | "weekly",
    },
    validators: {
      onChange: notificationsSchema,
    },
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 500))
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="max-w-2xl space-y-8"
    >
      <FormSection
        title="Email Preferences"
        description="Control what emails you receive"
      >
        <form.Field
          name="emailNotifications"
          children={(field) => (
            <SwitchField
              field={field}
              label="Email Notifications"
              description="Receive email notifications for important events"
            />
          )}
        />
        <form.Field
          name="orderAlerts"
          children={(field) => (
            <SwitchField
              field={field}
              label="Order Alerts"
              description="Get notified when new orders are placed"
            />
          )}
        />
        <form.Field
          name="marketingEmails"
          children={(field) => (
            <CheckboxField
              field={field}
              label="Marketing Emails"
              description="Receive promotional emails and product updates"
            />
          )}
        />
      </FormSection>

      <FormSection
        title="Frequency"
        description="How often you want to receive notifications"
      >
        <form.Field
          name="notificationFrequency"
          children={(field) => (
            <RadioGroupField
              field={field}
              label="Notification Frequency"
              options={[
                { label: "Instant", value: "instant" },
                { label: "Daily digest", value: "daily" },
                { label: "Weekly summary", value: "weekly" },
              ]}
            />
          )}
        />
      </FormSection>

      <FormActions
        submitLabel="Save Preferences"
        isSubmitting={form.state.isSubmitting}
        canSubmit={form.state.canSubmit}
      />
    </form>
  )
}

function BillingSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <FormSection title="Current Plan" description="Your active subscription">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pro Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Monthly price
              </span>
              <span className="text-sm font-medium">$49/month</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Billing cycle
              </span>
              <span className="text-sm font-medium">Monthly</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Next billing date
              </span>
              <span className="text-sm font-medium">May 1, 2026</span>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </FormSection>

      <FormSection
        title="Billing Information"
        description="Manage your billing details"
      >
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div>
              <p className="text-sm font-medium">Billing Email</p>
              <p className="text-muted-foreground text-sm">
                billing@example.com
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Payment Method</p>
              <p className="text-muted-foreground text-sm">
                Visa ending in 4242
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Billing Address</p>
              <p className="text-muted-foreground text-sm">
                123 Business Ave, Suite 100, San Francisco, CA 94102
              </p>
            </div>
          </CardContent>
        </Card>
      </FormSection>
    </div>
  )
}
