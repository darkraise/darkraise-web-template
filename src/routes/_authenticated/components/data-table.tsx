import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { PageHeader } from "@/core/layout"
import { Badge } from "@/core/components/ui/badge"
import { DataTable, ColumnHeader } from "@/features/data-table"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/data-table")({
  component: DataTablePage,
})

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: "active" | "low" | "out"
}

const products: Product[] = [
  {
    id: "1",
    name: "Widget Pro",
    category: "Electronics",
    price: 49.99,
    stock: 142,
    status: "active",
  },
  {
    id: "2",
    name: "Basic Tee",
    category: "Clothing",
    price: 19.99,
    stock: 380,
    status: "active",
  },
  {
    id: "3",
    name: "Coffee Blend",
    category: "Food",
    price: 12.5,
    stock: 75,
    status: "low",
  },
  {
    id: "4",
    name: "TypeScript Handbook",
    category: "Books",
    price: 34.0,
    stock: 60,
    status: "low",
  },
  {
    id: "5",
    name: "Smart Plug",
    category: "Electronics",
    price: 24.99,
    stock: 0,
    status: "out",
  },
  {
    id: "6",
    name: "Running Shoes",
    category: "Clothing",
    price: 89.99,
    stock: 210,
    status: "active",
  },
  {
    id: "7",
    name: "Desk Lamp",
    category: "Electronics",
    price: 39.99,
    stock: 95,
    status: "active",
  },
  {
    id: "8",
    name: "Notebook",
    category: "Books",
    price: 8.99,
    stock: 500,
    status: "active",
  },
]

const basicColumns: ColumnDef<Product, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <ColumnHeader column={column} title="Category" />,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <ColumnHeader column={column} title="Price" />,
    cell: ({ row }) => `$${(row.getValue("price") as number).toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <ColumnHeader column={column} title="Stock" />,
  },
]

const statusColumns: ColumnDef<Product, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "category",
    header: ({ column }) => <ColumnHeader column={column} title="Category" />,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <ColumnHeader column={column} title="Price" />,
    cell: ({ row }) => `$${(row.getValue("price") as number).toFixed(2)}`,
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <ColumnHeader column={column} title="Stock" />,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <ColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("status") as Product["status"]
      return (
        <Badge
          variant={
            status === "out"
              ? "destructive"
              : status === "low"
                ? "outline"
                : "default"
          }
        >
          {status === "out"
            ? "Out of stock"
            : status === "low"
              ? "Low stock"
              : "In stock"}
        </Badge>
      )
    },
  },
]

function DataTablePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Data Table" },
        ]}
        title="Data Table"
        description="Feature-rich table built on TanStack Table with column sorting, text search, and pagination."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="DataTable with sortable columns and search"
          code={`const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <ColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "price",
    header: ({ column }) => <ColumnHeader column={column} title="Price" />,
    cell: ({ row }) => \`$\${(row.getValue("price") as number).toFixed(2)}\`,
  },
]

<DataTable
  columns={columns}
  data={products}
  searchKey="name"
  searchPlaceholder="Search products..."
/>`}
        >
          <DataTable
            columns={basicColumns}
            data={products}
            searchKey="name"
            searchPlaceholder="Search products..."
          />
        </ShowcaseExample>

        <ShowcaseExample
          title="With custom cell renderer (status badge)"
          code={`{
  accessorKey: "status",
  header: ({ column }) => <ColumnHeader column={column} title="Status" />,
  cell: ({ row }) => {
    const status = row.getValue("status") as "active" | "low" | "out"
    return (
      <Badge variant={status === "out" ? "destructive" : status === "low" ? "outline" : "default"}>
        {status === "out" ? "Out of stock" : status === "low" ? "Low stock" : "In stock"}
      </Badge>
    )
  },
}`}
        >
          <DataTable
            columns={statusColumns}
            data={products}
            searchKey="name"
            searchPlaceholder="Search by name..."
          />
        </ShowcaseExample>
      </div>
    </div>
  )
}
