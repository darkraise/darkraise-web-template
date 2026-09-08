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
    within(
      screen.getByRole("option", { name: "English", exact: true }),
    ).getByTestId("en-flag"),
  ).toBeVisible()
  expect(
    within(
      screen.getByRole("option", { name: "Français", exact: true }),
    ).getByTestId("fr-flag"),
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
