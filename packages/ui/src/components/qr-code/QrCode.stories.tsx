import type { Meta, StoryObj } from "@storybook/react-vite"

import { QrCode, QrCodeFrame, QrCodeOverlay } from "./QrCode"

const VCARD = [
  "BEGIN:VCARD",
  "VERSION:3.0",
  "FN:John Doe",
  "TEL:+1234567890",
  "EMAIL:john@example.com",
  "END:VCARD",
].join("\n")

const meta: Meta<typeof QrCode> = {
  title: "UI/QrCode",
  component: QrCode,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof QrCode>

export const Default: Story = {
  render: () => <QrCode value="https://example.com" />,
}

export const VCard: Story = {
  render: () => <QrCode value={VCARD} level="M" size={220} />,
}

export const WithLogoOverlay: Story = {
  render: () => (
    <QrCode value="https://example.com" level="H" size={220}>
      <QrCodeFrame />
      <QrCodeOverlay>
        <span className="bg-background flex h-12 w-12 items-center justify-center rounded-md text-xs font-bold">
          DR
        </span>
      </QrCodeOverlay>
    </QrCode>
  ),
}

export const ThemeAwareForeground: Story = {
  render: () => (
    <div className="text-primary">
      <QrCode value="https://example.com" />
    </div>
  ),
}
