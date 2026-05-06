import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"

import {
  TagsInput,
  TagsInputClearTrigger,
  TagsInputControl,
  TagsInputHiddenInput,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemDeleteTrigger,
  TagsInputItemInput,
  TagsInputItemPreview,
  TagsInputItemText,
  TagsInputLabel,
  type TagsInputValueChangeDetails,
} from "./TagsInput"

interface BasicProps {
  defaultValue?: string[]
  validate?: (value: string, currentTags: string[]) => boolean
  maxItems?: number
  allowDuplicates?: boolean
  disabled?: boolean
  readOnly?: boolean
  pasteSplit?: boolean
  delimiter?: string | string[]
  name?: string
  onValueChangeSpy?: (details: TagsInputValueChangeDetails) => void
}

function Basic({
  defaultValue,
  validate,
  maxItems,
  allowDuplicates,
  disabled,
  readOnly,
  pasteSplit,
  delimiter,
  name,
  onValueChangeSpy,
}: BasicProps) {
  const [tags, setTags] = React.useState<string[]>(defaultValue ?? [])
  return (
    <TagsInput
      value={tags}
      onValueChange={(d) => {
        setTags(d.value)
        onValueChangeSpy?.(d)
      }}
      validate={validate}
      maxItems={maxItems}
      allowDuplicates={allowDuplicates}
      disabled={disabled}
      readOnly={readOnly}
      pasteSplit={pasteSplit}
      delimiter={delimiter}
      name={name}
    >
      <TagsInputLabel>Tags</TagsInputLabel>
      <TagsInputControl>
        {tags.map((tag, index) => (
          <TagsInputItem key={`${tag}-${index}`} index={index} value={tag}>
            <TagsInputItemPreview>
              <TagsInputItemText>{tag}</TagsInputItemText>
              <TagsInputItemDeleteTrigger>x</TagsInputItemDeleteTrigger>
            </TagsInputItemPreview>
            <TagsInputItemInput />
          </TagsInputItem>
        ))}
        <TagsInputInput placeholder="Add tag..." />
      </TagsInputControl>
      <TagsInputClearTrigger>clear</TagsInputClearTrigger>
      <TagsInputHiddenInput />
    </TagsInput>
  )
}

function getInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Add tag...") as HTMLInputElement
}

describe("TagsInput", () => {
  it("typing then Enter adds a tag", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.type(input, "alpha")
    await user.keyboard("{Enter}")
    expect(spy).toHaveBeenCalled()
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["alpha"])
    expect(input.value).toBe("")
  })

  it("typing then comma adds a tag", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.type(input, "beta,")
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["beta"])
    expect(input.value).toBe("")
  })

  it("Backspace on empty input twice removes the last tag", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic defaultValue={["one", "two"]} onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.keyboard("{Backspace}")
    // First press should not have removed anything yet.
    expect(spy).not.toHaveBeenCalled()
    await user.keyboard("{Backspace}")
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["one"])
  })

  it("clicking a tag focuses it and Backspace deletes it", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic defaultValue={["red", "green"]} onValueChangeSpy={spy} />)
    const previews = screen
      .getAllByRole("button")
      .filter((el) => el.getAttribute("aria-label")?.startsWith("red,"))
    const target = previews[0]
    if (!target) throw new Error("expected red preview to be rendered")
    await user.click(target)
    expect(target).toHaveAttribute("data-highlighted", "true")
    await user.keyboard("{Backspace}")
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["green"])
  })

  it("validation rejects invalid input — onValueChange not called", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic validate={(v) => v.includes("@")} onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.type(input, "not-email")
    await user.keyboard("{Enter}")
    expect(spy).not.toHaveBeenCalled()
    expect(input.value).toBe("not-email")
  })

  it("rejects duplicates when allowDuplicates is false", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(
      <Basic
        defaultValue={["alpha"]}
        allowDuplicates={false}
        onValueChangeSpy={spy}
      />,
    )
    const input = getInput()
    await user.click(input)
    await user.type(input, "alpha")
    await user.keyboard("{Enter}")
    expect(spy).not.toHaveBeenCalled()
  })

  it("enforces maxItems", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(
      <Basic defaultValue={["a", "b"]} maxItems={2} onValueChangeSpy={spy} />,
    )
    const input = getInput()
    await user.click(input)
    await user.type(input, "c")
    await user.keyboard("{Enter}")
    expect(spy).not.toHaveBeenCalled()
  })

  it("paste-split adds multiple tags", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic pasteSplit={true} onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.paste("a,b,c")
    expect(spy).toHaveBeenCalled()
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["a", "b", "c"])
  })

  it("disabled blocks all interaction", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic disabled defaultValue={["x"]} onValueChangeSpy={spy} />)
    const input = getInput()
    expect(input).toBeDisabled()
    await user.type(input, "blocked")
    await user.keyboard("{Enter}")
    expect(spy).not.toHaveBeenCalled()
  })

  it("renders hidden inputs when name is provided", () => {
    const { container } = render(
      <Basic name="emails" defaultValue={["a@x.com", "b@x.com"]} />,
    )
    const hidden = container.querySelectorAll<HTMLInputElement>(
      "input[type='hidden']",
    )
    expect(hidden).toHaveLength(2)
    expect(hidden[0]?.name).toBe("emails[]")
    expect(hidden[0]?.value).toBe("a@x.com")
    expect(hidden[1]?.value).toBe("b@x.com")
  })

  it("clear trigger removes all tags", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic defaultValue={["a", "b"]} onValueChangeSpy={spy} />)
    const clear = screen.getByRole("button", { name: /clear all tags/i })
    await user.click(clear)
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual([])
  })

  it("delete trigger on a tag removes it", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic defaultValue={["foo", "bar"]} onValueChangeSpy={spy} />)
    const removeBtn = screen.getByRole("button", { name: "Remove foo" })
    await user.click(removeBtn)
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["bar"])
  })

  it("ignores empty input on Enter", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.keyboard("{Enter}")
    expect(spy).not.toHaveBeenCalled()
  })

  it("control click focuses the input", async () => {
    const user = userEvent.setup()
    const { container } = render(<Basic />)
    const control = container.querySelector(
      ".dr-tags-input-control",
    ) as HTMLElement
    await user.click(control)
    expect(getInput()).toHaveFocus()
  })

  it("readOnly blocks adding but renders existing tags", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic readOnly defaultValue={["locked"]} onValueChangeSpy={spy} />)
    expect(screen.getByText("locked")).toBeInTheDocument()
    const input = getInput()
    await user.click(input)
    await user.type(input, "extra")
    await user.keyboard("{Enter}")
    expect(spy).not.toHaveBeenCalled()
  })

  it("supports custom delimiter — semicolon", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    render(<Basic delimiter={[";"]} onValueChangeSpy={spy} />)
    const input = getInput()
    await user.click(input)
    await user.type(input, "x;")
    const last = spy.mock.calls[spy.mock.calls.length - 1]?.[0]
    expect(last.value).toEqual(["x"])
    // Within keeps imported but unused — silence linter while documenting test surface.
    void within
  })
})
