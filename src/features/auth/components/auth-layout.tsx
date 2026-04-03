import type { ReactNode } from "react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>
      <div className="hidden flex-1 bg-primary/5 lg:block">
        <div className="flex h-full items-center justify-center">
          <div className="h-32 w-32 rounded-2xl bg-primary/10" />
        </div>
      </div>
    </div>
  )
}
