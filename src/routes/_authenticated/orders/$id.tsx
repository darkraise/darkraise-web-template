import { createFileRoute, Link } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/core/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import { useOrder, useUpdateOrderStatus } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetailPage,
})

const statusColors: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipped:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  delivered:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusSteps = ["pending", "processing", "shipped", "delivered"] as const

function OrderDetailPage() {
  const { id } = Route.useParams()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(
    order.status as (typeof statusSteps)[number],
  )

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Orders", href: "/orders" },
          { label: order.orderNumber },
        ]}
        title={order.orderNumber}
        description={`Placed on ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`}
        actions={
          <div className="flex gap-2">
            {order.status === "processing" && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "shipped" })
                }
              >
                Mark as Shipped
              </Button>
            )}
            {order.status === "pending" && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "processing" })
                }
              >
                Start Processing
              </Button>
            )}
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "cancelled" })
                }
              >
                Cancel Order
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {order.status !== "cancelled" && (
          <div className="flex items-center gap-2">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                    i <= currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm capitalize ${
                    i <= currentStepIndex
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step}
                </span>
                {i < statusSteps.length - 1 && (
                  <div
                    className={`h-0.5 w-8 ${
                      i < currentStepIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.price.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ${(item.quantity * item.price).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-right font-medium"
                          >
                            Total
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="shipping" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      No notes for this order.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColors[order.status]}`}
                >
                  {order.status}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customer.email}
                </p>
                <Separator />
                <Link
                  to="/customers/$id"
                  params={{ id: order.customer.id }}
                  className="text-sm text-primary hover:underline"
                >
                  View customer profile
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
