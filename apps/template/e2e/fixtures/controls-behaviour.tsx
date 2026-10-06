import { createRoot } from "react-dom/client"
import {
  TreeView,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "darkraise-ui/components/tree-view"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const FILES: TreeNode = {
  id: "root",
  name: "Files",
  children: [
    {
      id: "docs",
      name: "Documents",
      children: [{ id: "resume", name: "Resume.pdf" }],
    },
    { id: "todo", name: "todo.txt" },
  ],
}

function Tree({ variant }: { variant: "filled" | "outline" }) {
  return (
    <TreeView
      data={FILES}
      variant={variant}
      defaultExpanded={["docs"]}
      defaultSelected={["todo"]}
      selectionMode="single"
    >
      <TreeViewTree>
        {FILES.children?.map((node) => (
          <TreeViewNode key={node.id} node={node} />
        ))}
      </TreeViewTree>
    </TreeView>
  )
}

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="controls-behaviour"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Controls behaviour</p>
      <div data-probe="tree" style={{ width: 240 }}>
        <Tree variant="filled" />
      </div>
    </div>
  </ThemeProvider>,
)
