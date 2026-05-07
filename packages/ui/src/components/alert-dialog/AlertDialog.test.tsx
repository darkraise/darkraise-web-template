import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/alert-dialog"

function Basic() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogCancel>Nope</AlertDialogCancel>
        <AlertDialogAction>Yep</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}

describe("AlertDialog", () => {
  it("renders role=alertdialog when open", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    const dlg = await screen.findByRole("alertdialog")
    expect(dlg).toBeInTheDocument()
    expect(dlg).toHaveAttribute("aria-modal", "true")
  })

  it("links aria-labelledby and aria-describedby", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    const dlg = await screen.findByRole("alertdialog")
    const title = screen.getByText("Are you sure?")
    const desc = screen.getByText("This cannot be undone.")
    expect(dlg.getAttribute("aria-labelledby")).toBe(title.id)
    expect(dlg.getAttribute("aria-describedby")).toBe(desc.id)
  })

  it("Escape closes the alert dialog", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
  })

  it("outside pointerdown does NOT close the alert dialog", async () => {
    const user = userEvent.setup()
    const root = document.createElement("div")
    const outside = document.createElement("button")
    outside.textContent = "outside"
    document.body.append(root, outside)
    render(<Basic />, { container: root })
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    await user.click(outside)
    expect(screen.queryByRole("alertdialog")).toBeInTheDocument()
    root.remove()
    outside.remove()
  })

  it("Action button closes the alert dialog", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    await user.click(screen.getByRole("button", { name: "Yep" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
  })

  it("Cancel button closes the alert dialog", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    await user.click(screen.getByRole("button", { name: "Nope" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
  })

  it("does NOT render the overlay X close button (alertdialog has no X)", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await screen.findByRole("alertdialog")
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })
})
