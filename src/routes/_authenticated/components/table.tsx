import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import { Badge } from "@/core/components/ui/badge"
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

function TablePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Table" },
        ]}
        title="Table"
        description="Semantic HTML table with caption, column headers, body rows, and an optional summary footer."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Basic table with caption"
          code={`<Table>
  <TableCaption>A sample product inventory table.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Product</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className="text-right">Price</TableHead>
      <TableHead className="text-right">Stock</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell className="font-medium">{row.name}</TableCell>
        <TableCell>{row.category}</TableCell>
        <TableCell className="text-right">\${row.price.toFixed(2)}</TableCell>
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
            <TableCaption>A sample product inventory table.</TableCaption>
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
          code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Product</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell className="font-medium">{row.name}</TableCell>
        <TableCell>
          <Badge variant={row.stock === 0 ? "destructive" : row.stock < 80 ? "outline" : "default"}>
            {row.stock === 0 ? "Out of stock" : row.stock < 80 ? "Low stock" : "In stock"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">\${row.price.toFixed(2)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`}
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
      </div>
    </div>
  )
}
