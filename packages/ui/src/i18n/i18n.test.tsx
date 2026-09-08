import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UiLabelsProvider, useUiLabels } from "../labels"
import { UiI18nProvider, useUiLocale, useUiFormatters } from "./index"
import { vi as vietnamese } from "../locales/vi"

function Probe() {
  const labels = useUiLabels()
  const { locale, messageLocale, dir } = useUiLocale()
  const format = useUiFormatters()
  return (
    <output>
      {JSON.stringify({
        locale,
        messageLocale,
        dir,
        empty: labels.dataTable.empty,
        reset: labels.dataTable.reset,
        amount: format.number(1234.5),
        currency: format.number(20, { style: "currency", currency: "USD" }),
      })}
    </output>
  )
}
function result() {
  return JSON.parse(screen.getByRole("status").textContent ?? "{}")
}

describe("UI locale boundaries", () => {
  it("keeps English defaults without a provider", () => {
    render(<Probe />)
    expect(result()).toMatchObject({
      locale: "en",
      messageLocale: "en",
      empty: "No results found",
    })
  })
  it("uses a base pack with regional formatting", () => {
    render(
      <UiI18nProvider locale="vi-VN" locales={[vietnamese]}>
        <Probe />
      </UiI18nProvider>,
    )
    expect(result()).toMatchObject({
      locale: "vi-VN",
      messageLocale: "vi",
      empty: "Không tìm thấy kết quả",
      amount: "1.234,5",
    })
    expect(result().currency).toContain("US$")
  })
  it("lets consumers register a language and partially override it", () => {
    render(
      <UiI18nProvider
        locale="fr-CA"
        locales={[
          {
            locale: "fr",
            label: "Français",
            messages: { dataTable: { empty: "Aucun résultat" } },
          },
        ]}
        labels={{ dataTable: { reset: "Effacer" } }}
      >
        <Probe />
      </UiI18nProvider>,
    )
    expect(result()).toMatchObject({
      locale: "fr-CA",
      messageLocale: "fr",
      empty: "Aucun résultat",
      reset: "Effacer",
    })
  })
  it("preserves legacy overrides and ignores undefined leaves", () => {
    render(
      <UiI18nProvider
        locale="vi"
        locales={[vietnamese]}
        labels={{ dataTable: { reset: "Outer" } }}
      >
        <UiLabelsProvider
          value={{ dataTable: { empty: "", reset: undefined } }}
        >
          <Probe />
        </UiLabelsProvider>
      </UiI18nProvider>,
    )
    expect(result()).toMatchObject({ empty: "", reset: "Outer" })
  })
  it("starts an explicit nested boundary from its own language", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <UiLabelsProvider value={{ dataTable: { empty: "Outer" } }}>
          <UiI18nProvider locale="en">
            <Probe />
          </UiI18nProvider>
        </UiLabelsProvider>
      </UiI18nProvider>,
    )
    expect(result().empty).toBe("No results found")
  })
  it("inherits messages when a nested provider does not set locale", () => {
    render(
      <UiI18nProvider locale="vi" locales={[vietnamese]}>
        <UiI18nProvider labels={{ dataTable: { reset: "Inner" } }}>
          <Probe />
        </UiI18nProvider>
      </UiI18nProvider>,
    )
    expect(result()).toMatchObject({
      empty: "Không tìm thấy kết quả",
      reset: "Inner",
    })
  })
  it.each([
    ["not_a_locale", "en"],
    ["de-DE", "de-DE"],
  ])("falls back safely for %s", (locale, expected) => {
    render(
      <UiI18nProvider locale={locale}>
        <Probe />
      </UiI18nProvider>,
    )
    expect(result()).toMatchObject({ locale: expected, messageLocale: "en" })
  })
})
