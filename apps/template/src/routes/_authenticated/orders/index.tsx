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
  const navigate = useNavigate()
  const { data: orders, isLoading } = useOrders()

  const handleExportCsv = () => {
    if (!orders) return
    exportToCsv(orders as unknown as Record<string, unknown>[], "orders", [
      {
        key: "orderNumber" as keyof Record<string, unknown>,
        header: "Order Number",
      },
      { key: "total" as keyof Record<string, unknown>, header: "Total" },
      { key: "status" as keyof Record<string, unknown>, header: "Status" },
      { key: "createdAt" as keyof Record<string, unknown>, header: "Date" },
    ])
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: ({ column }) => <ColumnHeader column={column} title="Order" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.orderNumber}</span>
      ),
    },
    {
      accessorKey: "customer.name",
      header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => row.original.customer.name,
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
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}
          >
            {status}
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
      header: ({ column }) => <ColumnHeader column={column} title="Total" />,
      cell: ({ row }) => `$${row.original.total.toLocaleString()}`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View Details",
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
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Orders" }]}
        title="Orders"
        description="Track and manage customer orders"
        actions={
          <Button variant="outline" onClick={handleExportCsv}>
            Export CSV
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={orders ?? []}
        isLoading={isLoading}
        searchKey="orderNumber"
        searchPlaceholder="Search orders..."
      />
    </>
  )
}
