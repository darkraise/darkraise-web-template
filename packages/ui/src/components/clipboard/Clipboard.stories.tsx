import type { Meta, StoryObj } from "@storybook/react-vite"
import { Check, Copy } from "lucide-react"
import {
  Clipboard,
  ClipboardControl,
  ClipboardIndicator,
  ClipboardInput,
  ClipboardLabel,
  ClipboardTrigger,
} from "./Clipboard"

const meta: Meta<typeof Clipboard> = {
  title: "UI/Clipboard",
  component: Clipboard,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Clipboard>

export const Default: Story = {
  render: () => (
    <Clipboard value="https://darkraise.dev">
      <ClipboardLabel>Share link</ClipboardLabel>
      <ClipboardControl>
        <ClipboardInput />
        <ClipboardTrigger>
          <ClipboardIndicator
            copied={<Check className="h-4 w-4" />}
            fallback={<Copy className="h-4 w-4" />}
          />
        </ClipboardTrigger>
      </ClipboardControl>
    </Clipboard>
  ),
}

export const ShortValue: Story = {
  render: () => (
    <Clipboard value="npm i darkraise-ui">
      <ClipboardLabel>Install</ClipboardLabel>
      <ClipboardControl>
        <ClipboardInput />
        <ClipboardTrigger>
          <ClipboardIndicator
            copied={<Check className="h-4 w-4" />}
            fallback={<Copy className="h-4 w-4" />}
          />
        </ClipboardTrigger>
      </ClipboardControl>
    </Clipboard>
  ),
}

export const LongUrlCustomTimeout: Story = {
  render: () => (
    <Clipboard
      value="https://example.com/very/long/path/to/some/resource?with=query&and=more"
      timeout={5000}
    >
      <ClipboardLabel>Long URL (5s timeout)</ClipboardLabel>
      <ClipboardControl>
        <ClipboardInput />
        <ClipboardTrigger>
          <ClipboardIndicator
            copied={<Check className="h-4 w-4" />}
            fallback={<Copy className="h-4 w-4" />}
          />
        </ClipboardTrigger>
      </ClipboardControl>
    </Clipboard>
  ),
}
