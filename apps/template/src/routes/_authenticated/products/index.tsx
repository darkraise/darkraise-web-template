import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Badge } from "@/core/components/ui/badge"
import { DataTable, ColumnHeader, RowActions } from "@/features/data-table"
import { useProducts, useDeleteProduct } from "@/demo/hooks"
import type { Product } from "@/demo/types"

export const Route = createFileRoute("/_authenticated/products/")({
  component: ProductsPage,
})

function ProductsPage() {
  const navigate = useNavigate()
  const { data: products, isLoading } = useProducts()
  const deleteProduct = useDeleteProduct()

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "image",
      header: "Image",
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
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <ColumnHeader column={column} title="Category" />,
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => <ColumnHeader column={column} title="Price" />,
      cell: ({ row }) => `$${row.original.price.toLocaleString()}`,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => <ColumnHeader column={column} title="Stock" />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === "active"
            ? "default"
            : status === "draft"
              ? "secondary"
              : "outline"
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RowActions
          actions={[
            {
              label: "Edit",
              onClick: () =>
                navigate({
                  to: "/products/$id/edit",
                  params: { id: row.original.id },
                }),
            },
            {
              label: "Delete",
              onClick: () => deleteProduct.mutate(row.original.id),
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
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Products" }]}
        title="Products"
        description="Manage your product catalog"
        actions={
          <Button onClick={() => navigate({ to: "/products/new" })}>
            Add Product
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={products ?? []}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search products..."
      />
    </>
  )
}
