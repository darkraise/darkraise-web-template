import { useUiLocale } from "darkraise-ui/i18n"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "darkraise-ui/layout"
import { Button } from "darkraise-ui/components/button"
import { Badge } from "darkraise-ui/components/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "darkraise-ui/components/alert-dialog"
import { DataTable, ColumnHeader, RowActions } from "darkraise-ui/data-table"
import { useProducts, useDeleteProduct } from "@/demo/hooks"
import type { Product } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/products/")({
  component: ProductsPage,
})

function ProductsPage() {
  const uiLocale = useUiLocale()

  const t = useAppTranslation()

  const navigate = useNavigate()
  const { data: products, isLoading } = useProducts()
  const deleteProduct = useDeleteProduct()
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null)

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "image",
      header: t("Image"),
      cell: ({ row }) => (
        <img
          src={row.original.image}
          alt={row.original.name}
          className="h-10 w-10 rounded-md object-cover"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Name")} />
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Category")} />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Price")} />
      ),
      cell: ({ row }) =>
        `$${row.original.price.toLocaleString(uiLocale.locale)}`,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Stock")} />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <ColumnHeader column={column} title={t("Status")} />
      ),
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === "active"
            ? "default"
            : status === "draft"
              ? "secondary"
              : "outline"
        return <Badge variant={variant}>{t(status)}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: t("Edit"),
              onClick: () =>
                navigate({
                  to: "/products/$id/edit",
                  params: { id: row.original.id },
                }),
            },
            {
              label: t("Delete"),
              onClick: () => setPendingDelete(row.original),
              variant: "destructive",
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
          { label: t("Products") },
        ]}
        title={t("Products")}
        description={t("Manage your product catalog")}
        actions={
          <Button onClick={() => navigate({ to: "/products/new" })}>
            {t("Add Product")}
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={products ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder={t("Search products...")}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete product?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently delete “{{name}}”. This action cannot be undone.",
                { name: pendingDelete?.name ?? "" },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              data-variant="destructive"
              onClick={() => {
                if (pendingDelete) deleteProduct.mutate(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
