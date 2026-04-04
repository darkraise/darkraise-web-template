import type { ReactNode } from "react"

function FloatingShape({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
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
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>

      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {/* Gradient mesh background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, hsl(var(--primary) / 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, hsl(var(--chart-2) / 0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 40% 80%, hsl(var(--chart-3) / 0.2) 0%, transparent 50%),
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
            background: "hsl(var(--chart-2) / 0.1)",
            border: "1px solid hsl(var(--chart-2) / 0.15)",
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
            background: "hsl(var(--chart-3) / 0.12)",
            border: "1px solid hsl(var(--chart-3) / 0.18)",
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
                background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--chart-2) / 0.2))`,
                border: "1px solid hsl(var(--primary) / 0.15)",
                backdropFilter: "blur(8px)",
              }}
            />
            <div
              className="absolute -bottom-3 -right-3 h-20 w-20 rounded-xl"
              style={{
                background: `linear-gradient(135deg, hsl(var(--chart-2) / 0.15), hsl(var(--chart-3) / 0.15))`,
                border: "1px solid hsl(var(--chart-2) / 0.1)",
              }}
            />
            <div
              className="absolute -left-4 -top-4 h-12 w-12 rounded-lg"
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
