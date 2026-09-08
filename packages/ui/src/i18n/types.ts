import type { ReactNode } from "react"
import type { DeepPartialLabels, UiLabels } from "../labels/types"
import type { UiTextKey } from "./controlMessages"
import type { themeMessages } from "./themeMessages"
import type { IntlTranslations } from "../components/image-cropper/types"

export interface UiMessages extends UiLabels {
  controls: Record<UiTextKey, string>
  themeOptions: Record<keyof typeof themeMessages, string>
  imageCropper: IntlTranslations
  announcements: {
    remove: (name: string) => string
    select: (name: string) => string
    expand: (name: string) => string
    collapse: (name: string) => string
    slide: (index: number) => string
    contributions: (count: number, date: string) => string
  }
  dateInput: { year: string; month: string; day: string }
  common: {
    language: string
  }
}
export interface UiLocaleDefinition {
  locale: string
  label: string
  dir?: "ltr" | "rtl"
  messages: DeepPartialLabels<UiMessages>
}
export interface UiFormattingOptions {
  number?: Intl.NumberFormatOptions
  date?: Intl.DateTimeFormatOptions
  time?: Intl.DateTimeFormatOptions
  timeZone?: string
}
export interface UiI18nProviderProps {
  locale?: string
  locales?: readonly UiLocaleDefinition[]
  labels?: DeepPartialLabels<UiMessages>
  dir?: "ltr" | "rtl"
  formats?: UiFormattingOptions
  children: ReactNode
}
export interface UiLocaleState {
  locale: string
  messageLocale: string
  dir: "ltr" | "rtl"
  enabled: boolean
  locales: readonly UiLocaleDefinition[]
  formats: UiFormattingOptions
}
