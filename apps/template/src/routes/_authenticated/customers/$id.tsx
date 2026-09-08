import { useUiLocale } from "darkraise-ui/i18n"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Center, PageHeader } from "darkraise-ui/layout"
import { Avatar, AvatarFallback } from "darkraise-ui/components/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import { KPICard } from "@/features/dashboard"
import { DataTable, ColumnHeader } from "darkraise-ui/data-table"
import { useCustomer, useOrders } from "@/demo/hooks"
import type { Order } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const uiLocale = useUiLocale()

  const t = useAppTranslation()

  const { id } = Route.useParams()
  const { data: customer, isLoading: customerLoading } = useCustomer(id)
  const { data: allOrders } = useOrders()

  const customerOrders = allOrders?.filter((o) => o.customer.id === id) ?? []

  if (customerLoading) {
    return (
      <Center className="p-12">
        <p className="text-muted-foreground">{t("Loading customer...")}</p>
      </Center>
    )
  }

  if (!customer) {
    return (
      <Center className="p-12">
        <p className="text-muted-foreground">{t("Customer not found.")}</p>
      </Center>
    )
  }

  const avgOrderValue =
    customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0

  const orderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Order")} />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Date")} />
      ),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(uiLocale.locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Status")} />
      ),
      cell: ({ row }) => (
        <span className="capitalize">{row.original.status}</span>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Total")} />
      ),
      cell: ({ row }) =>
        `$${row.original.total.toLocaleString(uiLocale.locale)}`,
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("Dashboard"), href: "/" },
          { label: t("Customers"), href: "/customers" },
          { label: customer.name },
        ]}
        title={customer.name}
        description={t("Customer since {{date}}", {
          date: new Date(customer.createdAt).toLocaleDateString(
            uiLocale.locale,
            { year: "numeric", month: "long" },
          ),
        })}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {customer.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-medium">{customer.name}</h2>
              <p className="text-muted-foreground text-sm">{customer.email}</p>
              {customer.phone && (
                <p className="text-muted-foreground text-sm">
                  {customer.phone}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <KPICard
            label={t("Lifetime Value")}
            value={`$${customer.totalSpent.toLocaleString(uiLocale.locale)}`}
          />
          <KPICard label={t("Total Orders")} value={customer.totalOrders} />
          <KPICard
            label={t("Average Order Value")}
            value={`$${avgOrderValue.toLocaleString(uiLocale.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">{t("Orders")}</TabsTrigger>
            <TabsTrigger value="profile">{t("Profile")}</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <DataTable
              columns={orderColumns}
              data={customerOrders}
              searchKey="orderNumber"
              searchPlaceholder={t("Search orders...")}
            />
          </TabsContent>
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("Contact Information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{t("Email")}</p>
                  <p className="text-muted-foreground text-sm">
                    {customer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("Phone")}</p>
                  <p className="text-muted-foreground text-sm">
                    {customer.phone ?? t("Not provided")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">{t("Member Since")}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(customer.createdAt).toLocaleDateString(
                      uiLocale.locale,
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
