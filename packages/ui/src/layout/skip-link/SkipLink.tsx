interface SkipLinkProps {
  targetId?: string
  children?: React.ReactNode
}

export function SkipLink({
  targetId = "main-content",
  children = "Skip to content",
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="bg-primary text-primary-foreground focus-visible:ring-ring fixed top-4 left-4 z-[100] -translate-y-20 rounded-md px-4 py-2 text-sm font-medium shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2"
    >
      {children}
    </a>
  )
}
