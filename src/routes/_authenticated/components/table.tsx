import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { PageHeader } from "@/core/layout"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
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
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/table")({
  component: TablePage,
})

const products = [
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
    status: "active",
  },
  {
    id: "5",
    name: "Smart Plug",
    category: "Electronics",
    price: 24.99,
    stock: 0,
    status: "out",
  },
]

const manyProducts = Array.from({ length: 50 }, (_, i) => ({
  id: String(i + 1),
  name: `Product ${i + 1}`,
  category:
    ["Electronics", "Clothing", "Food", "Books", "Home"][i % 5] ?? "Other",
  price: Math.round((10 + Math.random() * 90) * 100) / 100,
  stock: Math.floor(Math.random() * 500),
  status: i % 7 === 0 ? "out" : i % 3 === 0 ? "low" : "active",
}))

const wideColumns = [
  { key: "id", label: "ID" },
  { key: "name", label: "Product Name" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "sku", label: "SKU" },
  { key: "weight", label: "Weight" },
  { key: "dimensions", label: "Dimensions" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "warranty", label: "Warranty" },
  { key: "rating", label: "Rating" },
]

function PaginatedTable() {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.ceil(manyProducts.length / pageSize)
  const paged = manyProducts.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground">#{row.id}</TableCell>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell className="text-right">
                ${row.price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">{row.stock}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    row.status === "out"
                      ? "destructive"
                      : row.status === "low"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {row.status === "out"
                    ? "Out of stock"
                    : row.status === "low"
                      ? "Low"
                      : "Active"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {page * pageSize + 1}-
          {Math.min((page + 1) * pageSize, manyProducts.length)} of{" "}
          {manyProducts.length}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm">Rows per page</p>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v))
                setPage(0)
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20].map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(0)}
              disabled={page === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableTable() {
  const [sortKey, setSortKey] = useState<"name" | "price" | "stock">("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const sorted = [...products].sort((a, b) => {
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === "number" && typeof bv === "number")
      return sortDir === "asc" ? av - bv : bv - av
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av))
  })

  function toggleSort(key: "name" | "price" | "stock") {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortDir === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => toggleSort("name")}
            >
              Product <SortIcon col="name" />
            </Button>
          </TableHead>
          <TableHead>Category</TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => toggleSort("price")}
            >
              Price <SortIcon col="price" />
            </Button>
          </TableHead>
          <TableHead>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-3 h-8"
              onClick={() => toggleSort("stock")}
            >
              Stock <SortIcon col="stock" />
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.name}</TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>${row.price.toFixed(2)}</TableCell>
            <TableCell>{row.stock}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SelectableTable() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = selected.size === products.length

  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(products.map((p) => p.id)))
  }

  function toggleRow(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {selected.size} of {products.length} row(s) selected
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((row) => (
            <TableRow
              key={row.id}
              data-state={selected.has(row.id) ? "selected" : undefined}
            >
              <TableCell>
                <Checkbox
                  checked={selected.has(row.id)}
                  onCheckedChange={() => toggleRow(row.id)}
                />
              </TableCell>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell className="text-right">
                ${row.price.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FilterableTable() {
  const [search, setSearch] = useState("")
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length ? (
            filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell className="text-right">
                  ${row.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">{row.stock}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function TablePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Table" },
        ]}
        title="Table"
        description="Semantic HTML table with various patterns: basic, scrollable, sticky headers, pagination, sorting, selection, and filtering."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Basic table with footer"
          code={`<Table>
  <TableCaption>Product inventory.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Product</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className="text-right">Price</TableHead>
      <TableHead className="text-right">Stock</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map(row => (
      <TableRow key={row.id}>
        <TableCell className="font-medium">{row.name}</TableCell>
        <TableCell>{row.category}</TableCell>
        <TableCell className="text-right">\${row.price}</TableCell>
        <TableCell className="text-right">{row.stock}</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={3}>Total Items</TableCell>
      <TableCell className="text-right">{total}</TableCell>
    </TableRow>
  </TableFooter>
</Table>`}
        >
          <Table>
            <TableCaption>Product inventory.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right">
                    ${row.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{row.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total Items</TableCell>
                <TableCell className="text-right">
                  {products.reduce((sum, r) => sum + r.stock, 0)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </ShowcaseExample>

        <ShowcaseExample
          title="Table with status badges"
          code={`<Badge variant={stock === 0 ? "destructive" : stock < 80 ? "outline" : "default"}>
  {statusLabel}
</Badge>`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.stock === 0
                          ? "destructive"
                          : row.stock < 80
                            ? "outline"
                            : "default"
                      }
                    >
                      {row.stock === 0
                        ? "Out of stock"
                        : row.stock < 80
                          ? "Low stock"
                          : "In stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${row.price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowcaseExample>

        <ShowcaseExample
          title="Horizontal scroll with many columns"
          code={`<Table>
  {/* Table wrapper has overflow-auto by default */}
  <TableHeader>
    <TableRow>
      {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
    </TableRow>
  </TableHeader>
  ...
</Table>`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                {wideColumns.map((col) => (
                  <TableHead key={col.key} className="whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>#{row.id}</TableCell>
                  <TableCell className="whitespace-nowrap font-medium">
                    {row.name}
                  </TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>${row.price.toFixed(2)}</TableCell>
                  <TableCell>{row.stock}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    SKU-{row.id.padStart(5, "0")}
                  </TableCell>
                  <TableCell>0.{row.id}kg</TableCell>
                  <TableCell className="whitespace-nowrap">
                    10×5×{row.id}cm
                  </TableCell>
                  <TableCell>Acme Corp</TableCell>
                  <TableCell>12 months</TableCell>
                  <TableCell>4.{row.id}/5</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowcaseExample>

        <ShowcaseExample
          title="Sticky header with vertical scroll"
          code={`<div className="max-h-[300px] overflow-auto rounded-md border">
  <table className="w-full text-sm">
    <thead className="sticky top-0 bg-background z-10">
      ...
    </thead>
    <tbody>...</tbody>
  </table>
</div>`}
        >
          <div className="card-surface max-h-[300px] overflow-auto rounded-md border border-border">
            <table className="w-full caption-bottom text-sm">
              <thead className="sticky top-0 z-10 border-b bg-background">
                <tr>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="h-12 px-4 text-left font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="h-12 px-4 text-right font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="h-12 px-4 text-right font-medium text-muted-foreground">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {manyProducts.slice(0, 25).map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 text-muted-foreground">#{row.id}</td>
                    <td className="p-4 font-medium">{row.name}</td>
                    <td className="p-4">{row.category}</td>
                    <td className="p-4 text-right">${row.price.toFixed(2)}</td>
                    <td className="p-4 text-right">{row.stock}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 border-t bg-muted/50 font-medium">
                <tr>
                  <td className="p-4" colSpan={4}>
                    Total Items
                  </td>
                  <td className="p-4 text-right">
                    {manyProducts.slice(0, 25).reduce((s, r) => s + r.stock, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Sortable columns"
          code={`<Button variant="ghost" onClick={() => toggleSort("name")}>
  Product <ArrowUpDown className="ml-2 h-4 w-4" />
</Button>`}
        >
          <SortableTable />
        </ShowcaseExample>

        <ShowcaseExample
          title="Row selection with checkbox"
          code={`<TableRow data-state={selected ? "selected" : undefined}>
  <TableCell><Checkbox checked={selected} onCheckedChange={toggle} /></TableCell>
  ...
</TableRow>`}
        >
          <SelectableTable />
        </ShowcaseExample>

        <ShowcaseExample
          title="Filterable with search"
          code={`const filtered = products.filter(p =>
  p.name.toLowerCase().includes(search.toLowerCase())
)
// Empty state:
<TableCell colSpan={4} className="h-24 text-center">No results.</TableCell>`}
        >
          <FilterableTable />
        </ShowcaseExample>

        <ShowcaseExample
          title="Pagination"
          code={`const paged = data.slice(page * pageSize, (page + 1) * pageSize)

<Button onClick={() => setPage(page - 1)} disabled={page === 0}>
  <ChevronLeft />
</Button>
<span>Page {page + 1} of {totalPages}</span>`}
        >
          <PaginatedTable />
        </ShowcaseExample>

        <ShowcaseExample
          title="Striped rows"
          code={`<TableRow className="even:bg-muted/30">...</TableRow>`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id} className="even:bg-muted/30">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell className="text-right">
                    ${row.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">{row.stock}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowcaseExample>

        <ShowcaseExample
          title="Compact / dense table"
          code={`<TableHead className="h-8 px-2 text-xs">...</TableHead>
<TableCell className="px-2 py-1 text-xs">...</TableCell>`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 px-2 text-xs">Product</TableHead>
                <TableHead className="h-8 px-2 text-xs">Category</TableHead>
                <TableHead className="h-8 px-2 text-right text-xs">
                  Price
                </TableHead>
                <TableHead className="h-8 px-2 text-right text-xs">
                  Stock
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="px-2 py-1 text-xs font-medium">
                    {row.name}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    {row.category}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-right text-xs">
                    ${row.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-right text-xs">
                    {row.stock}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ShowcaseExample>
      </div>
    </div>
  )
}
