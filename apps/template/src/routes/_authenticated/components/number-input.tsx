import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputLabel,
} from "darkraise-ui/components/number-input"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/number-input")(
  {
    component: NumberInputPage,
  },
)

function IntegerExample() {
  const [value, setValue] = useState(5)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      min={0}
      max={100}
      step={1}
      precision={0}
    >
      <NumberInputLabel>Quantity</NumberInputLabel>
      <NumberInputControl>
        <NumberInputField placeholder="0" />
        <NumberInputIncrementTrigger />
        <NumberInputDecrementTrigger />
      </NumberInputControl>
    </NumberInput>
  )
}

function PrecisionExample() {
  const [value, setValue] = useState(1.25)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      step={0.25}
      precision={2}
    >
      <NumberInputLabel>Decimal value</NumberInputLabel>
      <NumberInputControl>
        <NumberInputField />
        <NumberInputIncrementTrigger />
        <NumberInputDecrementTrigger />
      </NumberInputControl>
    </NumberInput>
  )
}

function CurrencyExample() {
  const [value, setValue] = useState(99.99)
  return (
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
  )
}

function MinMaxExample() {
  const [value, setValue] = useState(50)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      min={0}
      max={100}
      step={5}
    >
      <NumberInputLabel>Volume (0-100, clamps on blur)</NumberInputLabel>
      <NumberInputControl>
        <NumberInputField />
        <NumberInputIncrementTrigger />
        <NumberInputDecrementTrigger />
      </NumberInputControl>
    </NumberInput>
  )
}

function NumberInputPage() {
  return (
    <ShowcasePage
      title="Number Input"
      description="Numeric input with steppers, keyboard support, locale formatting, and min/max clamp on blur."
    >
      <ShowcaseExample
        title="Integer-only input"
        code={`const [value, setValue] = useState(5)

<NumberInput
  value={value}
  onValueChange={(d) => setValue(d.valueAsNumber)}
  min={0}
  max={100}
  step={1}
  precision={0}
>
  <NumberInputLabel>Quantity</NumberInputLabel>
  <NumberInputControl>
    <NumberInputField placeholder="0" />
    <NumberInputIncrementTrigger />
    <NumberInputDecrementTrigger />
  </NumberInputControl>
</NumberInput>`}
      >
        <IntegerExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Decimal precision"
        code={`const [value, setValue] = useState(1.25)

<NumberInput
  value={value}
  onValueChange={(d) => setValue(d.valueAsNumber)}
  step={0.25}
  precision={2}
>
  <NumberInputLabel>Decimal value</NumberInputLabel>
  <NumberInputControl>
    <NumberInputField />
    <NumberInputIncrementTrigger />
    <NumberInputDecrementTrigger />
  </NumberInputControl>
</NumberInput>`}
      >
        <PrecisionExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Currency formatting"
        code={`const [value, setValue] = useState(99.99)

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
</NumberInput>`}
      >
        <CurrencyExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Min/max with clamp on blur"
        code={`const [value, setValue] = useState(50)

<NumberInput
  value={value}
  onValueChange={(d) => setValue(d.valueAsNumber)}
  min={0}
  max={100}
  step={5}
>
  <NumberInputLabel>Volume (0-100, clamps on blur)</NumberInputLabel>
  <NumberInputControl>
    <NumberInputField />
    <NumberInputIncrementTrigger />
    <NumberInputDecrementTrigger />
  </NumberInputControl>
</NumberInput>`}
      >
        <MinMaxExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
