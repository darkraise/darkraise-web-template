import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"

import { UiI18nProvider } from "../../i18n"
import { vi as vietnamese } from "../../locales/vi"
import { MultiSelect, type MultiSelectItem } from "./MultiSelect"

const FRUITS: MultiSelectItem[] = [
  { value: "apple", label: "Apple" },
  { value: "pear", label: "Pear" },
]

describe("MultiSelect naming", () => {
  it("names the input from aria-label", () => {
    render(<MultiSelect items={FRUITS} aria-label="Fruits" />)
    expect(screen.getByRole("combobox", { name: "Fruits" })).toBeInTheDocument()
  })

  it("names the input from aria-labelledby and forwards id to it", () => {
    render(
      <>
        <span id="fruits-heading">Favourite fruits</span>
        <MultiSelect
          items={FRUITS}
          aria-labelledby="fruits-heading"
          id="fruits"
        />
      </>,
    )
    const input = screen.getByRole("combobox", { name: "Favourite fruits" })
    expect(input).toHaveAttribute("id", "fruits")
  })

  it("takes its name from a label pointing at the forwarded id", () => {
    render(
      <>
        <label htmlFor="fruits">Fruits</label>
        <MultiSelect items={FRUITS} id="fruits" />
      </>,
    )
    expect(screen.getByRole("combobox", { name: "Fruits" })).toBeInTheDocument()
  })

  it("leaves no aria-labelledby pointing at a missing element", async () => {
    const user = userEvent.setup()
    render(<MultiSelect items={FRUITS} />)
    const input = screen.getByRole("combobox")
    await user.click(input)
    const listbox = await screen.findByRole("listbox")
    for (const element of [input, listbox]) {
      const ids = element.getAttribute("aria-labelledby")?.split(/\s+/) ?? []
      for (const id of ids) {
        expect(document.getElementById(id)).not.toBeNull()
      }
    }
  })

  it("names the listbox like the input", async () => {
    const user = userEvent.setup()
    render(<MultiSelect items={FRUITS} aria-label="Fruits" />)
    await user.click(screen.getByRole("combobox", { name: "Fruits" }))
    expect(
      await screen.findByRole("listbox", { name: "Fruits" }),
    ).toBeInTheDocument()
  })
})

describe("MultiSelect chips", () => {
  it("names the remove button through the remove announcement", () => {
    render(
      <MultiSelect
        items={FRUITS}
        defaultValue={["apple"]}
        aria-label="Fruits"
      />,
    )
    expect(
      screen.getByRole("button", { name: "Remove Apple" }),
    ).toBeInTheDocument()
  })

  it("translates the remove button name", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <MultiSelect
          items={FRUITS}
          defaultValue={["apple"]}
          aria-label="Fruits"
        />
      </UiI18nProvider>,
    )
    expect(
      screen.getByRole("button", { name: "Xóa Apple" }),
    ).toBeInTheDocument()
  })
})
