import { createFileRoute } from "@tanstack/react-router"
import {
  TreeView,
  TreeViewBranch,
  TreeViewBranchContent,
  TreeViewBranchControl,
  TreeViewBranchIndicator,
  TreeViewBranchText,
  TreeViewItem,
  TreeViewLabel,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "darkraise-ui/components/tree-view"
import {
  ChevronRight,
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Loader2,
} from "lucide-react"
import { useCallback, useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tree-view")({
  component: TreeViewPage,
})

const fileTree: TreeNode = {
  id: "root",
  name: "project",
  children: [
    {
      id: "src",
      name: "src",
      children: [
        {
          id: "components",
          name: "components",
          children: [
            { id: "Button.tsx", name: "Button.tsx" },
            { id: "Card.tsx", name: "Card.tsx" },
            { id: "Input.tsx", name: "Input.tsx" },
          ],
        },
        {
          id: "hooks",
          name: "hooks",
          children: [
            { id: "useToggle.ts", name: "useToggle.ts" },
            { id: "useDebounce.ts", name: "useDebounce.ts" },
          ],
        },
        { id: "App.tsx", name: "App.tsx" },
        { id: "index.ts", name: "index.ts" },
      ],
    },
    {
      id: "public",
      name: "public",
      children: [
        { id: "logo.svg", name: "logo.svg" },
        { id: "favicon.ico", name: "favicon.ico" },
      ],
    },
    { id: "package.json", name: "package.json" },
    { id: "README.md", name: "README.md" },
  ],
}

function FileExplorerExample() {
  const [expanded, setExpanded] = useState<string[]>(["src", "components"])

  const renderNode = (node: TreeNode) => {
    if (node.children && node.children.length > 0) {
      const isOpen = expanded.includes(node.id)
      return (
        <TreeViewBranch key={node.id} value={node.id}>
          <TreeViewBranchControl>
            <TreeViewBranchIndicator>
              <ChevronRight className="size-3.5" />
            </TreeViewBranchIndicator>
            {isOpen ? (
              <FolderOpen className="size-4 shrink-0" />
            ) : (
              <Folder className="size-4 shrink-0" />
            )}
            <TreeViewBranchText>{node.name}</TreeViewBranchText>
          </TreeViewBranchControl>
          <TreeViewBranchContent>
            {node.children.map((child) => renderNode(child))}
          </TreeViewBranchContent>
        </TreeViewBranch>
      )
    }
    const Icon = pickIcon(node.name)
    return (
      <TreeViewItem key={node.id} value={node.id}>
        <span className="size-4 shrink-0" aria-hidden />
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{node.name}</span>
      </TreeViewItem>
    )
  }

  return (
    <TreeView
      data={fileTree}
      expanded={expanded}
      onExpandedChange={(d) => setExpanded(d.value)}
    >
      <TreeViewLabel>Project files</TreeViewLabel>
      <TreeViewTree>
        {fileTree.children?.map((node) => renderNode(node))}
      </TreeViewTree>
    </TreeView>
  )
}

function MultiSelectExample() {
  const [selected, setSelected] = useState<string[]>([])
  return (
    <div className="space-y-3">
      <TreeView
        data={fileTree}
        defaultExpanded={["src"]}
        selectionMode="multiple"
        selected={selected}
        onSelectedChange={(d) => setSelected(d.value)}
      >
        <TreeViewLabel>Pick files</TreeViewLabel>
        <TreeViewTree>
          {fileTree.children?.map((node) => (
            <TreeViewNode key={node.id} node={node} />
          ))}
        </TreeViewTree>
      </TreeView>
      <p className="text-muted-foreground text-xs">
        Selected: {selected.length === 0 ? "none" : selected.join(", ")}
      </p>
    </div>
  )
}

function ControlledExpansionExample() {
  const [expanded, setExpanded] = useState<string[]>([])
  const expandAll = useCallback(() => {
    setExpanded(["src", "components", "hooks", "public"])
  }, [])
  const collapseAll = useCallback(() => {
    setExpanded([])
  }, [])
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          className="border-border hover:bg-accent rounded-md border px-3 py-1.5 text-xs"
          onClick={expandAll}
        >
          Expand all
        </button>
        <button
          type="button"
          className="border-border hover:bg-accent rounded-md border px-3 py-1.5 text-xs"
          onClick={collapseAll}
        >
          Collapse all
        </button>
      </div>
      <TreeView
        data={fileTree}
        expanded={expanded}
        onExpandedChange={(d) => setExpanded(d.value)}
      >
        <TreeViewLabel>Controlled tree</TreeViewLabel>
        <TreeViewTree>
          {fileTree.children?.map((node) => (
            <TreeViewNode key={node.id} node={node} />
          ))}
        </TreeViewTree>
      </TreeView>
    </div>
  )
}

