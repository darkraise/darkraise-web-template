import type { ReactNode } from "react"
import { AppLocaleSwitcher } from "@/i18n/AppLocaleSwitcher"
import { Center, Stack } from "darkraise-ui/layout"

// --chart-N tokens hold complete colours, so alpha is mixed in rather than
// passed through hsl(), which would make the whole declaration invalid.
const chart = (n: number, percent: number) =>
  `color-mix(in srgb, var(--chart-${n}) ${percent}%, transparent)`

function FloatingShape({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      data-auth-shape
      className={className}
      style={{
        position: "absolute",
        borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
        ...style,
      }}
    />
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <div data-auth-form-column className="relative flex flex-1">
        <div
          data-auth-locale
          className="absolute end-4 top-4 z-10 lg:end-6 lg:top-6"
        >
          <AppLocaleSwitcher compact />
        </div>
        <Center className="flex-1 p-8 pt-20">
          <Stack gap="lg" className="w-full max-w-sm">
            {children}
          </Stack>
        </Center>
      </div>

      <div
        data-auth-decor
        className="border-border relative hidden flex-1 overflow-hidden border-s lg:block"
      >
        {/* Gradient mesh background */}
        <div
          data-auth-mesh
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, ${chart(2, 25)} 0%, transparent 50%),
              radial-gradient(ellipse at 40% 80%, ${chart(3, 20)} 0%, transparent 50%),
              hsl(var(--primary) / 0.05)
            `,
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating geometric shapes */}
        <FloatingShape
          className="animate-pulse-subtle"
          style={{
            top: "15%",
            left: "20%",
            width: "120px",
            height: "120px",
            background: "hsl(var(--primary) / 0.15)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        />
        <FloatingShape
          className="animate-pulse-subtle"
          style={{
            top: "55%",
            right: "15%",
            width: "180px",
            height: "180px",
            background: chart(2, 10),
            border: `1px solid ${chart(2, 15)}`,
            animationDelay: "1s",
            borderRadius: "70% 30% 30% 70% / 60% 40% 60% 40%",
          }}
        />
        <FloatingShape
          className="animate-pulse-subtle"
          style={{
            bottom: "20%",
            left: "30%",
            width: "80px",
            height: "80px",
            background: chart(3, 12),
            border: `1px solid ${chart(3, 18)}`,
            animationDelay: "0.5s",
            borderRadius: "50%",
          }}
        />
        <FloatingShape
          style={{
            top: "30%",
            right: "30%",
            width: "60px",
            height: "60px",
            background: "hsl(var(--primary) / 0.08)",
            border: "1px solid hsl(var(--primary) / 0.12)",
            borderRadius: "50%",
          }}
        />

        {/* Central decorative element */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div
              className="h-32 w-32 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), ${chart(2, 20)})`,
                border: "1px solid hsl(var(--primary) / 0.15)",
                backdropFilter: "blur(8px)",
              }}
            />
            <div
              className="absolute -right-3 -bottom-3 h-20 w-20 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${chart(2, 15)}, ${chart(3, 15)})`,
                border: `1px solid ${chart(2, 10)}`,
              }}
            />
            <div
              className="absolute -top-4 -left-4 h-12 w-12 rounded-lg"
              style={{
                background: `hsl(var(--primary) / 0.12)`,
                border: "1px solid hsl(var(--primary) / 0.08)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
