import { useUiLocale } from "darkraise-ui/i18n"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "darkraise-ui/layout"
import { Button } from "darkraise-ui/components/button"
import {
  DataTable,
  ColumnHeader,
  RowActions,
  exportToCsv,
} from "darkraise-ui/data-table"
import { useOrders } from "@/demo/hooks"
import type { Order } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/orders/")({
  component: OrdersPage,
})

const statusColors: Record<Order["status"], string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-primary/15 text-primary",
  shipped: "bg-accent text-accent-foreground",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
}

function OrdersPage() {
  const uiLocale = useUiLocale()

  const t = useAppTranslation()

  const navigate = useNavigate()
  const { data: orders, isLoading } = useOrders()

  const handleExportCsv = () => {
    if (!orders) return
    exportToCsv(orders as unknown as Record<string, unknown>[], "orders", [
      {
        key: "orderNumber" as keyof Record<string, unknown>,
        header: t("Order Number"),
      },
      { key: "total" as keyof Record<string, unknown>, header: t("Total") },
      { key: "status" as keyof Record<string, unknown>, header: t("Status") },
      { key: "createdAt" as keyof Record<string, unknown>, header: t("Date") },
    ])
  }

  const columns: ColumnDef<Order>[] = [
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
      accessorKey: "customer.name",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Customer")} />
      ),
      cell: ({ row }) => row.original.customer.name,
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
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
          >
            {t(status)}
          </span>
        )
      },
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true
        return filterValue.includes(row.original.status)
      },
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Total")} />
      ),
      cell: ({ row }) =>
        `$${row.original.total.toLocaleString(uiLocale.locale)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: t("View Details"),
              onClick: () =>
                navigate({
                  to: "/orders/$id",
                  params: { id: row.original.id },
                }),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: t("Dashboard"), href: "/" },
          { label: t("Orders") },
        ]}
        title={t("Orders")}
        description={t("Track and manage customer orders")}
        actions={
          <Button variant="outline" onClick={handleExportCsv}>
            {t("Export CSV")}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={orders ?? []}
        isLoading={isLoading}
        searchKey="orderNumber"
        searchPlaceholder={t("Search orders...")}
      />
    </>
  )
}
