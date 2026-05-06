import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  TreeView,
  TreeViewLabel,
  TreeViewNode,
  TreeViewTree,
  type TreeNode,
} from "./TreeView"

const tree: TreeNode = {
  id: "root",
  name: "Files",
  children: [
    {
      id: "1",
      name: "Documents",
      children: [
        { id: "1-1", name: "Resume.pdf" },
        { id: "1-2", name: "CoverLetter.docx" },
      ],
    },
    {
      id: "2",
      name: "Pictures",
      children: [
        { id: "2-1", name: "vacation.png" },
        { id: "2-2", name: "family.jpg" },
      ],
    },
    { id: "3", name: "todo.txt" },
  ],
}

interface BasicProps {
  defaultExpanded?: string[]
  selectionMode?: "single" | "multiple" | "none"
  disabled?: boolean
  data?: TreeNode
}

function Basic(props: BasicProps = {}) {
  const data = props.data ?? tree
  return (
    <TreeView
      data={data}
      defaultExpanded={props.defaultExpanded ?? []}
      selectionMode={props.selectionMode ?? "single"}
      disabled={props.disabled}
    >
      <TreeViewLabel>Files</TreeViewLabel>
      <TreeViewTree>
        {data.children?.map((node) => (
          <TreeViewNode key={node.id} node={node} />
        ))}
      </TreeViewTree>
    </TreeView>
  )
}

describe("TreeView", () => {
  it("renders root tree with branches and items", () => {
    render(<Basic />)
    const tree = screen.getByRole("tree")
    expect(tree).toBeInTheDocument()
    expect(within(tree).getByText("Documents")).toBeInTheDocument()
    expect(within(tree).getByText("Pictures")).toBeInTheDocument()
    expect(within(tree).getByText("todo.txt")).toBeInTheDocument()
    // Children of collapsed branches should not be visible.
    expect(within(tree).queryByText("Resume.pdf")).toBeNull()
  })

  it("clicking a branch expands it", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    expect(screen.queryByText("Resume.pdf")).toBeNull()
    await user.click(screen.getByText("Documents"))
    expect(screen.getByText("Resume.pdf")).toBeInTheDocument()
    expect(screen.getByText("CoverLetter.docx")).toBeInTheDocument()
  })

  it("clicking an item selects it (single mode)", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1"]} />)
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    expect(resume).toHaveAttribute("aria-selected", "false")
    await user.click(resume)
    expect(resume).toHaveAttribute("aria-selected", "true")

    const cover = screen
      .getByText("CoverLetter.docx")
      .closest("li") as HTMLElement
    await user.click(cover)
    // Single mode: previous selection cleared.
    expect(cover).toHaveAttribute("aria-selected", "true")
    expect(resume).toHaveAttribute("aria-selected", "false")
  })

  it("multi-select mode allows multiple selections", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1"]} selectionMode="multiple" />)
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    const cover = screen
      .getByText("CoverLetter.docx")
      .closest("li") as HTMLElement
    await user.click(resume)
    await user.click(cover)
    expect(resume).toHaveAttribute("aria-selected", "true")
    expect(cover).toHaveAttribute("aria-selected", "true")
  })

  it("ArrowDown moves focus through visible nodes", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1"]} />)
    // Focus the Documents branch row first.
    const documentsRow = screen
      .getByText("Documents")
      .closest(".dr-tree-view-branch-control") as HTMLElement
    documentsRow.focus()
    expect(documentsRow).toHaveFocus()

    await user.keyboard("{ArrowDown}")
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    expect(resume).toHaveFocus()

    await user.keyboard("{ArrowDown}")
    const cover = screen
      .getByText("CoverLetter.docx")
      .closest("li") as HTMLElement
    expect(cover).toHaveFocus()
  })

  it("ArrowRight expands collapsed branch; if expanded, moves to first child", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const documentsRow = screen
      .getByText("Documents")
      .closest(".dr-tree-view-branch-control") as HTMLElement
    documentsRow.focus()
    expect(documentsRow).toHaveFocus()

    // First press: expand the branch.
    await user.keyboard("{ArrowRight}")
    expect(screen.getByText("Resume.pdf")).toBeInTheDocument()
    expect(documentsRow).toHaveFocus()

    // Second press: move to first child.
    await user.keyboard("{ArrowRight}")
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    expect(resume).toHaveFocus()
  })

  it("ArrowLeft collapses expanded branch; if collapsed, moves to parent", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1"]} />)
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    resume.focus()
    expect(resume).toHaveFocus()

    // ArrowLeft on a child moves to parent.
    await user.keyboard("{ArrowLeft}")
    const documentsRow = screen
      .getByText("Documents")
      .closest(".dr-tree-view-branch-control") as HTMLElement
    expect(documentsRow).toHaveFocus()

    // ArrowLeft on an expanded branch collapses it.
    await user.keyboard("{ArrowLeft}")
    expect(screen.queryByText("Resume.pdf")).toBeNull()
  })

  it("Home moves to first node; End to last", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1", "2"]} />)
    // Pick a row in the middle.
    const pictures = screen
      .getByText("Pictures")
      .closest(".dr-tree-view-branch-control") as HTMLElement
    pictures.focus()
    expect(pictures).toHaveFocus()

    await user.keyboard("{Home}")
    const documentsRow = screen
      .getByText("Documents")
      .closest(".dr-tree-view-branch-control") as HTMLElement
    expect(documentsRow).toHaveFocus()

    await user.keyboard("{End}")
    const todo = screen.getByText("todo.txt").closest("li") as HTMLElement
    expect(todo).toHaveFocus()
  })

  it("disabled tree is non-interactive", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1"]} disabled />)
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    await user.click(resume)
    // Selection should not change on disabled tree.
    expect(resume).toHaveAttribute("aria-selected", "false")
  })

  it("Enter and Space toggle selection on focused node", async () => {
    const user = userEvent.setup()
    render(<Basic defaultExpanded={["1"]} />)
    const resume = screen.getByText("Resume.pdf").closest("li") as HTMLElement
    resume.focus()
    expect(resume).toHaveFocus()

    await user.keyboard("{Enter}")
    expect(resume).toHaveAttribute("aria-selected", "true")
  })
})
