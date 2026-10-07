import { createFileRoute } from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputField,
  PasswordInputIndicator,
  PasswordInputLabel,
  PasswordInputVisibilityTrigger,
} from "darkraise-ui/components/password-input"
import { cn } from "darkraise-ui/lib"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/password-input",
)({
  component: PasswordInputPage,
})

function getStrength(value: string): "weak" | "fair" | "strong" {
  if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) {
    return "strong"
  }
  if (value.length >= 8) return "fair"
  return "weak"
}

const STRENGTH_LEVELS = {
  weak: { segments: 1, fill: "bg-destructive-solid" },
  fair: { segments: 2, fill: "bg-warning-solid" },
  strong: { segments: 3, fill: "bg-success-solid" },
} as const

function StrengthMeter({ strength }: { strength: "weak" | "fair" | "strong" }) {
  const level = STRENGTH_LEVELS[strength]
  return (
    <div aria-hidden="true" data-strength-meter="" className="flex gap-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          data-segment=""
          data-filled={index < level.segments ? "" : undefined}
          className={cn(
            "h-1.5 flex-1 rounded-full border border-[var(--field-edge)]",
            index < level.segments && level.fill,
          )}
        />
      ))}
    </div>
  )
}

function StrengthMeterExample() {
  const [value, setValue] = useState("")
  const strength = getStrength(value)
  return (
    <PasswordInput>
      <PasswordInputLabel>Choose a password</PasswordInputLabel>
      <PasswordInputControl>
        <PasswordInputField
          placeholder="At least 8 characters"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <PasswordInputVisibilityTrigger>
          <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
        </PasswordInputVisibilityTrigger>
      </PasswordInputControl>
      <StrengthMeter strength={strength} />
      <div
        aria-live="polite"
        data-strength={strength}
        className="text-muted-foreground text-xs"
      >
        Strength: {strength}
      </div>
    </PasswordInput>
  )
}

function ValidationExample() {
  const [value, setValue] = useState("")
  const tooShort = value.length > 0 && value.length < 8
  return (
    <PasswordInput>
      <PasswordInputLabel>Password (min 8 characters)</PasswordInputLabel>
      <PasswordInputControl>
        <PasswordInputField
          placeholder="Type at least 8 characters"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={tooShort || undefined}
          minLength={8}
        />
        <PasswordInputVisibilityTrigger>
          <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
        </PasswordInputVisibilityTrigger>
      </PasswordInputControl>
      <div
        aria-live="polite"
        className="text-destructive-text text-xs"
        data-invalid={tooShort ? "true" : "false"}
      >
        {tooShort ? "Password must be at least 8 characters." : " "}
      </div>
    </PasswordInput>
  )
}

function PasswordInputPage() {
  return (
    <ShowcasePage
      title="Password Input"
      description="Composition over the input primitive that adds an eye-toggle to reveal or hide the value."
    >
      <ShowcaseExample
        title="Basic password field"
        code={`<PasswordInput>
  <PasswordInputLabel>Password</PasswordInputLabel>
  <PasswordInputControl>
    <PasswordInputField placeholder="Enter password" />
    <PasswordInputVisibilityTrigger>
      <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
    </PasswordInputVisibilityTrigger>
  </PasswordInputControl>
</PasswordInput>`}
      >
        <PasswordInput>
          <PasswordInputLabel>Password</PasswordInputLabel>
          <PasswordInputControl>
            <PasswordInputField placeholder="Enter password" />
            <PasswordInputVisibilityTrigger>
              <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
            </PasswordInputVisibilityTrigger>
          </PasswordInputControl>
        </PasswordInput>
      </ShowcaseExample>

      <ShowcaseExample
        title="With strength meter"
        code={`function getStrength(value: string): "weak" | "fair" | "strong" {
  if (value.length >= 12 && /[A-Z]/.test(value) && /[0-9]/.test(value)) return "strong"
  if (value.length >= 8) return "fair"
  return "weak"
}

const STRENGTH_LEVELS = {
  weak: { segments: 1, fill: "bg-destructive-solid" },
  fair: { segments: 2, fill: "bg-warning-solid" },
  strong: { segments: 3, fill: "bg-success-solid" },
} as const

const [value, setValue] = useState("")
const strength = getStrength(value)
const level = STRENGTH_LEVELS[strength]

<PasswordInput>
  <PasswordInputLabel>Choose a password</PasswordInputLabel>
  <PasswordInputControl>
    <PasswordInputField value={value} onChange={(e) => setValue(e.target.value)} />
    <PasswordInputVisibilityTrigger>
      <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
    </PasswordInputVisibilityTrigger>
  </PasswordInputControl>
  {/* Bordered segments stay visible at rest and under forced colours;
      the text below carries the strength for assistive technology. */}
  <div aria-hidden="true" className="flex gap-1">
    {[0, 1, 2].map((index) => (
      <span
        key={index}
        className={cn(
          "h-1.5 flex-1 rounded-full border border-[var(--field-edge)]",
          index < level.segments && level.fill,
        )}
      />
    ))}
  </div>
  <div aria-live="polite">Strength: {strength}</div>
</PasswordInput>`}
      >
        <StrengthMeterExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="With min-length validation"
        code={`const [value, setValue] = useState("")
const tooShort = value.length > 0 && value.length < 8

<PasswordInput>
  <PasswordInputLabel>Password (min 8 characters)</PasswordInputLabel>
  <PasswordInputControl>
    <PasswordInputField
      value={value}
      onChange={(e) => setValue(e.target.value)}
      aria-invalid={tooShort || undefined}
      minLength={8}
    />
    <PasswordInputVisibilityTrigger>
      <PasswordInputIndicator visible={<EyeOff />} hidden={<Eye />} />
    </PasswordInputVisibilityTrigger>
  </PasswordInputControl>
  {tooShort && <div>Password must be at least 8 characters.</div>}
</PasswordInput>`}
      >
        <ValidationExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
