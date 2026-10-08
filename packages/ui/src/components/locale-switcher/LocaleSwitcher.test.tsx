import { readFileSync } from "node:fs"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { LocaleSwitcher } from "./LocaleSwitcher"

it("shows consumer icons in the trigger and options without changing names or typeahead", async () => {
  const changed = vi.fn()
  const options = [
    {
      locale: "en",
      label: "English",
      icon: (
        <svg data-testid="en-flag">
          <title>United States</title>
        </svg>
      ),
    },
    {
      locale: "fr",
      label: "Français",
      icon: <img data-testid="fr-flag" src="/flags/fr.svg" alt="France" />,
    },
  ]
  const view = (value: string) => (
    <LocaleSwitcher value={value} options={options} onValueChange={changed} />
  )
  const { rerender } = render(view("en"))
  const trigger = screen.getByRole("combobox", { name: "Language" })
  expect(
    within(trigger).getByTestId("en-flag").closest('[aria-hidden="true"]'),
  ).not.toBeNull()
  const user = userEvent.setup()
  await user.click(trigger)
  expect(
    within(screen.getByRole("option", { name: "English" })).getByTestId(
      "en-flag",
    ),
  ).toBeVisible()
  expect(
    within(screen.getByRole("option", { name: "Français" })).getByTestId(
      "fr-flag",
    ),
  ).toBeVisible()
  await user.keyboard("f{Enter}")
  expect(changed).toHaveBeenLastCalledWith("fr")
  rerender(view("fr"))
  expect(within(trigger).getByTestId("fr-flag")).toBeVisible()
  expect(within(trigger).queryByTestId("en-flag")).toBeNull()
  expect(trigger).toHaveTextContent("Français")
})

it("offers consumer-defined languages and prevents changes while pending", async () => {
  const changed = vi.fn()
  const options = [
    { locale: "en", label: "English" },
    { locale: "fr", label: "Français" },
  ]
  const { rerender } = render(
    <LocaleSwitcher value="en" options={options} onValueChange={changed} />,
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole("combobox", { name: "Language" }))
  await user.click(screen.getByRole("option", { name: "Français" }))
  expect(changed).toHaveBeenCalledWith("fr")
  rerender(
    <LocaleSwitcher
      value="fr"
      options={options}
      onValueChange={changed}
      pending
    />,
  )
  expect(screen.getByRole("combobox")).toBeDisabled()
  expect(screen.getByRole("combobox")).toHaveTextContent("Français")
})

it("marks a compact trigger and classes every language name", async () => {
  const options = [
    { locale: "en", label: "English" },
    { locale: "fr", label: "Français" },
  ]
  const view = (compact?: boolean) => (
    <LocaleSwitcher
      value="en"
      options={options}
      onValueChange={vi.fn()}
      compact={compact}
    />
  )
  const { rerender } = render(view(true))
  const trigger = screen.getByRole("combobox", { name: "Language" })
  expect(trigger).toHaveAttribute("data-compact", "true")
  expect(within(trigger).getByText("English")).toHaveClass(
    "dr-locale-option-label",
  )
  await userEvent.setup().click(trigger)
  expect(
    within(screen.getByRole("option", { name: "Français" })).getByText(
      "Français",
    ),
  ).toHaveClass("dr-locale-option-label")
  rerender(view())
  expect(trigger).not.toHaveAttribute("data-compact")
})

it("hides a compact trigger's name only beside the selected icon", () => {
  const options = [
    { locale: "en", label: "English", icon: <svg data-testid="en-flag" /> },
    { locale: "fr", label: "Français" },
  ]
  const view = (value: string) => (
    <LocaleSwitcher
      value={value}
      options={options}
      onValueChange={vi.fn()}
      compact
    />
  )
  const { rerender } = render(view("en"))
  const trigger = screen.getByRole("combobox", { name: "Language" })
  expect(trigger).toHaveAttribute("data-compact-icon", "true")
  rerender(view("fr"))
  expect(trigger).toHaveAttribute("data-compact", "true")
  expect(trigger).not.toHaveAttribute("data-compact-icon")

  // Paths resolve from the vitest project root, packages/ui.
  const css = readFileSync(
    "src/components/locale-switcher/locale-switcher.css",
    "utf8",
  ).replace(/\s+/g, " ")
  expect(css).toContain(
    "[data-compact-icon] .dr-locale-option-label { @apply sr-only; }",
  )
  expect(css).not.toContain("[data-compact] .dr-locale-option-label")
})
