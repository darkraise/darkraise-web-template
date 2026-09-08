import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { LocaleSwitcher } from "./LocaleSwitcher"
import { UiI18nProvider } from "../../i18n"
import { en } from "../../locales/en"
import { vi } from "../../locales/vi"
import { Spinner } from "../spinner"
import { UnitedStatesFlagIcon, VietnamFlagIcon } from "./FlagIcons"

const options = [
  { ...en, icon: <UnitedStatesFlagIcon /> },
  { ...vi, icon: <VietnamFlagIcon /> },
]

const meta: Meta<typeof LocaleSwitcher> = {
  title: "UI/LocaleSwitcher",
  component: LocaleSwitcher,
  tags: ["autodocs"],
}
export default meta
type Story = StoryObj<typeof LocaleSwitcher>

function SharedLocaleExample() {
  const [locale, setLocale] = useState("en")
  return (
    <UiI18nProvider locale={locale} locales={[en, vi]}>
      <div className="flex items-center gap-4">
        <LocaleSwitcher
          value={locale}
          options={options}
          onValueChange={setLocale}
        />
        <Spinner />
      </div>
    </UiI18nProvider>
  )
}

export const SharedLocale: Story = { render: () => <SharedLocaleExample /> }
export const Pending: Story = {
  args: {
    value: "en",
    options,
    onValueChange: () => {},
    pending: true,
  },
}

export const CustomLanguage: Story = {
  args: {
    value: "fr",
    options: [
      {
        locale: "fr",
        label: "Français",
        icon: (
          <svg viewBox="0 0 3 2">
            <path fill="#002395" d="M0 0h1v2H0z" />
            <path fill="#fff" d="M1 0h1v2H1z" />
            <path fill="#ed2939" d="M2 0h1v2H2z" />
          </svg>
        ),
      },
    ],
    onValueChange: () => {},
  },
}