const lazyTree: TreeNode = {
  id: "root",
  name: "remote",
  children: [
    { id: "users", name: "users", children: [] },
    { id: "posts", name: "posts", children: [] },
    { id: "settings.json", name: "settings.json" },
  ],
}

function LazyLoadExample() {
  const [data, setData] = useState<TreeNode>(lazyTree)
  const [expanded, setExpanded] = useState<string[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const ensureLoaded = useCallback(
    async (id: string) => {
      const node = findNode(data, id)
      if (!node) return
      if (!node.children || node.children.length > 0) return
      setLoadingId(id)
      await delay(700)
      setData((prev) => fillChildren(prev, id, mockChildren(id)))
      setLoadingId(null)
    },
    [data],
  )

  const handleExpandedChange = useCallback(
    (next: string[]) => {
      const newlyOpened = next.find((v) => !expanded.includes(v))
      setExpanded(next)
      if (newlyOpened) void ensureLoaded(newlyOpened)
    },
    [expanded, ensureLoaded],
  )

  const renderNode = (node: TreeNode) => {
    if (node.children) {
      const isLoading = loadingId === node.id
      return (
        <TreeViewBranch key={node.id} value={node.id}>
          <TreeViewBranchControl>
            <TreeViewBranchIndicator>
              <ChevronRight className="size-3.5" />
            </TreeViewBranchIndicator>
            <Folder className="size-4 shrink-0" />
            <TreeViewBranchText>{node.name}</TreeViewBranchText>
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : null}
          </TreeViewBranchControl>
          <TreeViewBranchContent>
            {node.children.length === 0 && !isLoading ? (
              <li className="text-muted-foreground py-1 pl-8 text-xs">Empty</li>
            ) : (
              node.children.map((child) => renderNode(child))
            )}
          </TreeViewBranchContent>
        </TreeViewBranch>
      )
    }
    return (
      <TreeViewItem key={node.id} value={node.id}>
        <File className="size-4 shrink-0" />
        <span className="truncate">{node.name}</span>
      </TreeViewItem>
    )
  }

  return (
    <TreeView
      data={data}
      expanded={expanded}
      onExpandedChange={(d) => handleExpandedChange(d.value)}
    >
      <TreeViewLabel>Remote (lazy)</TreeViewLabel>
      <TreeViewTree>
        {data.children?.map((node) => renderNode(node))}
      </TreeViewTree>
    </TreeView>
  )
}

function pickIcon(name: string) {
  if (/\.(png|jpg|jpeg|gif|svg|ico)$/i.test(name)) return Image
  if (/\.(md|txt|json)$/i.test(name)) return FileText
  return File
}

function findNode(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node
  if (!node.children) return null
  for (const child of node.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

function fillChildren(
  node: TreeNode,
  id: string,
  children: TreeNode[],
): TreeNode {
  if (node.id === id) {
    return { ...node, children }
  }
  if (!node.children) return node
  return {
    ...node,
    children: node.children.map((child) => fillChildren(child, id, children)),
  }
}

function mockChildren(id: string): TreeNode[] {
  if (id === "users") {
    return [
      { id: "users/alice", name: "alice.json" },
      { id: "users/bob", name: "bob.json" },
    ]
  }
  if (id === "posts") {
    return [
      { id: "posts/1", name: "post-001.md" },
      { id: "posts/2", name: "post-002.md" },
    ]
  }
  return []
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function TreeViewPage() {
  return (
    <ShowcasePage
      title="TreeView"
      description="Recursive tree with expansion, selection, roving keyboard focus, and ARIA tree semantics."
    >
      <ShowcaseExample
        title="File explorer with icons"
        code={`<TreeView data={fileTree} defaultExpanded={["src"]}>
  <TreeViewLabel>Project files</TreeViewLabel>
  <TreeViewTree>
    {fileTree.children?.map((node) => renderNode(node))}
  </TreeViewTree>
</TreeView>`}
      >
        <FileExplorerExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Multi-select"
        code={`<TreeView
  data={fileTree}
  selectionMode="multiple"
  selected={selected}
  onSelectedChange={(d) => setSelected(d.value)}
>
  <TreeViewTree>
    {fileTree.children?.map((node) => (
      <TreeViewNode key={node.id} node={node} />
    ))}
  </TreeViewTree>
</TreeView>`}
      >
        <MultiSelectExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Controlled expansion"
        code={`<TreeView
  data={fileTree}
  expanded={expanded}
  onExpandedChange={(d) => setExpanded(d.value)}
>
  {/* expand-all / collapse-all buttons */}
</TreeView>`}
      >
        <ControlledExpansionExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Lazy-load children"
        code={`const handleExpandedChange = (next) => {
  const newlyOpened = next.find((v) => !expanded.includes(v))
  setExpanded(next)
  if (newlyOpened) void ensureLoaded(newlyOpened)
}`}
      >
        <LazyLoadExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
