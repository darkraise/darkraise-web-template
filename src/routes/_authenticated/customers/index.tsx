import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { DataTable, ColumnHeader, RowActions } from "@/features/data-table"
import { useCustomers } from "@/demo/hooks"
import type { Customer } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
})

function CustomersPage() {
  const navigate = useNavigate()
  const { data: customers, isLoading } = useCustomers()

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {row.original.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => <ColumnHeader column={column} title="Email" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: ({ column }) => <ColumnHeader column={column} title="Orders" />,
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => (
        <ColumnHeader column={column} title="Total Spent" />
      ),
      cell: ({ row }) => `$${row.original.totalSpent.toLocaleString()}`,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <ColumnHeader column={column} title="Joined" />,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "View Profile",
              onClick: () =>
                navigate({
                  to: "/customers/$id",
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
          { label: "Dashboard", href: "/" },
          { label: "Customers" },
        ]}
        title="Customers"
        description="View and manage your customer base"
      />
      <DataTable
        columns={columns}
        data={customers ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search customers..."
      />
    </>
  )
}
