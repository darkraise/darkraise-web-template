import { useUiLocale } from "darkraise-ui/i18n"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "darkraise-ui/layout"
import { Avatar, AvatarFallback } from "darkraise-ui/components/avatar"
import { DataTable, ColumnHeader, RowActions } from "darkraise-ui/data-table"
import { useCustomers } from "@/demo/hooks"
import type { Customer } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
})

function CustomersPage() {
  const uiLocale = useUiLocale()

  const t = useAppTranslation()

  const navigate = useNavigate()
  const { data: customers, isLoading } = useCustomers()

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Customer")} />
      ),
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
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Email")} />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "totalOrders",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Orders")} />
      ),
    },
    {
      accessorKey: "totalSpent",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Total Spent")} />
      ),
      cell: ({ row }) =>
        `$${row.original.totalSpent.toLocaleString(uiLocale.locale)}`,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Joined")} />
      ),
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(uiLocale.locale, {
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
              label: t("View Profile"),
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
          { label: t("Dashboard"), href: "/" },
          { label: t("Customers") },
        ]}
        title={t("Customers")}
        description={t("View and manage your customer base")}
      />
      <DataTable
        columns={columns}
        data={customers ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t("Search customers...")}
      />
    </>
  )
}
