import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Editable,
  EditableArea,
  EditableCancelTrigger,
  EditableControl,
  EditableEditTrigger,
  EditableInput,
  EditableLabel,
  EditablePreview,
  EditableSubmitTrigger,
} from "./Editable"
import type {
  EditableEditChangeDetails,
  EditableValueChangeDetails,
  EditableValueCommitDetails,
} from "./Editable"

function Basic(props: Partial<React.ComponentProps<typeof Editable>> = {}) {
  return (
    <Editable placeholder="Click to edit" {...props}>
      <EditableLabel>Name</EditableLabel>
      <EditableArea>
        <EditableInput aria-label="name-input" />
        <EditablePreview data-testid="preview" />
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger>Edit</EditableEditTrigger>
        <EditableSubmitTrigger>Save</EditableSubmitTrigger>
        <EditableCancelTrigger>Cancel</EditableCancelTrigger>
      </EditableControl>
    </Editable>
  )
}

describe("Editable", () => {
  it("renders preview by default and shows the committed value", () => {
    render(<Basic defaultValue="Ada" />)
    const preview = screen.getByTestId("preview")
    expect(preview).toHaveAttribute("data-state", "preview")
    expect(preview).toHaveTextContent("Ada")
  })

  it("renders the placeholder when value is empty", () => {
    render(<Basic defaultValue="" />)
    const preview = screen.getByTestId("preview")
    expect(preview).toHaveTextContent("Click to edit")
    expect(preview).toHaveAttribute("data-empty", "true")
  })

  it("enters edit mode when the preview is clicked", async () => {
    const user = userEvent.setup()
    render(<Basic defaultValue="Ada" />)
    await user.click(screen.getByTestId("preview"))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    expect(input).toBeVisible()
    expect(input.value).toBe("Ada")
  })

  it("submits on Enter and fires onValueCommit", async () => {
    const user = userEvent.setup()
    const onValueCommit = vi.fn<(d: EditableValueCommitDetails) => void>()
    render(<Basic defaultValue="Ada" onValueCommit={onValueCommit} />)

    await user.click(screen.getByTestId("preview"))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "Grace")
    await user.keyboard("{Enter}")

    expect(onValueCommit).toHaveBeenCalledWith({ value: "Grace" })
    expect(screen.getByTestId("preview")).toHaveAttribute(
      "data-state",
      "preview",
    )
    expect(screen.getByTestId("preview")).toHaveTextContent("Grace")
  })

  it("cancels on Escape and restores the original value", async () => {
    const user = userEvent.setup()
    const onValueCommit = vi.fn<(d: EditableValueCommitDetails) => void>()
    render(<Basic defaultValue="Ada" onValueCommit={onValueCommit} />)

    await user.click(screen.getByTestId("preview"))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "Grace")
    await user.keyboard("{Escape}")

    expect(onValueCommit).not.toHaveBeenCalled()
    const preview = screen.getByTestId("preview")
    expect(preview).toHaveAttribute("data-state", "preview")
    expect(preview).toHaveTextContent("Ada")
  })

  it("submits on blur when submitOnBlur is enabled", async () => {
    const user = userEvent.setup()
    const onValueCommit = vi.fn<(d: EditableValueCommitDetails) => void>()
    render(
      <>
        <Basic defaultValue="Ada" submitOnBlur onValueCommit={onValueCommit} />
        <button type="button">outside</button>
      </>,
    )

    await user.click(screen.getByTestId("preview"))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "Hopper")
    await user.click(screen.getByRole("button", { name: "outside" }))

    expect(onValueCommit).toHaveBeenCalledWith({ value: "Hopper" })
    expect(screen.getByTestId("preview")).toHaveTextContent("Hopper")
  })

  it("does not enter edit mode when disabled", async () => {
    const user = userEvent.setup()
    render(<Basic defaultValue="Ada" disabled />)
    await user.click(screen.getByTestId("preview"))
    const preview = screen.getByTestId("preview")
    expect(preview).toHaveAttribute("data-state", "preview")
    expect(preview).toHaveAttribute("aria-disabled", "true")
    expect(preview).toHaveAttribute("tabindex", "-1")
  })

  it("honors the controlled `edit` prop and fires onEditChange", async () => {
    const user = userEvent.setup()
    const onEditChange = vi.fn<(d: EditableEditChangeDetails) => void>()

    function Controlled() {
      const [edit, setEdit] = React.useState(false)
      return (
        <>
          <button type="button" onClick={() => setEdit(true)}>
            external-edit
          </button>
          <Editable
            defaultValue="Ada"
            edit={edit}
            onEditChange={(d) => {
              onEditChange(d)
              setEdit(d.edit)
            }}
          >
            <EditableArea>
              <EditableInput aria-label="name-input" />
              <EditablePreview data-testid="preview" />
            </EditableArea>
          </Editable>
        </>
      )
    }

    render(<Controlled />)

    expect(screen.getByTestId("preview")).toHaveAttribute(
      "data-state",
      "preview",
    )

    await user.click(screen.getByRole("button", { name: "external-edit" }))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    expect(input).toBeVisible()
    expect(screen.getByTestId("preview")).toHaveAttribute("data-state", "edit")

    await user.keyboard("{Escape}")
    expect(onEditChange).toHaveBeenCalledWith({ edit: false })
  })

  it("fires onValueChange while typing without committing", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn<(d: EditableValueChangeDetails) => void>()
    const onValueCommit = vi.fn<(d: EditableValueCommitDetails) => void>()
    render(
      <Basic
        defaultValue=""
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    )

    await user.click(screen.getByTestId("preview"))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    await user.type(input, "Hi")

    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange).toHaveBeenLastCalledWith({ value: "Hi" })
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  it("commits when the explicit submit trigger is clicked", async () => {
    const user = userEvent.setup()
    const onValueCommit = vi.fn<(d: EditableValueCommitDetails) => void>()
    render(<Basic defaultValue="Ada" onValueCommit={onValueCommit} />)

    await user.click(screen.getByTestId("preview"))
    const input = screen.getByLabelText("name-input") as HTMLInputElement
    await user.clear(input)
    await user.type(input, "Grace")
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(onValueCommit).toHaveBeenCalledWith({ value: "Grace" })
    expect(screen.getByTestId("preview")).toHaveTextContent("Grace")
  })
})
