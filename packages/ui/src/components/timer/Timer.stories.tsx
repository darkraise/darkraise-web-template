import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  Timer,
  TimerActionTrigger,
  TimerArea,
  TimerControl,
  TimerItem,
  TimerSeparator,
} from "./Timer"

const meta: Meta<typeof Timer> = {
  title: "UI/Timer",
  component: Timer,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Timer>

export const Countdown: Story = {
  render: () => (
    <Timer countdown targetMs={5 * 60 * 1000}>
      <TimerArea>
        <TimerItem type="minutes" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="seconds" />
      </TimerArea>
      <TimerControl>
        <TimerActionTrigger action="start">Start</TimerActionTrigger>
        <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
        <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
        <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
      </TimerControl>
    </Timer>
  ),
}

export const Stopwatch: Story = {
  render: () => (
    <Timer interval={100}>
      <TimerArea>
        <TimerItem type="minutes" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="seconds" />
      </TimerArea>
      <TimerControl>
        <TimerActionTrigger action="start">Start</TimerActionTrigger>
        <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
        <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
        <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
      </TimerControl>
    </Timer>
  ),
}

export const CustomFormatWithDays: Story = {
  render: () => (
    <Timer countdown targetMs={2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000}>
      <TimerArea>
        <TimerItem type="days" />
        <TimerSeparator>d</TimerSeparator>
        <TimerItem type="hours" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="minutes" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="seconds" />
      </TimerArea>
      <TimerControl>
        <TimerActionTrigger action="start">Start</TimerActionTrigger>
        <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
        <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
        <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
      </TimerControl>
    </Timer>
  ),
}
