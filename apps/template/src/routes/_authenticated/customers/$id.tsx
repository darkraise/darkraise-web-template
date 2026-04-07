import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/ui/tabs"
import { KPICard } from "@/features/dashboard"
import { DataTable, ColumnHeader } from "@/features/data-table"
import { useCustomer, useOrders } from "@/demo/hooks"
import type { Order } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetailPage,
})

function CustomerDetailPage() {
  const { id } = Route.useParams()
  const { data: customer, isLoading: customerLoading } = useCustomer(id)
  const { data: allOrders } = useOrders()

  const customerOrders = allOrders?.filter((o) => o.customer.id === id) ?? []

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading customer...</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    )
  }

  const avgOrderValue =
    customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0

  const orderColumns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => <ColumnHeader column={column} title="Order" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <ColumnHeader column={column} title="Date" />,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <span className="capitalize">{row.original.status}</span>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => <ColumnHeader column={column} title="Total" />,
      cell: ({ row }) => `$${row.original.total.toLocaleString()}`,
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: customer.name },
        ]}
        title={customer.name}
        description={`Customer since ${new Date(customer.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })}`}
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
            label="Lifetime Value"
            value={`$${customer.totalSpent.toLocaleString()}`}
          />
          <KPICard label="Total Orders" value={customer.totalOrders} />
          <KPICard
            label="Average Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
          />
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-4">
            <DataTable
              columns={orderColumns}
              data={customerOrders}
              searchKey="orderNumber"
              searchPlaceholder="Search orders..."
            />
          </TabsContent>
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground text-sm">
                    {customer.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-muted-foreground text-sm">
                    {customer.phone ?? "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(customer.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
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
