import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Checkbox } from "@/core/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import { DataTable, ColumnHeader } from "@/features/data-table"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

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

function ExpandableTableExample() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Stock</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <>
            <TableRow
              key={product.id}
              className="cursor-pointer"
              onClick={() =>
                setExpandedId(expandedId === product.id ? null : product.id)
              }
            >
              <TableCell className="flex items-center gap-2">
                {expandedId === product.id ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                {product.name}
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>{product.stock}</TableCell>
            </TableRow>
            {expandedId === product.id && (
              <TableRow key={`${product.id}-detail`}>
                <TableCell colSpan={4} className="bg-muted/50 p-4">
                  <span className="mr-6 text-sm">SKU: PROD-{product.id}</span>
                  <span className="text-sm">
                    Created: Jan {product.id}, 2024
                  </span>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  )
}

function BulkActionsTableExample() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const allSelected =
    selectedIds.size === products.length && products.length > 0

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="bg-muted mb-2 flex items-center gap-2 rounded-md p-2">
          <span className="text-sm">{selectedIds.size} selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
          >
            Delete Selected
          </Button>
          <Button variant="outline" size="sm">
            Export Selected
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={() => toggleOne(product.id)}
                  aria-label={`Select ${product.name}`}
                />
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>{product.stock}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FacetedFilterTableExample() {
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const statusLabel: Record<Product["status"], string> = {
    active: "In stock",
    low: "Low stock",
    out: "Out of stock",
  }

  const filtered = products.filter((p) => {
    const categoryMatch =
      categoryFilter === "all" || p.category === categoryFilter
    const statusMatch =
      statusFilter === "all" || statusLabel[p.status] === statusFilter
    return categoryMatch && statusMatch
  })

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Clothing">Clothing</SelectItem>
              <SelectItem value="Books">Books</SelectItem>
              <SelectItem value="Food">Food</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="In stock">In stock</SelectItem>
              <SelectItem value="Low stock">Low stock</SelectItem>
              <SelectItem value="Out of stock">Out of stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground text-center"
              >
                No products match the selected filters.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{statusLabel[product.status]}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function DataTablePage() {
  return (
    <ShowcasePage
      title="Data Table"
      description="Feature-rich table built on TanStack Table with column sorting, text search, and pagination."
    >
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

      <ShowcaseExample
        title="Expandable row detail"
        code={`const [expandedId, setExpandedId] = useState<string | null>(null)

<Table>
  <TableHeader>…</TableHeader>
  <TableBody>
    {products.map((product) => (
      <>
        <TableRow
          key={product.id}
          className="cursor-pointer"
          onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
        >
          <TableCell className="flex items-center gap-2">
            {expandedId === product.id
              ? <ChevronDown className="h-4 w-4 shrink-0" />
              : <ChevronRight className="h-4 w-4 shrink-0" />}
            {product.name}
          </TableCell>
          …
        </TableRow>
        {expandedId === product.id && (
          <TableRow key={\`\${product.id}-detail\`}>
            <TableCell colSpan={4} className="bg-muted/50 p-4">
              SKU: PROD-{product.id} — Created: Jan {product.id}, 2024
            </TableCell>
          </TableRow>
        )}
      </>
    ))}
  </TableBody>
</Table>`}
      >
        <ExpandableTableExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Bulk actions toolbar"
        code={`const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

{selectedIds.size > 0 && (
  <div className="mb-2 flex items-center gap-2 rounded-md bg-muted p-2">
    <span className="text-sm">{selectedIds.size} selected</span>
    <Button variant="destructive" size="sm">Delete Selected</Button>
    <Button variant="outline" size="sm">Export Selected</Button>
  </div>
)}
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
      </TableHead>
      …
    </TableRow>
  </TableHeader>
  <TableBody>
    {products.map((product) => (
      <TableRow key={product.id}>
        <TableCell>
          <Checkbox
            checked={selectedIds.has(product.id)}
            onCheckedChange={() => toggleOne(product.id)}
          />
        </TableCell>
        …
      </TableRow>
    ))}
  </TableBody>
</Table>`}
      >
        <BulkActionsTableExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Faceted filters"
        code={`const [categoryFilter, setCategoryFilter] = useState("all")
const [statusFilter, setStatusFilter] = useState("all")

const filtered = products.filter((p) => {
  const categoryMatch = categoryFilter === "all" || p.category === categoryFilter
  const statusMatch = statusFilter === "all" || statusLabel[p.status] === statusFilter
  return categoryMatch && statusMatch
})

<div className="flex gap-3">
  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="Electronics">Electronics</SelectItem>
      <SelectItem value="Clothing">Clothing</SelectItem>
      <SelectItem value="Books">Books</SelectItem>
      <SelectItem value="Food">Food</SelectItem>
    </SelectContent>
  </Select>
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="In stock">In stock</SelectItem>
      <SelectItem value="Low stock">Low stock</SelectItem>
      <SelectItem value="Out of stock">Out of stock</SelectItem>
    </SelectContent>
  </Select>
</div>
<Table>{/* filtered rows */}</Table>`}
      >
        <FacetedFilterTableExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
