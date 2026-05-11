import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { RotateCcw, X } from "lucide-react"
import {
  NumberInput,
  NumberInputAction,
  NumberInputControl,
  NumberInputDecrementTrigger,
  NumberInputField,
  NumberInputIncrementTrigger,
  NumberInputLabel,
  NumberInputPrefix,
  NumberInputSuffix,
  NumberInputTriggerGroup,
} from "darkraise-ui/components/number-input"
import { Button } from "darkraise-ui/components/button"
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
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
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
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
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
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
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
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
      </NumberInputControl>
    </NumberInput>
  )
}

function PrefixExample() {
  const [value, setValue] = useState(19.99)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      step={0.5}
      precision={2}
      min={0}
    >
      <NumberInputLabel>Price</NumberInputLabel>
      <NumberInputControl>
        <NumberInputPrefix>$</NumberInputPrefix>
        <NumberInputField />
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
      </NumberInputControl>
    </NumberInput>
  )
}

function SuffixExample() {
  const [value, setValue] = useState(75)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      min={0}
      max={100}
      step={1}
      precision={0}
    >
      <NumberInputLabel>Opacity</NumberInputLabel>
      <NumberInputControl>
        <NumberInputField />
        <NumberInputSuffix>%</NumberInputSuffix>
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
      </NumberInputControl>
    </NumberInput>
  )
}

function PrefixAndSuffixExample() {
  const [value, setValue] = useState(1250)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      step={50}
      precision={0}
    >
      <NumberInputLabel>Currency with code</NumberInputLabel>
      <NumberInputControl>
        <NumberInputPrefix>$</NumberInputPrefix>
        <NumberInputField />
        <NumberInputSuffix>USD</NumberInputSuffix>
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
      </NumberInputControl>
    </NumberInput>
  )
}

function ActionExample() {
  const initial = 42
  const [value, setValue] = useState(initial)
  return (
    <NumberInput
      value={value}
      onValueChange={(d) => setValue(d.valueAsNumber)}
      min={0}
      max={999}
      step={1}
      precision={0}
    >
      <NumberInputLabel>Servings (clear / reset)</NumberInputLabel>
      <NumberInputControl>
        <NumberInputField />
        {value !== 0 && (
          <NumberInputAction>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear"
              onClick={() => setValue(0)}
            >
              <X className="h-4 w-4" />
            </Button>
          </NumberInputAction>
        )}
        {value !== initial && (
          <NumberInputAction>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset to default"
              onClick={() => setValue(initial)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </NumberInputAction>
        )}
        <NumberInputTriggerGroup>
          <NumberInputIncrementTrigger />
          <NumberInputDecrementTrigger />
        </NumberInputTriggerGroup>
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
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
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
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
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
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
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
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
  </NumberInputControl>
</NumberInput>`}
      >
        <MinMaxExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Prefix"
        code={`<NumberInput value={value} onValueChange={(d) => setValue(d.valueAsNumber)} step={0.5} precision={2} min={0}>
  <NumberInputLabel>Price</NumberInputLabel>
  <NumberInputControl>
    <NumberInputPrefix>$</NumberInputPrefix>
    <NumberInputField />
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
  </NumberInputControl>
</NumberInput>`}
      >
        <PrefixExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Suffix"
        code={`<NumberInput value={value} onValueChange={(d) => setValue(d.valueAsNumber)} min={0} max={100} step={1} precision={0}>
  <NumberInputLabel>Opacity</NumberInputLabel>
  <NumberInputControl>
    <NumberInputField />
    <NumberInputSuffix>%</NumberInputSuffix>
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
  </NumberInputControl>
</NumberInput>`}
      >
        <SuffixExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Prefix and suffix"
        code={`<NumberInput value={value} onValueChange={(d) => setValue(d.valueAsNumber)} step={50} precision={0}>
  <NumberInputLabel>Currency with code</NumberInputLabel>
  <NumberInputControl>
    <NumberInputPrefix>$</NumberInputPrefix>
    <NumberInputField />
    <NumberInputSuffix>USD</NumberInputSuffix>
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
  </NumberInputControl>
</NumberInput>`}
      >
        <PrefixAndSuffixExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Action buttons (clear / reset)"
        code={`const initial = 42
const [value, setValue] = useState(initial)

<NumberInput value={value} onValueChange={(d) => setValue(d.valueAsNumber)} min={0} max={999} step={1} precision={0}>
  <NumberInputLabel>Servings (clear / reset)</NumberInputLabel>
  <NumberInputControl>
    <NumberInputField />
    {value !== 0 && (
      <NumberInputAction>
        <Button variant="ghost" size="icon" aria-label="Clear" onClick={() => setValue(0)}>
          <X className="h-4 w-4" />
        </Button>
      </NumberInputAction>
    )}
    {value !== initial && (
      <NumberInputAction>
        <Button variant="ghost" size="icon" aria-label="Reset to default" onClick={() => setValue(initial)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </NumberInputAction>
    )}
    <NumberInputTriggerGroup>
      <NumberInputIncrementTrigger />
      <NumberInputDecrementTrigger />
    </NumberInputTriggerGroup>
  </NumberInputControl>
</NumberInput>`}
      >
        <ActionExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
