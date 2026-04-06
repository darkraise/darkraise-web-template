import { useState, type ReactNode } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { cn } from "@/core/lib/utils"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute(
  "/_authenticated/components/customization",
)({
  component: CustomizationPage,
})

// ── Example 1: Success & warning button variants ──────────────────────────────

const customButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        success:
          "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "success",
      size: "default",
    },
  },
)

interface CustomButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof customButtonVariants> {}

function CustomButton({
  className,
  variant,
  size,
  ...props
}: CustomButtonProps) {
  return (
    <button
      className={cn(customButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const CUSTOM_BUTTON_CODE = `const customButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 ...",
  {
    variants: {
      variant: {
        success:
          "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: { variant: "success", size: "default" },
  },
)

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof customButtonVariants> {}

function CustomButton({ className, variant, size, ...props }: CustomButtonProps) {
  return (
    <button
      className={cn(customButtonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// Usage
<CustomButton variant="success">Confirm</CustomButton>
<CustomButton variant="warning" size="sm">Caution</CustomButton>`

// ── Example 2: Compact card variant ──────────────────────────────────────────

const cardVariants = cva(
  "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      size: {
        default: "p-6",
        compact: "p-3",
      },
    },
    defaultVariants: { size: "default" },
  },
)

interface CustomCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

function CustomCard({ className, size, children, ...props }: CustomCardProps) {
  return (
    <div className={cn(cardVariants({ size, className }))} {...props}>
      {children}
    </div>
  )
}

const COMPACT_CARD_CODE = `const cardVariants = cva(
  "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      size: {
        default: "p-6",
        compact: "p-3",
      },
    },
    defaultVariants: { size: "default" },
  },
)

function CustomCard({ className, size, children, ...props }) {
  return (
    <div className={cn(cardVariants({ size, className }))} {...props}>
      {children}
    </div>
  )
}

// Usage
<CustomCard size="default">
  <h3 className="font-semibold">Default Padding</h3>
  <p className="text-sm text-muted-foreground">Standard 24px padding.</p>
</CustomCard>

<CustomCard size="compact">
  <h3 className="font-semibold">Compact Padding</h3>
  <p className="text-sm text-muted-foreground">Tight 12px padding for dense UIs.</p>
</CustomCard>`

// ── Example 3: Closable badge ─────────────────────────────────────────────────

const closableBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

interface ClosableBadgeProps extends VariantProps<
  typeof closableBadgeVariants
> {
  children: ReactNode
  onClose: () => void
}

function ClosableBadge({ children, onClose, variant }: ClosableBadgeProps) {
  return (
    <span className={cn(closableBadgeVariants({ variant }))}>
      {children}
      <button
        type="button"
        onClick={onClose}
        className="ml-0.5 rounded-full p-0.5 hover:bg-black/20 dark:hover:bg-white/20"
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

const CLOSABLE_BADGE_CODE = `function ClosableBadge({ children, onClose, variant }) {
  return (
    <span className={cn(closableBadgeVariants({ variant }))}>
      {children}
      <button
        type="button"
        onClick={onClose}
        className="ml-0.5 rounded-full p-0.5 hover:bg-black/20 dark:hover:bg-white/20"
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// Usage with useState
const [tags, setTags] = useState(["React", "TypeScript", "Tailwind", "Vite", "Radix"])

{tags.map((tag) => (
  <ClosableBadge
    key={tag}
    onClose={() => setTags((prev) => prev.filter((t) => t !== tag))}
  >
    {tag}
  </ClosableBadge>
))}`

// ── Example 4: Gradient button ────────────────────────────────────────────────

const gradientButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        purple:
          "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
        blue: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
        green:
          "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
      },
    },
    defaultVariants: { variant: "purple" },
  },
)

interface GradientButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {}

function GradientButton({ className, variant, ...props }: GradientButtonProps) {
  return (
    <button
      className={cn(gradientButtonVariants({ variant, className }))}
      {...props}
    />
  )
}

const GRADIENT_BUTTON_CODE = `const gradientButtonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-all ...",
  {
    variants: {
      variant: {
        purple:
          "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
        blue:
          "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
        green:
          "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
      },
    },
    defaultVariants: { variant: "purple" },
  },
)

function GradientButton({ className, variant, ...props }) {
  return (
    <button
      className={cn(gradientButtonVariants({ variant, className }))}
      {...props}
    />
  )
}

// Usage
<GradientButton variant="purple">Purple → Pink</GradientButton>
<GradientButton variant="blue">Blue → Cyan</GradientButton>
<GradientButton variant="green">Green → Emerald</GradientButton>`

// ── Example 5: Input with prefix/suffix slots ─────────────────────────────────

interface SlottedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputPrefix?: ReactNode
  inputSuffix?: ReactNode
}

function SlottedInput({
  inputPrefix,
  inputSuffix,
  className,
  ...props
}: SlottedInputProps) {
  return (
    <div className="border-input bg-background ring-offset-background focus-within:ring-ring flex h-10 w-full overflow-hidden rounded-md border text-sm focus-within:ring-2 focus-within:ring-offset-2">
      {inputPrefix && (
        <span className="bg-muted text-muted-foreground flex items-center px-3">
          {inputPrefix}
        </span>
      )}
      <input
        className={cn(
          "placeholder:text-muted-foreground flex-1 bg-transparent px-3 py-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      {inputSuffix && (
        <span className="bg-muted text-muted-foreground flex items-center px-3">
          {inputSuffix}
        </span>
      )}
    </div>
  )
}

