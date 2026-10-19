import { render, renderHook, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { UiLabelsProvider, useUiLabels } from "../labels"
import {
  UiI18nProvider,
  useUiLocale,
  useUiFormatters,
  useUiText,
} from "./index"
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
  it("reads Vietnamese text for the corner, copy, colour and crop controls", () => {
    const hook = renderHook(() => useUiText(), {
      wrapper: ({ children }) => (
        <UiI18nProvider locale="vi" locales={[vietnamese]}>
          {children}
        </UiI18nProvider>
      ),
    })
    const keys = [
      "Top-left corner",
      "Top-right corner",
      "Bottom-right corner",
      "Bottom-left corner",
      "Copy",
      "Copied",
      "Current color",
      "2D slider",
      "Crop size",
    ]
    expect(
      Object.fromEntries(keys.map((key) => [key, hook.result.current(key)])),
    ).toEqual({
      "Top-left corner": "Góc trên trái",
      "Top-right corner": "Góc trên phải",
      "Bottom-right corner": "Góc dưới phải",
      "Bottom-left corner": "Góc dưới trái",
      Copy: "Sao chép",
      Copied: "Đã sao chép",
      "Current color": "Màu hiện tại",
      "2D slider": "Thanh trượt 2D",
      "Crop size": "Kích thước vùng cắt",
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
