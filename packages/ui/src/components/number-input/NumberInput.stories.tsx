import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputLabel,
} from "./NumberInput"

const meta: Meta<typeof NumberInput> = {
  title: "UI/NumberInput",
  component: NumberInput,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof NumberInput>

export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState(5)
    return (
      <div style={{ width: 240 }}>
        <NumberInput
          value={value}
          onValueChange={(d) => setValue(d.valueAsNumber)}
          min={0}
          max={100}
          step={1}
        >
          <NumberInputLabel>Quantity</NumberInputLabel>
          <NumberInputControl>
            <NumberInputField placeholder="0" />
            <NumberInputIncrementTrigger />
            <NumberInputDecrementTrigger />
          </NumberInputControl>
        </NumberInput>
      </div>
    )
  },
}

export const Currency: Story = {
  render: () => {
    const [value, setValue] = React.useState(1234.5)
    return (
      <div style={{ width: 280 }}>
        <NumberInput
          value={value}
          onValueChange={(d) => setValue(d.valueAsNumber)}
          formatOptions={{ style: "currency", currency: "USD" }}
          locale="en-US"
          step={1}
        >
          <NumberInputLabel>Price</NumberInputLabel>
          <NumberInputControl>
            <NumberInputField />
            <NumberInputIncrementTrigger />
            <NumberInputDecrementTrigger />
          </NumberInputControl>
        </NumberInput>
      </div>
    )
  },
}

export const Percent: Story = {
  render: () => {
    const [value, setValue] = React.useState(0.25)
    return (
      <div style={{ width: 240 }}>
        <NumberInput
          value={value}
          onValueChange={(d) => setValue(d.valueAsNumber)}
          formatOptions={{ style: "percent" }}
          locale="en-US"
          step={0.05}
          precision={2}
          min={0}
          max={1}
        >
          <NumberInputLabel>Discount</NumberInputLabel>
          <NumberInputControl>
            <NumberInputField />
            <NumberInputIncrementTrigger />
            <NumberInputDecrementTrigger />
          </NumberInputControl>
        </NumberInput>
      </div>
    )
  },
}

export const MinMax: Story = {
  render: () => {
    const [value, setValue] = React.useState(50)
    return (
      <div style={{ width: 240 }}>
        <NumberInput
          value={value}
          onValueChange={(d) => setValue(d.valueAsNumber)}
          min={0}
          max={100}
          step={5}
        >
          <NumberInputLabel>Volume (0-100)</NumberInputLabel>
          <NumberInputControl>
            <NumberInputField />
            <NumberInputIncrementTrigger />
            <NumberInputDecrementTrigger />
          </NumberInputControl>
        </NumberInput>
      </div>
    )
  },
}