const SLOTTED_INPUT_CODE = `interface SlottedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: ReactNode
  suffix?: ReactNode
}

function SlottedInput({ prefix, suffix, className, ...props }: SlottedInputProps) {
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {prefix && (
        <span className="flex items-center bg-muted px-3 text-muted-foreground">
          {prefix}
        </span>
      )}
      <input
        className={cn("flex-1 bg-transparent px-3 py-2 ...", className)}
        {...props}
      />
      {suffix && (
        <span className="flex items-center bg-muted px-3 text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  )
}

// Usage
<SlottedInput inputPrefix="https://" placeholder="example.com" />
<SlottedInput inputPrefix="$" inputSuffix=".00" placeholder="0" type="number" />`

// ── Example 6: General extension pattern (StatusDot) ─────────────────────────

const statusDotVariants = cva("inline-block rounded-full", {
  variants: {
    color: {
      green: "bg-green-500",
      yellow: "bg-amber-400",
      red: "bg-red-500",
      gray: "bg-muted-foreground",
    },
    size: {
      sm: "h-2 w-2",
      md: "h-3 w-3",
      lg: "h-4 w-4",
    },
  },
  defaultVariants: { color: "gray", size: "md" },
})

interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  className?: string
}

function StatusDot({ color, size, className }: StatusDotProps) {
  return <span className={cn(statusDotVariants({ color, size, className }))} />
}

const STATUS_DOT_CODE = `// Step 1 — Define variants with cva()
const statusDotVariants = cva("inline-block rounded-full", {
  variants: {
    color: {
      green: "bg-green-500",
      yellow: "bg-amber-400",
      red: "bg-red-500",
      gray: "bg-muted-foreground",
    },
    size: {
      sm: "h-2 w-2",
      md: "h-3 w-3",
      lg: "h-4 w-4",
    },
  },
  defaultVariants: { color: "gray", size: "md" },
})

// Step 2 — Create component using cn() to merge variants with className overrides
interface StatusDotProps extends VariantProps<typeof statusDotVariants> {
  className?: string
}

function StatusDot({ color, size, className }: StatusDotProps) {
  return <span className={cn(statusDotVariants({ color, size, className }))} />
}

// Step 3 — Export and use
<StatusDot color="green" />   // online
<StatusDot color="yellow" />  // degraded
<StatusDot color="red" />     // down
<StatusDot color="gray" />    // unknown
<StatusDot color="green" size="lg" /> // large indicator`

// ── Page component ────────────────────────────────────────────────────────────

function ClosableBadgeDemo() {
  const [tags, setTags] = useState([
    "React",
    "TypeScript",
    "Tailwind",
    "Vite",
    "Radix",
  ])
  return (
    <div className="flex flex-wrap gap-2">
      {tags.length === 0 ? (
        <span className="text-muted-foreground text-sm">
          All tags removed. Refresh to reset.
        </span>
      ) : (
        tags.map((tag) => (
          <ClosableBadge
            key={tag}
            onClose={() => setTags((prev) => prev.filter((t) => t !== tag))}
          >
            {tag}
          </ClosableBadge>
        ))
      )}
    </div>
  )
}

function CustomizationPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Customization" },
        ]}
        title="Customization"
        description="Extend shadcn/ui components with new CVA variants without touching the source."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="Success & warning button variants"
          code={CUSTOM_BUTTON_CODE}
        >
          <div className="flex flex-wrap items-center gap-3">
            <CustomButton variant="success" size="sm">
              Saved
            </CustomButton>
            <CustomButton variant="success">Confirm</CustomButton>
            <CustomButton variant="success" size="lg">
              Approve
            </CustomButton>
            <CustomButton variant="warning" size="sm">
              Caution
            </CustomButton>
            <CustomButton variant="warning">Warn</CustomButton>
            <CustomButton variant="warning" size="lg">
              Review
            </CustomButton>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Compact card variant" code={COMPACT_CARD_CODE}>
          <div className="grid grid-cols-2 gap-4">
            <CustomCard size="default">
              <h3 className="font-semibold">Default Padding</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Standard 24px padding for regular cards.
              </p>
            </CustomCard>
            <CustomCard size="compact">
              <h3 className="font-semibold">Compact Padding</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Tight 12px padding for dense UIs.
              </p>
            </CustomCard>
          </div>
        </ShowcaseExample>

        <ShowcaseExample title="Closable badge" code={CLOSABLE_BADGE_CODE}>
          <ClosableBadgeDemo />
        </ShowcaseExample>

        <ShowcaseExample title="Gradient button" code={GRADIENT_BUTTON_CODE}>
          <div className="flex flex-wrap gap-3">
            <GradientButton variant="purple">Purple → Pink</GradientButton>
            <GradientButton variant="blue">Blue → Cyan</GradientButton>
            <GradientButton variant="green">Green → Emerald</GradientButton>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Input with prefix/suffix slots"
          code={SLOTTED_INPUT_CODE}
        >
          <div className="max-w-sm space-y-3">
            <SlottedInput inputPrefix="https://" placeholder="example.com" />
            <SlottedInput
              inputPrefix="$"
              inputSuffix=".00"
              placeholder="0"
              type="number"
            />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="The general extension pattern"
          code={STATUS_DOT_CODE}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-sm">
              <StatusDot color="green" />
              Online
            </span>
            <span className="flex items-center gap-2 text-sm">
              <StatusDot color="yellow" />
              Degraded
            </span>
            <span className="flex items-center gap-2 text-sm">
              <StatusDot color="red" />
              Down
            </span>
            <span className="flex items-center gap-2 text-sm">
              <StatusDot color="gray" />
              Unknown
            </span>
            <span className="flex items-center gap-2 text-sm">
              <StatusDot color="green" size="lg" />
              Large
            </span>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}
