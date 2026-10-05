import { useUiLocale } from "darkraise-ui/i18n"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Check } from "lucide-react"
import { PageHeader } from "darkraise-ui/layout"
import { cn } from "darkraise-ui/lib"
import { Button } from "darkraise-ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"
import { Separator } from "darkraise-ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "darkraise-ui/components/table"
import { useOrder, useUpdateOrderStatus } from "@/demo/hooks"
import { StatusBadge } from "@/features/status"
import { ORDER_STEPS, stepState } from "@/features/orders"

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetailPage,
})

function OrderDetailPage() {
  const uiLocale = useUiLocale()

  const t = useAppTranslation()

  const { id } = Route.useParams()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">{t("Loading order...")}</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">{t("Order not found.")}</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("Dashboard"), href: "/" },
          { label: t("Orders"), href: "/orders" },
          { label: order.orderNumber },
        ]}
        title={order.orderNumber}
        description={t("Placed on {{date}}", {
          date: new Date(order.createdAt).toLocaleDateString(uiLocale.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        })}
        actions={
          <div className="flex gap-2">
            {order.status === "processing" && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "shipped" })
                }
              >
                {t("Mark as Shipped")}
              </Button>
            )}
            {order.status === "pending" && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: order.id, status: "processing" })
                }
              >
                {t("Start Processing")}
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
                {t("Cancel Order")}
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {order.status !== "cancelled" && (
          <div
            data-order-steps
            className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center"
          >
            {ORDER_STEPS.map((step, i) => {
              const state = stepState(i, order.status)
              const reached = state !== "upcoming"
              return (
                <div
                  key={step}
                  data-state={state}
                  aria-current={state === "current" ? "step" : undefined}
                  className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                        reached
                          ? "bg-primary-fill text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                        state === "current" &&
                          "ring-ring ring-offset-background ring-2 ring-offset-2",
                      )}
                    >
                      {state === "complete" ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm whitespace-nowrap",
                        reached
                          ? "text-foreground font-medium"
                          : "text-muted-foreground",
                      )}
                    >
                      {t(step)}
                    </span>
                  </div>
                  {i < ORDER_STEPS.length - 1 && (
                    <div
                      data-order-connector
                      className={cn(
                        "ms-[0.9375rem] h-4 w-0.5 sm:ms-0 sm:h-0.5 sm:w-8",
                        stepState(i + 1, order.status) === "upcoming"
                          ? "bg-muted"
                          : "bg-primary-fill",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">{t("Items")}</TabsTrigger>
                <TabsTrigger value="shipping">{t("Shipping")}</TabsTrigger>
                <TabsTrigger value="notes">{t("Notes")}</TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("Product")}</TableHead>
                          <TableHead className="text-right">
                            {t("Qty")}
                          </TableHead>
                          <TableHead className="text-right">
                            {t("Price")}
                          </TableHead>
                          <TableHead className="text-right">
                            {t("Subtotal")}
                          </TableHead>
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
                              ${item.price.toLocaleString(uiLocale.locale)}
                            </TableCell>
                            <TableCell className="text-right">
                              $
                              {(item.quantity * item.price).toLocaleString(
                                uiLocale.locale,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-right font-medium"
                          >
                            {t("Total")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total.toLocaleString(uiLocale.locale)}
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
                    <CardTitle>{t("Shipping Address")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {order.shippingAddress}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("Order Notes")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {t("No notes for this order.")}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("Status")}</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge status={order.status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("Customer")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm font-medium">{order.customer.name}</p>
                <p className="text-muted-foreground text-sm">
                  {order.customer.email}
                </p>
                <Separator />
                <Link
                  to="/customers/$id"
                  params={{ id: order.customer.id }}
                  className="text-primary-text text-sm hover:underline"
                >
                  {t("View customer profile")}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
