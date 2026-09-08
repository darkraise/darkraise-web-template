import { useAppTranslation } from "@/i18n/useAppTranslation"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Store,
  Wallet,
} from "lucide-react"
import { PageHeader } from "darkraise-ui/layout"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "darkraise-ui/components/alert"
import { Button } from "darkraise-ui/components/button"
import { toast } from "darkraise-ui/components/sonner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import {
  TextField,
  TextareaField,
  SelectField,
  SwitchField,
  CheckboxField,
  RadioGroupField,
  FormSection,
} from "darkraise-ui/forms"
import { fieldProps } from "@/lib/field-props"
import { AppearanceSection } from "./_settings/-appearance-section"
import { NotificationsSection } from "./_settings/-notifications-section"
import { PreferencesSection } from "./_settings/-preferences-section"
import { ProfileSection } from "./_settings/-profile-section"
import { SecuritySection } from "./_settings/-security-section"
import {
  SettingRow,
  SettingsCard,
  StatValue,
  StatusPanel,
} from "./_settings/-settings-primitives"

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
  const t = useAppTranslation()

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("Dashboard"), href: "/" },
          { label: t("Settings") },
        ]}
        title={t("Settings")}
        description={t(
          "Explore example store settings. Submissions are simulated and are not saved.",
        )}
      />
      <Tabs defaultValue="general">
        <TabsList className="w-full max-w-2xl">
          <TabsTrigger value="general" className="flex-1">
            {t("General")}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1">
            {t("Notifications")}
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex-1">
            {t("Billing")}
          </TabsTrigger>
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
  const t = useAppTranslation()

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
      toast.success(t("Demo settings submitted"))
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <ProfileSection />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <SettingsCard
          icon={<Store />}
          title={t("Store Information")}
          action={
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? t("Saving…") : t("Save Changes")}
                </Button>
              )}
            </form.Subscribe>
          }
        >
          <form.Field
            name="storeName"
            children={(field) => (
              <TextField
                {...fieldProps<string>(field, t)}
                label={t("Store Name")}
                placeholder={t("Your store name")}
              />
            )}
          />
          <form.Field
            name="storeDescription"
            children={(field) => (
              <TextareaField
                {...fieldProps<string>(field, t)}
                label={t("Store Description")}
                placeholder={t("Describe your store")}
                rows={3}
              />
            )}
          />
          <form.Field
            name="currency"
            children={(field) => (
              <SelectField
                {...fieldProps<string>(field, t)}
                label={t("Currency")}
                options={[
                  { label: "USD ($)", value: "usd" },
                  { label: "EUR (€)", value: "eur" },
                  { label: "GBP (£)", value: "gbp" },
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
                {...fieldProps<string>(field, t)}
                label={t("Timezone")}
                options={[
                  { label: t("Eastern Time (ET)"), value: "america-new_york" },
                  { label: t("Central Time (CT)"), value: "america-chicago" },
                  { label: t("Mountain Time (MT)"), value: "america-denver" },
                  {
                    label: t("Pacific Time (PT)"),
                    value: "america-los_angeles",
                  },
                  { label: "UTC", value: "utc" },
                ]}
              />
            )}
          />
          <StatusPanel
            title={t("Example sync status")}
            meta={[
              <>
                <Clock />
                {t("Last saved 08/21/2026 09:57 PM")}
              </>,
              <>
                <CheckCircle2 />
                {t("Applied across 3 storefronts")}
              </>,
            ]}
          />
        </SettingsCard>
      </form>
      <PreferencesSection />
      <AppearanceSection />
      <SecuritySection />
    </div>
  )
}

function NotificationSettings() {
  const t = useAppTranslation()

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
      toast.success(t("Demo preferences submitted"))
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <SettingsCard
          icon={<Bell />}
          title={t("Email Preferences")}
          action={
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? t("Saving…") : t("Save Preferences")}
                </Button>
              )}
            </form.Subscribe>
          }
        >
          <form.Field
            name="emailNotifications"
            children={(field) => (
              <SwitchField
                {...fieldProps<boolean>(field, t)}
                label={t("Email Notifications")}
                description={t(
                  "Receive email notifications for important events",
                )}
              />
            )}
          />
          <form.Field
            name="orderAlerts"
            children={(field) => (
              <SwitchField
                {...fieldProps<boolean>(field, t)}
                label={t("Order Alerts")}
                description={t("Get notified when new orders are placed")}
              />
            )}
          />
          <form.Field
            name="marketingEmails"
            children={(field) => (
              <CheckboxField
                {...fieldProps<boolean>(field, t)}
                label={t("Marketing Emails")}
                description={t(
                  "Receive promotional emails and product updates",
                )}
              />
            )}
          />

          <FormSection
            title={t("Frequency")}
            description={t("How often you want to receive notifications")}
          >
            <form.Field
              name="notificationFrequency"
              children={(field) => (
                <RadioGroupField
                  {...fieldProps<string>(field, t)}
                  label={t("Notification Frequency")}
                  options={[
                    { label: t("Instant"), value: "instant" },
                    { label: t("Daily digest"), value: "daily" },
                    { label: t("Weekly summary"), value: "weekly" },
                  ]}
                />
              )}
            />
          </FormSection>

          <Alert variant="info">
            <Info />
            <AlertTitle>{t("Digests are sent at 09:00 local time")}</AlertTitle>
            <AlertDescription>
              {t(
                "Daily and weekly summaries follow the timezone set under General. Instant alerts ignore this schedule.",
              )}
            </AlertDescription>
          </Alert>
        </SettingsCard>
      </form>
      <NotificationsSection />
    </div>
  )
}

function BillingSettings() {
  const t = useAppTranslation()

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsCard
        icon={<CreditCard />}
        title={t("Pro Plan")}
        action={
          <Button variant="outline" size="sm">
            {t("Upgrade Plan")}
          </Button>
        }
      >
        <StatValue
          label={t("Monthly Price")}
          value="$49"
          badge={<CheckCircle2 className="text-success size-5" />}
        />
        <div className="space-y-4">
          <SettingRow
            label={t("Billing cycle")}
            description={t("How often the subscription renews")}
            control={
              <span className="text-sm font-medium">{t("Monthly")}</span>
            }
          />
          <SettingRow
            label={t("Next billing date")}
            description={t("The card on file is charged on this date")}
            control={
              <span className="text-sm font-medium">{t("May 1, 2026")}</span>
            }
          />
        </div>
        <StatusPanel
          title={t("Your subscription is active")}
          meta={[
            <>
              <Clock />
              {t("Renews in 12 days")}
            </>,
          ]}
        />
      </SettingsCard>

      <SettingsCard icon={<Wallet />} title={t("Billing Information")}>
        <div className="space-y-4">
          <SettingRow
            label={t("Billing Email")}
            description={t("Invoices and receipts are sent here")}
            control={
              <span className="text-muted-foreground text-sm">
                billing@example.com
              </span>
            }
          />
          <SettingRow
            label={t("Payment Method")}
            description={t("Charged automatically each cycle")}
            control={
              <span className="text-muted-foreground text-sm">
                {t("Visa ending in 4242")}
              </span>
            }
          />
          <SettingRow
            label={t("Billing Address")}
            description={t("Used on every invoice")}
            control={
              <span className="text-muted-foreground max-w-56 text-right text-sm">
                123 Business Ave, Suite 100, San Francisco, CA 94102
              </span>
            }
          />
        </div>
      </SettingsCard>
    </div>
  )
}
