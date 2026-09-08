import { createRoot } from "react-dom/client"
import { DataTable } from "darkraise-ui/data-table"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const data = Array.from({ length: 500 }, (_, index) => ({
  name: `Item ${index}`,
  description:
    "Long content that wraps repeatedly inside a narrow table cell. ".repeat(4),
}))

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div style={{ width: 500 }}>
      <DataTable
        columns={[
          { accessorKey: "name", header: "Name" },
          { accessorKey: "description", header: "Description" },
        ]}
        data={data}
        searchKey="name"
        virtualize={{ height: 320, rowHeight: 40 }}
      />
    </div>
  </ThemeProvider>,
)
