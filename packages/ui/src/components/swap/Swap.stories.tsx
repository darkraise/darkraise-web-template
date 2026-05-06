import type { Meta, StoryObj } from "@storybook/react-vite"
import { Moon, Pause, Play, Sun } from "lucide-react"
import { useState } from "react"
import { Swap, SwapIndicator } from "./Swap"

const meta: Meta<typeof Swap> = {
  title: "UI/Swap",
  component: Swap,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Swap>

export const Default: Story = {
  render: () => {
    const [pressed, setPressed] = useState(false)
    return (
      <button
        type="button"
        className="dr-button"
        onClick={() => setPressed((p) => !p)}
      >
        <Swap pressed={pressed}>
          <SwapIndicator state="on">
            <Moon className="h-5 w-5" />
          </SwapIndicator>
          <SwapIndicator state="off">
            <Sun className="h-5 w-5" />
          </SwapIndicator>
        </Swap>
      </button>
    )
  },
}

export const ThemeToggle: Story = {
  render: () => {
    const [isDark, setIsDark] = useState(false)
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="dr-button"
        onClick={() => setIsDark((v) => !v)}
      >
        <Swap pressed={isDark}>
          <SwapIndicator state="on">
            <Moon className="h-5 w-5" />
          </SwapIndicator>
          <SwapIndicator state="off">
            <Sun className="h-5 w-5" />
          </SwapIndicator>
        </Swap>
      </button>
    )
  },
}

export const PlayPause: Story = {
  render: () => {
    const [playing, setPlaying] = useState(false)
    return (
      <button
        type="button"
        aria-label="Play or pause"
        className="dr-button"
        onClick={() => setPlaying((v) => !v)}
      >
        <Swap pressed={playing}>
          <SwapIndicator state="on">
            <Pause className="h-5 w-5" />
          </SwapIndicator>
          <SwapIndicator state="off">
            <Play className="h-5 w-5" />
          </SwapIndicator>
        </Swap>
      </button>
    )
  },
}
