import { act, render, screen, within } from "@testing-library/react"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { useTranslation } from "react-i18next"
import { useUiLabels } from "../../labels"
import { vi as vietnamese } from "../../locales/vi"
import { en } from "../../locales/en"
import {
  createDarkraiseI18n,
  AppI18nProvider,
  resolveBrowserLocale,
  changeAppLanguage,
} from "./index"

const resources = {
  en: { translation: { greeting: "Hello" } },
  vi: { translation: { greeting: "Xin chào" } },
}
const locales = [en, vietnamese]
function Probe() {
  const { t } = useTranslation()
  const labels = useUiLabels()
  return (
    <p>
      {t("greeting")} / {labels.dataTable.empty}
    </p>
  )
}
beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("optional application integration", () => {
  it("keeps two instances isolated while updating both UI and app messages", async () => {
    const a = await createDarkraiseI18n({ locale: "en", locales, resources })
    const b = await createDarkraiseI18n({ locale: "en", locales, resources })
    render(
      <>
        <section aria-label="A">
          <AppI18nProvider instance={a} locales={locales}>
            <Probe />
          </AppI18nProvider>
        </section>
        <section aria-label="B">
          <AppI18nProvider instance={b} locales={locales}>
            <Probe />
          </AppI18nProvider>
        </section>
      </>,
    )
    await act(() => changeAppLanguage(a, "vi"))
    expect(
      within(screen.getByRole("region", { name: "A" })).getByText(
        "Xin chào / Không tìm thấy kết quả",
      ),
    ).toBeVisible()
    expect(
      within(screen.getByRole("region", { name: "B" })).getByText(
        "Hello / No results found",
      ),
    ).toBeVisible()
  })
  it("persists only when configured and restores document attributes on unmount", async () => {
    const instance = await createDarkraiseI18n({
      locale: "en",
      locales,
      resources,
    })
    document.documentElement.lang = "fr"
    const { unmount } = render(
      <AppI18nProvider
        instance={instance}
        locales={locales}
        storageKey="test.language"
        syncDocument
      >
        <Probe />
      </AppI18nProvider>,
    )
    await act(() => changeAppLanguage(instance, "vi"))
    expect(document.documentElement.lang).toBe("vi")
    expect(localStorage.getItem("test.language")).toBe("vi")
    unmount()
    expect(document.documentElement.lang).toBe("fr")
  })
  it("resolves explicit, stored, browser, and fallback preferences", () => {
    localStorage.setItem("test.language", "vi")
    expect(
      resolveBrowserLocale({
        initialLocale: "en",
        storageKey: "test.language",
        locales,
      }),
    ).toBe("en")
    expect(resolveBrowserLocale({ storageKey: "test.language", locales })).toBe(
      "vi",
    )
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("Denied")
    })
    expect(
      resolveBrowserLocale({
        storageKey: "test.language",
        locales,
        browserLocales: ["vi-VN"],
      }),
    ).toBe("vi")
    expect(resolveBrowserLocale({ locales, browserLocales: ["de"] })).toBe("en")
  })
  it("serializes rapid requests and leaves the final requested language active", async () => {
    const instance = await createDarkraiseI18n({
      locale: "en",
      locales,
      resources,
    })
    await Promise.all([
      changeAppLanguage(instance, "vi"),
      changeAppLanguage(instance, "en"),
    ])
    expect(instance.language).toBe("en")
  })
  it("rejects loading failure before changing the active language", async () => {
    const instance = await createDarkraiseI18n({
      locale: "en",
      locales,
      resources,
    })
    vi.spyOn(instance, "loadLanguages").mockImplementation(
      (_locale, callback) => {
        callback?.(new Error("Offline"))
        return Promise.resolve()
      },
    )
    await expect(changeAppLanguage(instance, "vi")).rejects.toMatchObject({
      message: "Offline",
    })
    expect(instance.language).toBe("en")
  })
})
