import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
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
} from "./TreeView"

const meta: Meta<typeof TreeView> = {
  title: "UI/TreeView",
  component: TreeView,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof TreeView>

const fileTree: TreeNode = {
  id: "root",
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
}

export const Default: Story = {
  render: () => (
    <TreeView data={fileTree} defaultExpanded={["components"]}>
      <TreeViewLabel>Project</TreeViewLabel>
      <TreeViewTree>
        {fileTree.children?.map((node) => (
          <TreeViewNode key={node.id} node={node} />
        ))}
      </TreeViewTree>
    </TreeView>
  ),
}

export const MultiSelect: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([])
    return (
      <TreeView
        data={fileTree}
        defaultExpanded={["components", "hooks"]}
        selectionMode="multiple"
        selected={selected}
        onSelectedChange={(d) => setSelected(d.value)}
      >
        <TreeViewLabel>Multi-select</TreeViewLabel>
        <TreeViewTree>
          {fileTree.children?.map((node) => (
            <TreeViewNode key={node.id} node={node} />
          ))}
        </TreeViewTree>
      </TreeView>
    )
  },
}

export const ManualComposition: Story = {
  render: () => (
    <TreeView defaultExpanded={["1"]}>
      <TreeViewLabel>Files</TreeViewLabel>
      <TreeViewTree>
        <TreeViewBranch value="1">
          <TreeViewBranchControl>
            <TreeViewBranchIndicator>
              <ChevronRight />
            </TreeViewBranchIndicator>
            <TreeViewBranchText>Documents</TreeViewBranchText>
          </TreeViewBranchControl>
          <TreeViewBranchContent>
            <TreeViewItem value="1-1">Resume.pdf</TreeViewItem>
            <TreeViewItem value="1-2">CoverLetter.docx</TreeViewItem>
          </TreeViewBranchContent>
        </TreeViewBranch>
        <TreeViewItem value="2">README.md</TreeViewItem>
      </TreeViewTree>
    </TreeView>
  ),
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
